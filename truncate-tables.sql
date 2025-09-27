-- =====================================================
-- TABLE TRUNCATION SCRIPT
-- Studio Foto Management System
-- =====================================================
-- WARNING: This script will delete ALL data from the tables
-- Use with extreme caution and ensure you have backups!
-- =====================================================

-- Disable triggers temporarily to avoid constraint issues
SET session_replication_role = replica;

-- Truncate tables in correct order (dependent tables first)
-- This prevents foreign key constraint violations

-- 1. Transaction-related tables first
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE reservation_addons CASCADE;
TRUNCATE TABLE reviews CASCADE;

-- 2. Reservations (depends on customers, packages, etc.)
TRUNCATE TABLE reservations CASCADE;

-- 3. Time slots
TRUNCATE TABLE time_slots CASCADE;

-- 4. Package-related tables
TRUNCATE TABLE package_facilities CASCADE;
TRUNCATE TABLE packages CASCADE;
TRUNCATE TABLE package_categories CASCADE;

-- 5. Add-ons and facilities
TRUNCATE TABLE addons CASCADE;
TRUNCATE TABLE facilities CASCADE;

-- 6. Portfolio
TRUNCATE TABLE portfolios CASCADE;
TRUNCATE TABLE portfolio_categories CASCADE;

-- 7. Payment methods
TRUNCATE TABLE payment_methods CASCADE;

-- 8. Customer data
TRUNCATE TABLE customers CASCADE;

-- 9. User profiles (be careful - this affects authentication)
-- TRUNCATE TABLE user_profiles CASCADE;  -- Commented out for safety

-- 10. Studios (main entity)
TRUNCATE TABLE studios CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Reset sequences (if using SERIAL/BIGSERIAL columns)
-- Note: This schema uses UUID, so no sequences to reset

-- Verify truncation
SELECT 
    schemaname,
    tablename,
    n_tup_ins as "Rows Inserted",
    n_tup_upd as "Rows Updated",
    n_tup_del as "Rows Deleted",
    n_live_tup as "Live Rows",
    n_dead_tup as "Dead Rows"
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Display current row counts
SELECT 'studios' as table_name, COUNT(*) as row_count FROM studios
UNION ALL
SELECT 'facilities', COUNT(*) FROM facilities
UNION ALL
SELECT 'portfolio_categories', COUNT(*) FROM portfolio_categories
UNION ALL
SELECT 'portfolios', COUNT(*) FROM portfolios
UNION ALL
SELECT 'package_categories', COUNT(*) FROM package_categories
UNION ALL
SELECT 'packages', COUNT(*) FROM packages
UNION ALL
SELECT 'package_facilities', COUNT(*) FROM package_facilities
UNION ALL
SELECT 'addons', COUNT(*) FROM addons
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'time_slots', COUNT(*) FROM time_slots
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'reservation_addons', COUNT(*) FROM reservation_addons
UNION ALL
SELECT 'payment_methods', COUNT(*) FROM payment_methods
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
ORDER BY table_name;