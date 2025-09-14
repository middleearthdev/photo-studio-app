-- =====================================================
-- TEMPORARILY DISABLE RLS FOR ADMIN FUNCTIONALITY FIX
-- =====================================================
-- Use this script to temporarily disable RLS while fixing admin functions
-- Remember to re-enable RLS after fixes are completed
-- =====================================================

-- Disable RLS on all tables temporarily
ALTER TABLE studios DISABLE ROW LEVEL SECURITY;
ALTER TABLE facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;
ALTER TABLE package_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE package_addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE package_facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = true;

-- This should return no rows if RLS is properly disabled

-- Note: Remember to run enable-rls-fixed.sql after fixes are complete