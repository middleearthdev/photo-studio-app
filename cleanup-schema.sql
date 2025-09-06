-- =====================================================
-- CLEANUP SCHEMA - DROP ALL TABLES, VIEWS, FUNCTIONS, TYPES
-- Mengembalikan database ke kondisi awal (kosong)
-- =====================================================

-- WARNING: Script ini akan menghapus SEMUA data dan struktur database
-- Pastikan Anda sudah backup data sebelum menjalankan script ini!

-- =====================================================
-- STEP 1: DROP ALL VIEWS
-- =====================================================

DROP VIEW IF EXISTS available_time_slots CASCADE;
DROP VIEW IF EXISTS reservation_summary CASCADE;

-- =====================================================
-- STEP 2: DROP ALL TRIGGERS
-- =====================================================

-- Drop triggers for updated_at
DROP TRIGGER IF EXISTS trigger_studios_updated_at ON studios;
DROP TRIGGER IF EXISTS trigger_facilities_updated_at ON facilities;
DROP TRIGGER IF EXISTS trigger_portfolios_updated_at ON portfolios;
DROP TRIGGER IF EXISTS trigger_packages_updated_at ON packages;
DROP TRIGGER IF EXISTS trigger_addons_updated_at ON addons;
DROP TRIGGER IF EXISTS trigger_time_slots_updated_at ON time_slots;
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS trigger_reservations_updated_at ON reservations;
DROP TRIGGER IF EXISTS trigger_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON reviews;

-- Drop specific triggers
DROP TRIGGER IF EXISTS trigger_generate_booking_code ON reservations;
DROP TRIGGER IF EXISTS trigger_update_slot_availability ON reservations;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- =====================================================
-- STEP 3: DROP ALL FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_booking_code() CASCADE;
DROP FUNCTION IF EXISTS update_slot_availability() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_user_role(UUID) CASCADE;
DROP FUNCTION IF EXISTS check_slot_availability(UUID, UUID, DATE, TIME, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_available_slots(UUID, DATE, DATE, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_package_details(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_reservation_history(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_guest_reservation(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS link_guest_reservations_to_user(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_studio_analytics(UUID, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS create_xendit_payment(UUID, UUID, DECIMAL, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS handle_xendit_callback(VARCHAR, VARCHAR, JSONB) CASCADE;
DROP FUNCTION IF EXISTS generate_invoice_data(UUID) CASCADE;

-- =====================================================
-- STEP 4: DROP ALL TABLES (in correct order to handle dependencies)
-- =====================================================

-- Drop tables with foreign key dependencies first
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS reservation_addons CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop package-related tables
DROP TABLE IF EXISTS package_facilities CASCADE;
DROP TABLE IF EXISTS addons CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS package_categories CASCADE;

-- Drop portfolio tables
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS portfolio_categories CASCADE;

-- Drop core tables
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS studios CASCADE;

-- =====================================================
-- STEP 5: DROP ALL CUSTOM TYPES/ENUMS
-- =====================================================

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS reservation_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;

-- =====================================================
-- STEP 6: DROP ALL POLICIES (RLS)
-- =====================================================

-- Note: Policies akan otomatis terhapus ketika tables dihapus
-- Tapi untuk memastikan, kita eksplisit drop jika ada yang tersisa

-- =====================================================
-- STEP 7: CLEANUP INDEXES
-- =====================================================

-- Indexes akan otomatis terhapus ketika tables dihapus
-- Tapi jika ada index standalone yang perlu dihapus:

-- DROP INDEX IF EXISTS [index_name] CASCADE;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Cek apakah masih ada tables yang tersisa
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%'
    AND table_name != 'spatial_ref_sys' -- PostGIS table (jika ada)
ORDER BY table_name;

-- Cek apakah masih ada views yang tersisa
SELECT 
    table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Cek apakah masih ada functions yang tersisa
SELECT 
    routine_name as function_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Cek apakah masih ada types yang tersisa
SELECT 
    typname as type_name
FROM pg_type
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND typtype = 'e' -- enum types
ORDER BY typname;

-- Final verification message
SELECT 'Database cleanup completed successfully!' as status;

-- Display remaining objects (should be minimal)
SELECT 
    'Remaining tables: ' || COUNT(*)::TEXT as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%'
    AND table_name != 'spatial_ref_sys';

-- =====================================================
-- OPTIONAL: RESET SEQUENCES (if any custom sequences were created)
-- =====================================================

-- DROP SEQUENCE IF EXISTS [sequence_name] CASCADE;

-- =====================================================
-- POST-CLEANUP NOTES
-- =====================================================

/*
Setelah menjalankan cleanup script ini:

1. Database akan kembali ke kondisi kosong (hanya struktur Supabase default)
2. Semua data akan hilang PERMANENT
3. Auth users di auth.users akan tetap ada (tidak dihapus)
4. Supabase built-in tables (auth, storage, etc) tidak terpengaruh

Langkah selanjutnya:
1. Jalankan schema.sql baru untuk membuat struktur database
2. Jalankan sample-data.sql untuk insert data contoh
3. Test aplikasi dengan struktur yang baru

PENTING: 
- Backup data sebelum menjalankan cleanup
- Script ini tidak dapat di-undo
- Pastikan tidak ada aplikasi yang sedang mengakses database
*/