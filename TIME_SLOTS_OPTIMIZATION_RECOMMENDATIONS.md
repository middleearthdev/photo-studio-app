# Time Slots Optimization Recommendations

## Current Performance Issues

The `availableTimeSlots` flow in `PackageDetailPage` is experiencing slow loading times due to several factors:

1. **Multiple Database Queries**: The `getAvailableTimeSlotsAction` function performs several database queries:
   - Fetches studio operating hours
   - Fetches existing reservations
   - Fetches blocked time slots
   - Checks facility availability (if package requires facilities)

2. **Complex Facility Availability Check**: The `checkFacilityAvailability` function makes additional database queries to check if required facilities are available for each time slot.

3. **Sequential Processing**: Time slots are generated one by one, and for each slot, multiple checks are performed.

4. **No Caching**: The current implementation doesn't implement any caching mechanism for time slot data.

## Recommended Optimizations

### 1. Add Caching to Time Slot Queries

**File to modify**: `src/hooks/use-time-slots.ts`

**Current Implementation**:
```typescript
export function useAvailableTimeSlots(studioId?: string, date?: string, packageDurationMinutes?: number, packageId?: string) {
  return useQuery({
    queryKey: timeSlotKeys.availableSlots(studioId, date, packageDurationMinutes, packageId),
    queryFn: async () => {
      if (!studioId || !date) {
        return []
      }

      const result = await getAvailableTimeSlotsAction(studioId, date, packageDurationMinutes, packageId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch time slots')
      }
      return result.data || []
    },
    enabled: !!studioId && !!date,
  })
}
```

**Recommended Implementation**:
```typescript
export function useAvailableTimeSlots(studioId?: string, date?: string, packageDurationMinutes?: number, packageId?: string) {
  return useQuery({
    queryKey: timeSlotKeys.availableSlots(studioId, date, packageDurationMinutes, packageId),
    queryFn: async () => {
      if (!studioId || !date) {
        return []
      }

      const result = await getAvailableTimeSlotsAction(studioId, date, packageDurationMinutes, packageId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch time slots')
      }
      return result.data || []
    },
    enabled: !!studioId && !!date,
    // Cache the results for 5 minutes since time slots don't change frequently
    staleTime: 5 * 60 * 1000,
    // Keep the data in cache for 10 minutes even when not used
    cacheTime: 10 * 60 * 1000,
  })
}
```

**Why this helps**:
- Reduces database load by reusing cached results for identical requests
- Improves response time for repeated requests (e.g., when users navigate between dates)
- Follows the same caching pattern used by other hooks in the application
- Time slots don't change frequently, so a 5-minute cache is reasonable

### 2. Implement Debouncing on Date Selection

**File to modify**: `src/app/packages/[id]/page.tsx`

**Add debounce to the date selection handler**:
```typescript
import { useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/use-debounce' // You'll need to create this hook

// Inside the component:
const debouncedSelectedDate = useDebounce(selectedDate, 300)

const { data: availableTimeSlots = [], isLoading: timeSlotsLoading } = useAvailableTimeSlots(
  packageData?.studio_id,
  debouncedSelectedDate ? format(debouncedSelectedDate, 'yyyy-MM-dd') : undefined,
  packageData?.duration_minutes,
  packageData?.id
)
```

**Why this helps**:
- Prevents multiple rapid requests when users quickly change dates
- Reduces server load during date selection
- Improves user experience by reducing unnecessary loading states

### 3. Optimize Server-Side Processing

**File to modify**: `src/actions/time-slots.ts`

The `generateTimeSlotsForDate` function could be optimized by:

1. **Batching Database Queries**: Instead of checking facility availability for each time slot individually, batch the checks.
2. **Parallel Processing**: Process time slots in parallel where possible.
3. **Optimized Queries**: Ensure database queries are using proper indexes.

Example optimization for facility availability check:
```typescript
// Instead of checking each slot individually, get all facility bookings for the day at once
const { data: allFacilityBookings, error: facilityBookingError } = await supabase
  .from('reservations')
  .select(`
    selected_facilities,
    start_time,
    end_time
  `)
  .eq('studio_id', studioId)
  .eq('reservation_date', date)
  .in('status', ['confirmed', 'in_progress'])

// Then check all slots against this data in memory
```

**Why this helps**:
- Reduces the number of database queries from O(n) to O(1) where n is the number of time slots
- Improves server response time
- Reduces database load

### 4. Add Loading Skeleton UI

**File to modify**: `src/app/packages/[id]/page.tsx`

Replace the simple spinner with a skeleton loading UI that mirrors the actual time slots layout:

```jsx
{timeSlotsLoading ? (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="p-4 rounded-lg bg-slate-100 animate-pulse">
        <div className="h-6 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      </div>
    ))}
  </div>
) : /* existing code */}
```

**Why this helps**:
- Improves perceived performance by showing immediate feedback
- Provides a better user experience while data is loading
- Reduces the feeling of "lag" when selecting dates

## Additional Considerations

### Prefetching
Consider prefetching time slots for the next week when a user selects a date:
```typescript
// In the component, after successful time slots fetch:
useEffect(() => {
  if (availableTimeSlots.length > 0 && packageData?.studio_id) {
    // Prefetch next week
    const nextWeek = addDays(selectedDate, 7)
    queryClient.prefetchQuery({
      queryKey: timeSlotKeys.availableSlots(
        packageData.studio_id,
        format(nextWeek, 'yyyy-MM-dd'),
        packageData.duration_minutes,
        packageData.id
      ),
      queryFn: () => getAvailableTimeSlotsAction(
        packageData.studio_id,
        format(nextWeek, 'yyyy-MM-dd'),
        packageData.duration_minutes,
        packageData.id
      )
    })
  }
}, [availableTimeSlots, selectedDate, packageData, queryClient])
```

## Summary

These optimizations work together to:
1. Reduce database queries through caching
2. Minimize unnecessary requests through debouncing
3. Improve server-side performance through query optimization
4. Enhance user experience through better loading states

The most impactful change would be adding caching, which is simple to implement and provides immediate benefits with minimal risk.