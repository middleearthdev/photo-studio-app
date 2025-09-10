# Code Changes Required for Time Slots Performance Improvements

## 1. Fix Missing Function Implementation

Add the `generateTimeSlotsForDate` function to `/src/actions/time-slots.ts`:

```typescript
// Add this function to src/actions/time-slots.ts
export async function generateTimeSlotsForDate(
  studioId: string,
  date: string,
  packageDurationMinutes: number = 90,
  packageId?: string
): Promise<ActionResult<AvailableSlot[]>> {
  try {
    const supabase = await createClient()
    
    // Get studio operating hours
    const { data: studioData, error: studioError } = await supabase
      .from('studios')
      .select('operating_hours')
      .eq('id', studioId)
      .single()

    if (studioError || !studioData) {
      return { success: false, error: 'Studio not found' }
    }

    // Get day of week (0 = Sunday, 6 = Saturday)
    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()

    // Default operating hours if not set
    const defaultHours = {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '09:00', close: '17:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false }
    }

    const operatingHours = studioData.operating_hours || defaultHours
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    const dayHours = operatingHours[dayName]

    // Check if studio is open on this day
    if (!dayHours || !dayHours.isOpen) {
      return { success: true, data: [] }
    }

    // Get existing reservations for this date
    const { data: existingReservations, error: reservationError } = await supabase
      .from('reservations')
      .select('start_time, end_time')
      .eq('studio_id', studioId)
      .eq('reservation_date', date)
      .in('status', ['confirmed', 'in_progress'])

    if (reservationError) {
      console.error('Error fetching reservations:', reservationError)
    }

    // Get blocked time slots
    const { data: blockedSlots, error: blockedError } = await supabase
      .from('time_slots')
      .select('start_time, end_time')
      .eq('studio_id', studioId)
      .eq('slot_date', date)
      .eq('is_blocked', true)

    if (blockedError) {
      console.error('Error fetching blocked slots:', blockedError)
    }

    // Generate available time slots
    const slots: AvailableSlot[] = []
    const startTime = dayHours.open
    const endTime = dayHours.close
    const slotInterval = 30 // 30 minutes between slots

    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const startDateTime = new Date(targetDate)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(targetDate)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    let currentTime = new Date(startDateTime)
    let slotId = 1

    while (currentTime < endDateTime) {
      const slotEndTime = new Date(currentTime.getTime() + packageDurationMinutes * 60000)

      // Check if slot end time exceeds operating hours
      if (slotEndTime > endDateTime) break

      const timeString = format(currentTime, 'HH:mm')

      // Check if this slot conflicts with existing reservations
      const isConflictingWithReservation = existingReservations?.some(reservation => {
        const reservationStart = new Date(`${date} ${reservation.start_time}`)
        const reservationEnd = new Date(`${date} ${reservation.end_time}`)

        // Check time overlap
        return (
          (currentTime >= reservationStart && currentTime < reservationEnd) ||
          (slotEndTime > reservationStart && slotEndTime <= reservationEnd) ||
          (currentTime <= reservationStart && slotEndTime >= reservationEnd)
        )
      })

      // Check if this slot is blocked
      const isBlocked = blockedSlots?.some(blocked => {
        const blockedStart = new Date(`${date} ${blocked.start_time}`)
        const blockedEnd = new Date(`${date} ${blocked.end_time}`)

        return (
          (currentTime >= blockedStart && currentTime < blockedEnd) ||
          (slotEndTime > blockedStart && slotEndTime <= blockedEnd) ||
          (currentTime <= blockedStart && slotEndTime >= blockedEnd)
        )
      })

      // Check if slot is in the past
      const now = new Date()
      const isPast = isBefore(currentTime, now)

      // Check facility availability if packageId is provided
      let isFacilityAvailable = true
      if (packageId) {
        isFacilityAvailable = await checkFacilityAvailability(
          supabase,
          studioId,
          date,
          currentTime,
          slotEndTime,
          packageId
        )
      }

      const isAvailable = !isConflictingWithReservation && !isBlocked && !isPast && isFacilityAvailable

      slots.push({
        id: slotId.toString(),
        time: timeString,
        available: isAvailable
      })

      // Move to next slot
      currentTime.setTime(currentTime.getTime() + slotInterval * 60000)
      slotId++
    }

    return { success: true, data: slots }
  } catch (error: any) {
    console.error('Error in generateTimeSlotsForDate:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}
```

## 2. Add Caching to useAvailableTimeSlots Hook

Modify `/src/hooks/use-time-slots.ts`:

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
    // Add caching - time slots don't change frequently
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

## 3. Add Debounce Hook

Create `/src/hooks/use-debounce.ts`:

```typescript
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

## 4. Update PackageDetailPage with Debouncing

Modify `/src/app/packages/[id]/page.tsx`:

```typescript
// Add import at the top
import { useDebounce } from '@/hooks/use-debounce'

// In the component, replace the existing useAvailableTimeSlots call:
const debouncedSelectedDate = useDebounce(selectedDate, 300)

const { data: availableTimeSlots = [], isLoading: timeSlotsLoading } = useAvailableTimeSlots(
  packageData?.studio_id,
  debouncedSelectedDate ? format(debouncedSelectedDate, 'yyyy-MM-dd') : undefined,
  packageData?.duration_minutes,
  packageData?.id
)
```

## 5. Add Skeleton Loading UI

Replace the loading spinner in `/src/app/packages/[id]/page.tsx`:

```jsx
{timeSlotsLoading ? (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="p-4 rounded-lg bg-slate-100 animate-pulse">
        <div className="h-6 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      </div>
    ))}
  </div>
) : availableTimeSlots.length === 0 ? (
  // existing empty state code
) : (
  // existing time slots display code
)}
```

## 6. Optimize Facility Availability Check

Modify the `checkFacilityAvailability` function in `/src/actions/time-slots.ts` to batch queries:

```typescript
// Instead of checking availability for each time slot separately,
// fetch all facility bookings for the day once and check against that data
export async function checkFacilityAvailabilityBatch(
  supabase: any,
  studioId: string,
  date: string,
  packageId: string
): Promise<any[]> {
  try {
    // Get facilities required by the package
    const { data: packageFacilities, error: facilityError } = await supabase
      .from('package_facilities')
      .select('facility_id')
      .eq('package_id', packageId)

    if (facilityError) {
      console.error('Error fetching package facilities:', facilityError)
      return []
    }

    // If package doesn't require any facilities, no conflicts possible
    if (!packageFacilities || packageFacilities.length === 0) {
      return []
    }

    // Get all existing reservations for the date that use required facilities
    const requiredFacilityIds = packageFacilities.map(pf => pf.facility_id)
    
    const { data: conflictingReservations, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        start_time,
        end_time,
        selected_facilities
      `)
      .eq('studio_id', studioId)
      .eq('reservation_date', date)
      .in('status', ['confirmed', 'in_progress'])

    if (reservationError) {
      console.error('Error fetching conflicting reservations:', reservationError)
      return []
    }

    // Return the conflicting time ranges
    return conflictingReservations || []
  } catch (error) {
    console.error('Error in checkFacilityAvailabilityBatch:', error)
    return []
  }
}
```

## Implementation Order

1. Fix the missing `generateTimeSlotsForDate` function (critical)
2. Add caching to the `useAvailableTimeSlots` hook (high impact)
3. Create and implement the debounce hook (high impact)
4. Add skeleton loading UI (medium impact)
5. Optimize facility availability checks (medium impact)

These changes will significantly improve the performance of the time slots feature while maintaining the existing user flow and experience.