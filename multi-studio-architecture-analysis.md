# Studio Foto App - Multi-Studio Architecture Analysis

## Executive Summary

This analysis examines the current studio foto app architecture and identifies necessary adjustments to properly support the multi-studio requirements where:

- **ONE owner** can have **MULTIPLE studios**
- **Customer login is GENERAL** (not tied to specific studios)
- **CS users are STUDIO-BASED** (tied to specific studios)
- **Admin is GENERAL** (can manage data from different studios)

## Current Architecture Analysis

### 1. Database Schema Analysis

#### ✅ Well-Designed Multi-Studio Foundation
The database schema (`/Users/fahminurcahya/Documents/Project/studio-foto-app/schema.sql`) has excellent multi-studio support built-in:

**Key Tables with Studio Relationships:**
- `studios` - Main studio entity
- `user_profiles` - Has `studio_id` for CS users, NULL for admin/customers
- `customers` - **Not studio-bound** (supports general customer login)
- `facilities`, `packages`, `addons`, `portfolios` - All have `studio_id`
- `reservations` - Has `studio_id` (customers relate to studios through bookings)

**Good Design Patterns:**
```sql
-- User profiles support multi-studio correctly
user_profiles (
  studio_id UUID REFERENCES studios(id), -- NULL for admin, specific for CS
  role user_role DEFAULT 'customer' -- customer, admin, customer_service
)

-- Customers are general (not studio-specific)
customers (
  user_id UUID REFERENCES user_profiles(id),
  is_guest BOOLEAN DEFAULT false -- supports both registered and guest
)

-- Studio-specific data filtering via RLS
CREATE POLICY "Admins can manage packages" ON packages FOR ALL USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin' AND studio_id = packages.studio_id)
);
```

#### ⚠️ Issues Found:

1. **RLS Policy Inconsistency**: Some admin policies restrict by `studio_id`, but admin should be GENERAL
2. **Missing Owner Role**: No explicit "owner" role for multi-studio ownership

### 2. Authentication & Authorization Analysis

#### ✅ Strong Authentication Foundation
- `/Users/fahminurcahya/Documents/Project/studio-foto-app/src/actions/auth.ts`
- `/Users/fahminurcahya/Documents/Project/studio-foto-app/src/middleware.ts`

**Good Patterns:**
- Role-based authentication (`admin`, `customer_service`, `customer`)
- Studio-based CS user creation
- Proper session management

#### ⚠️ Issues Found:

1. **Admin Studio Limitation**: Current implementation ties admin to a single studio
```typescript
// In auth.ts - creates staff with single studio
studio_id: studioId || currentProfile.studio_id
```

2. **Missing Multi-Studio Admin Logic**: Admin should access all studios, not just one

### 3. Current Admin Implementation Analysis

#### ✅ Good Studio Selection Pattern
Example from `/Users/fahminurcahya/Documents/Project/studio-foto-app/src/app/(dashboard)/admin/packages/page.tsx`:
```typescript
const [selectedStudioId, setSelectedStudioId] = useState<string>('')
const { data: studios = [] } = useStudios()
const { data: packages = [] } = usePackages(selectedStudioId)
```

#### ⚠️ Issues Found:

1. **Hard-coded Single Studio Logic**: Many actions assume admin belongs to one studio
2. **Missing Studio Context**: Some admin pages don't have studio selection
3. **Inconsistent Studio Filtering**: Some admin functions filter by user's studio_id instead of selected studio

### 4. Current Customer Management Analysis

#### ✅ Excellent General Customer Design
From `/Users/fahminurcahya/Documents/Project/studio-foto-app/src/actions/customers.ts`:
```typescript
// Customers filtered by studio through reservations (correct)
.select(`
  *, 
  reservations!inner(id, total_amount, reservation_date, status, studio_id)
`)
.eq('reservations.studio_id', studioId)
```

#### ✅ Good Patterns:
- Customers relate to studios through reservations (not direct assignment)
- Support for both registered and guest customers
- Proper aggregation of studio-specific customer data

### 5. Data Filtering Patterns Analysis

#### ✅ Good Studio-Based Filtering (Customers, Reservations)
```typescript
// Reservations correctly filtered by studio
export async function getPaginatedReservations(
  studioId: string, // Explicit studio parameter
  params: PaginationParams
)
```

#### ⚠️ Inconsistent Patterns (Admin Functions)
Some functions use user's `studio_id` instead of selected studio:
```typescript
// In users.ts - restricts admin to their studio (incorrect for multi-studio)
studio_id: currentProfile.studio_id
```

## Required Adjustments

### 1. Authentication & User Management Fixes

#### A. Update User Creation for Multi-Studio Admin
**File:** `/Users/fahminurcahya/Documents/Project/studio-foto-app/src/actions/users.ts`

**Issue:** Admin user creation restricted to single studio
```typescript
// CURRENT (incorrect)
studio_id: currentProfile.studio_id // Limits admin to one studio

// NEEDED (correct)
studio_id: userData.role === 'admin' ? null : (studioId || currentProfile.studio_id)
```

#### B. Fix Admin Role RLS Policies
**File:** Database schema RLS policies

**Issue:** Admin policies restricted by studio_id
```sql
-- CURRENT (incorrect)
CREATE POLICY "Admins can manage packages" ON packages FOR ALL USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin' AND studio_id = packages.studio_id)
);

-- NEEDED (correct) 
CREATE POLICY "Admins can manage packages" ON packages FOR ALL USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin' AND studio_id IS NULL)
);
```

### 2. Admin Interface Adjustments

#### A. Add Studio Selection to All Admin Pages
**Pattern to Apply:**
```typescript
// Add to all admin pages missing studio selection
const [selectedStudioId, setSelectedStudioId] = useState<string>('')
const { data: studios = [] } = useStudios()

// Studio selection UI component
<Select value={selectedStudioId} onValueChange={setSelectedStudioId}>
  <SelectContent>
    {studios.map((studio) => (
      <SelectItem key={studio.id} value={studio.id}>
        {studio.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Files needing updates:**
- `/Users/fahminurcahya/Documents/Project/studio-foto-app/src/app/(dashboard)/admin/customers/page.tsx`
- `/Users/fahminurcahya/Documents/Project/studio-foto-app/src/app/(dashboard)/admin/reservations/page.tsx`
- `/Users/fahminurcahya/Documents/Project/studio-foto-app/src/app/(dashboard)/admin/payments/page.tsx`
- All other admin pages without studio selection

#### B. Update Action Functions for Multi-Studio
**Pattern for Admin Functions:**
```typescript
// CURRENT (admin tied to studio)
export async function getPackagesAction(studioId?: string) {
  const currentProfile = await getCurrentProfile()
  const targetStudioId = studioId || currentProfile.studio_id // Wrong for admin
}

// NEEDED (admin selects studio)
export async function getPackagesAction(studioId: string) {
  const currentProfile = await getCurrentProfile()
  if (currentProfile.role === 'admin') {
    // Admin can access any studio - use provided studioId
    if (!studioId) throw new Error('Studio ID required for admin')
  } else {
    // CS users limited to their studio
    studioId = currentProfile.studio_id
  }
}
```

### 3. CS User Restrictions (Already Well Implemented)

#### ✅ CS Users Correctly Studio-Based
The current implementation correctly:
- Ties CS users to specific studios via `studio_id`
- Filters data by CS user's assigned studio
- Prevents cross-studio access for CS users

### 4. Customer Management (Already Excellent)

#### ✅ Customer Implementation Perfect
The current customer implementation already correctly supports:
- General customer login (not studio-specific)
- Studio relationships through reservations
- Proper data aggregation per studio

## Implementation Priority

### Phase 1: Critical Fixes (Immediate)
1. **Fix Admin RLS Policies** - Remove studio restrictions for admin role
2. **Update User Creation** - Set admin `studio_id` to NULL
3. **Add Studio Selection** - To admin pages missing it

### Phase 2: Consistency (Short-term)
1. **Standardize Admin Actions** - Update all admin functions to accept explicit studio parameter
2. **Add Studio Context** - Ensure all admin pages have studio selection
3. **Update Admin Layout** - Show current studio context

### Phase 3: Enhancement (Medium-term)
1. **Add Owner Role** - For explicit multi-studio ownership
2. **Studio Switching UI** - Improved studio selection UX
3. **Cross-Studio Analytics** - Admin reports across all studios

## Specific File Modifications Needed

### 1. Database Schema Updates
```sql
-- Update RLS policies for admin (remove studio restrictions)
-- Add owner role support
-- Fix any remaining studio-bound admin policies
```

### 2. Authentication Actions
**File:** `src/actions/auth.ts`, `src/actions/users.ts`
- Set admin `studio_id` to NULL
- Update admin role checks

### 3. Admin Pages Requiring Studio Selection
**Files to update:**
- `src/app/(dashboard)/admin/customers/page.tsx`
- `src/app/(dashboard)/admin/reservations/page.tsx`
- `src/app/(dashboard)/admin/payments/page.tsx`
- `src/app/(dashboard)/admin/reviews/page.tsx`
- Any other admin pages without studio selection

### 4. Action Functions to Update
**Pattern:** Add explicit `studioId` parameter and proper role-based handling
- `src/actions/customers.ts`
- `src/actions/reservations.ts` 
- `src/actions/payments.ts`
- All other studio-specific actions

### 5. Hook Updates
**Files:** `src/hooks/use-*.ts`
- Update hooks to accept studio parameter
- Ensure proper data fetching per selected studio

## Conclusion

The current architecture has an excellent foundation for multi-studio support. The database schema is well-designed, customer management is perfectly implemented, and CS user restrictions are correctly enforced.

**Main Issues:**
1. Admin users incorrectly tied to single studio
2. Missing studio selection in some admin pages
3. RLS policies restrict admin by studio (should be general)

**Strengths to Preserve:**
1. Excellent customer-studio relationship via reservations
2. Proper CS user studio restrictions
3. Good studio selection patterns in existing admin pages
4. Well-designed database schema

The adjustments needed are primarily in the admin interface and authentication logic, while preserving the excellent customer and CS implementations.