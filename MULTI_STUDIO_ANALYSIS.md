# Analisis Arsitektur Project Multi-Studio

## Overview Project

Project studio foto ini memiliki arsitektur **satu admin, multiple studios** dimana:
- **Admin** dapat mengelola multiple studios
- **Customer login bersifat GENERAL** (tidak terikat pada studio tertentu)
- **CS users bersifat STUDIO-BASED** (terikat pada studio tertentu)
- **Admin bersifat GENERAL** (dapat mengelola data dari berbagai studio)

**Role System**: Hanya ada 3 role - `admin`, `cs`, dan `customer`

## Analisis Arsitektur Saat Ini

### ✅ **Foundation Excellent - Yang Sudah Berjalan Baik**

#### 1. Database Schema Design (`schema.sql`)
Database **sudah sangat bagus** untuk arsitektur multi-studio:

```sql
-- Table studios dengan relasi yang tepat
CREATE TABLE studios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    -- ... field studio lainnya
);

-- User profiles dengan asosiasi studio
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    studio_id UUID REFERENCES studios(id), -- NULL untuk admin general
    role TEXT CHECK (role IN ('admin', 'cs', 'customer')),
    -- ... field lainnya
);

-- Customers bersifat GENERAL (tidak terikat ke studio)
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    -- TIDAK ADA studio_id - customers bersifat general
);

-- Relasi studio melalui reservations
CREATE TABLE reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    studio_id UUID REFERENCES studios(id), -- Relasi studio ada di sini
);
```

**✅ Desain Perfect**: Customers adalah entitas general yang berelasi dengan studio melalui reservations, bukan direct assignment.

#### 2. Implementasi Customer Management
Implementasi customer **sudah benar**:

- **File**: `src/actions/customers.ts`
- Customers adalah **entitas general** (tidak terikat ke studio)
- Filtering studio melalui **relasi reservations**
- Admin bisa melihat customer dari studio manapun dengan memilih studio

```typescript
// Pendekatan yang benar - filtering berdasarkan studio melalui reservations
export async function getPaginatedCustomers(studioId: string, params) {
  let query = supabase
    .from('customers')
    .select(`*, reservations!inner(studio_id)`)
    .eq('reservations.studio_id', studioId) // Filter melalui relasi
}
```

#### 3. Implementasi CS User
CS (Customer Service) users **sudah benar**:

- **File**: `src/app/(dashboard)/cs/page.tsx`
- Menggunakan `studio_id` user dengan benar untuk filtering data
- Hanya melihat data dari studio yang ditugaskan

```typescript
// CS menggunakan studio_id mereka dengan benar
const { profile } = useAuthStore()
const userStudioId = profile?.studio_id
const { data: paginatedResult } = usePaginatedReservations(userStudioId, { ... })
```

#### 4. Authentication & Role System
Sistem authentication berbasis role yang kuat:

- **Files**: `src/lib/auth.ts`, `src/hooks/use-auth.ts`
- Role checking dan session management yang proper
- Implementasi middleware yang baik

### ⚠️ **Issues Kritis yang Ditemukan**

#### 1. **Implementasi Admin Role - Issue Besar**

**Problem**: Admin saat ini diperlakukan sebagai studio-based, bukan general.

**Files Terpengaruh**:
- `src/app/(dashboard)/admin/payments/page.tsx`
- `src/actions/auth.ts`
- Database RLS policies

**Code Bermasalah Saat Ini**:
```typescript
// ❌ SALAH: Admin terikat ke satu studio
const { profile } = useAuthStore()
const studioId = profile?.studio_id // Admin TIDAK boleh terikat ke satu studio
```

**Behavior Admin yang Diharapkan**:
```typescript
// ✅ BENAR: Admin memilih studio mana yang akan dikelola
const [selectedStudioId, setSelectedStudioId] = useState<string>('')
const { data: studios } = useStudios() // Admin melihat semua studio
```

#### 2. **Database RLS Policies**
**Issue**: RLS policies mungkin membatasi akses admin ke satu studio.

**Perlu Dicek**: Policies di schema.sql untuk role admin harus memungkinkan akses ke SEMUA studio.

#### 3. **Inkonsistensi Admin Pages**

**Berjalan dengan Benar** (dengan studio selection):
- ✅ `src/app/(dashboard)/admin/packages/page.tsx`
- ✅ `src/app/(dashboard)/admin/portfolio/page.tsx`  
- ✅ `src/app/(dashboard)/admin/customers/page.tsx`
- ✅ `src/app/(dashboard)/admin/reservations/page.tsx`

**Bermasalah** (menggunakan studio_id user):
- ❌ `src/app/(dashboard)/admin/payments/page.tsx`

**Missing Studio Selection**:
- ⚠️ Admin dashboard overview
- ⚠️ Management reviews (jika ada)
- ⚠️ Settings pages

## Adjustments Spesifik yang Diperlukan

### **Phase 1: Perbaikan Kritis (Segera)**

#### 1. Fix Admin Studio Assignment
**File**: `src/actions/users.ts` atau logic pembuatan user
```typescript
// Ketika membuat admin users, set studio_id ke NULL
const adminData = {
  studio_id: null, // Admin tidak terikat ke studio tertentu
  role: 'admin'
}
```

#### 2. Update Database RLS Policies
```sql
-- Admin harus bisa akses semua studio
ALTER POLICY studio_policy ON studios 
  FOR ALL USING (
    -- Admin bisa melihat semua studio
    auth.jwt() ->> 'role' = 'admin' OR  
    -- CS hanya melihat studio mereka
    auth.uid() IN (SELECT user_id FROM user_profiles WHERE studio_id = studios.id)
  );
```

#### 3. Fix Payment Page
**File**: `src/app/(dashboard)/admin/payments/page.tsx`
```typescript
// ❌ Hapus ini
const { profile } = useAuthStore()
const studioId = profile?.studio_id

// ✅ Tambah ini sebagai gantinya
const [selectedStudioId, setSelectedStudioId] = useState<string>('')
const { data: studios } = useStudios()

// Tambah studio selector UI seperti admin page lainnya
```

### **Phase 2: Perbaikan Konsistensi**

#### 4. Standardisasi Admin Action Functions
**Pattern yang Harus Diikuti**:
```typescript
// Semua fungsi admin harus menerima parameter studio eksplisit
export async function getAdminData(studioId: string, params) {
  // Gunakan studioId yang diberikan, bukan studio_id user
}
```

#### 5. Update Semua Admin Pages
Pastikan semua admin pages mengikuti pattern ini:
```typescript
// Pattern standar admin page
const [selectedStudioId, setSelectedStudioId] = useState<string>('')
const { data: studios } = useStudios()

useEffect(() => {
  if (studios.length > 0 && !selectedStudioId) {
    setSelectedStudioId(studios[0].id) // Default ke studio pertama
  }
}, [studios, selectedStudioId])
```

#### 6. Studio Context Hook
**Buat**: `src/hooks/use-admin-studio.ts`
```typescript
export function useAdminStudio() {
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')
  const { data: studios } = useStudios()
  
  // Auto-select studio pertama
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])
  
  return { selectedStudioId, setSelectedStudioId, studios }
}
```

### **Phase 3: Peluang Enhancement**

#### 7. Cross-Studio Analytics
**Buat**: Admin dashboard yang menampilkan data dari semua studio:
```typescript
// src/app/(dashboard)/admin/overview/page.tsx
const { data: allStudiosStats } = useAllStudiosStats()
```

#### 8. Studio Switching UX
Improve UX pemilihan studio dengan:
- Studio switcher di header
- Recently viewed studios
- Studio-specific navigation breadcrumbs

## Files yang Perlu Diupdate

### **Database**
- [ ] `schema.sql` - Update RLS policies untuk admin role
- [ ] Migration script untuk admin users yang sudah ada

### **Authentication & User Management**
- [ ] `src/actions/auth.ts` - Logic pembuatan admin user
- [ ] `src/actions/users.ts` - Management user profile
- [ ] `src/hooks/use-auth.ts` - Handling admin role

### **Admin Pages yang Perlu Studio Selection**
- [ ] `src/app/(dashboard)/admin/payments/page.tsx` - **KRITIS**
- [ ] `src/app/(dashboard)/admin/dashboard/page.tsx` - Tambah overview
- [ ] `src/app/(dashboard)/admin/reviews/` - Jika ada
- [ ] `src/app/(dashboard)/admin/settings/` - Studio-specific settings

### **Action Functions**
- [ ] `src/actions/payments.ts` - Accept parameter studio eksplisit
- [ ] `src/actions/reviews.ts` - Jika ada  
- [ ] Semua fungsi action yang studio-specific

### **Hooks**
- [ ] Buat `src/hooks/use-admin-studio.ts` - Centralized studio management
- [ ] Update existing hooks untuk accept parameter studio

### **Components**
- [ ] Buat studio selector component untuk admin pages
- [ ] Update admin layout dengan studio context

## Prioritas Implementasi

### **🔴 High Priority (Fix Segera)**
1. Admin RLS policies di database
2. Admin user creation (studio_id = null)  
3. Fix payments page studio selection
4. Update logic authentication admin

### **🟡 Medium Priority (Konsistensi)**
1. Standardisasi semua admin pages dengan studio selection
2. Buat admin studio management hook
3. Update action functions untuk parameter studio eksplisit

### **🟢 Low Priority (Enhancement)**
1. Cross-studio analytics dashboard
2. Enhanced studio switching UX
3. Admin activity logging per studio

## Testing Checklist

### **Admin User Testing**
- [ ] Admin bisa login dan melihat semua studio
- [ ] Admin bisa switch antara studios di admin pages  
- [ ] Admin melihat data untuk selected studio saja
- [ ] Admin tidak dibatasi oleh studio_id di database

### **Customer Testing**  
- [ ] Customer bisa booking di studio manapun
- [ ] Data customer muncul di konteks studio yang benar
- [ ] Customer login berfungsi di semua studio

### **CS User Testing**
- [ ] CS hanya melihat data studio yang ditugaskan
- [ ] CS tidak bisa akses data studio lain
- [ ] CS dashboard menampilkan konteks studio yang benar

## Kesimpulan

**Project memiliki foundation yang excellent** untuk arsitektur multi-studio. Issues utama adalah:

1. **Implementasi Admin** perlu benar-benar general (tidak terikat studio)
2. **Beberapa inkonsistensi** dalam implementasi admin pages  
3. **Database policies** mungkin perlu penyesuaian untuk akses admin

Pendekatan customer management sudah **perfect** - customers adalah entitas general yang berelasi dengan studio melalui reservations, persis seperti yang seharusnya didesain.

**Prioritas**: Fix implementasi admin role dulu, kemudian standardisasi semua admin pages untuk konsistensi.

## Pattern yang Harus Diikuti

### **Admin Pages Pattern**
```typescript
export default function AdminPage() {
  // 1. Studio selection state
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')
  const { data: studios = [], isLoading: studiosLoading } = useStudios()
  
  // 2. Auto-select first studio
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])
  
  // 3. Use selected studio for data fetching
  const { data: pageData } = usePaginatedData(selectedStudioId, { ... })
  
  // 4. UI dengan studio selector
  return (
    <div>
      <Select value={selectedStudioId} onValueChange={setSelectedStudioId}>
        {studios.map((studio) => (
          <SelectItem key={studio.id} value={studio.id}>
            {studio.name}
          </SelectItem>
        ))}
      </Select>
      {/* Data berdasarkan selected studio */}
    </div>
  )
}
```

### **CS Pages Pattern**
```typescript
export default function CSPage() {
  // CS menggunakan studio_id mereka
  const { profile } = useAuthStore()
  const userStudioId = profile?.studio_id
  
  // Data hanya dari studio mereka
  const { data: pageData } = usePaginatedData(userStudioId, { ... })
  
  return <div>{/* Data studio CS */}</div>
}
```

Dengan mengikuti pattern ini, konsistensi multi-studio akan terjaga di seluruh aplikasi.