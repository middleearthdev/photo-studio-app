-- =====================================================
-- ENABLE RLS WITH FIXED ADMIN POLICIES
-- =====================================================
-- This script re-enables RLS with proper admin access policies
-- Run after admin functionality has been tested and fixed
-- =====================================================

-- Re-enable RLS on all tables
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Studios are viewable by everyone" ON studios;
DROP POLICY IF EXISTS "Admins can manage all studios" ON studios;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;

-- =====================================================
-- FIXED ADMIN POLICIES - COMPREHENSIVE ACCESS
-- =====================================================

-- PUBLIC READ POLICIES (for website visitors)
CREATE POLICY "public_studios_read" ON studios FOR SELECT USING (is_active = true);
CREATE POLICY "public_portfolios_read" ON portfolios FOR SELECT USING (is_active = true);
CREATE POLICY "public_portfolio_categories_read" ON portfolio_categories FOR SELECT USING (is_active = true);
CREATE POLICY "public_packages_read" ON packages FOR SELECT USING (is_active = true);
CREATE POLICY "public_package_categories_read" ON package_categories FOR SELECT USING (is_active = true);
CREATE POLICY "public_addons_read" ON addons FOR SELECT USING (is_active = true);
CREATE POLICY "public_facilities_read" ON facilities FOR SELECT USING (is_available = true);
CREATE POLICY "public_time_slots_read" ON time_slots FOR SELECT USING (is_available = true AND is_blocked = false);

-- =====================================================
-- USER PROFILE POLICIES
-- =====================================================
CREATE POLICY "users_own_profile_read" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_profile_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- FIXED: Admin can access ALL user profiles (no studio restriction)
CREATE POLICY "admin_all_profiles_access" ON user_profiles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- =====================================================
-- ADMIN POLICIES - COMPLETE ACCESS TO ALL DATA
-- =====================================================

-- Admin can manage ALL studios
CREATE POLICY "admin_all_studios_access" ON studios FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL facilities  
CREATE POLICY "admin_all_facilities_access" ON facilities FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL packages
CREATE POLICY "admin_all_packages_access" ON packages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL package categories
CREATE POLICY "admin_all_package_categories_access" ON package_categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL package addons
CREATE POLICY "admin_all_package_addons_access" ON package_addons FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL package facilities
CREATE POLICY "admin_all_package_facilities_access" ON package_facilities FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL addons
CREATE POLICY "admin_all_addons_access" ON addons FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL portfolios
CREATE POLICY "admin_all_portfolios_access" ON portfolios FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL portfolio categories
CREATE POLICY "admin_all_portfolio_categories_access" ON portfolio_categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL time slots
CREATE POLICY "admin_all_time_slots_access" ON time_slots FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL customers
CREATE POLICY "admin_all_customers_access" ON customers FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL reservations
CREATE POLICY "admin_all_reservations_access" ON reservations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL reservation addons
CREATE POLICY "admin_all_reservation_addons_access" ON reservation_addons FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL payments
CREATE POLICY "admin_all_payments_access" ON payments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL payment methods
CREATE POLICY "admin_all_payment_methods_access" ON payment_methods FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Admin can manage ALL reviews
CREATE POLICY "admin_all_reviews_access" ON reviews FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- =====================================================
-- CS POLICIES - STUDIO-SPECIFIC ACCESS
-- =====================================================

-- CS can manage their studio facilities
CREATE POLICY "cs_studio_facilities_access" ON facilities FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role = 'cs' 
        AND up.studio_id = facilities.studio_id
    )
);

-- CS can manage their studio packages
CREATE POLICY "cs_studio_packages_access" ON packages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role = 'cs' 
        AND up.studio_id = packages.studio_id
    )
);

-- CS can manage their studio time slots
CREATE POLICY "cs_studio_time_slots_access" ON time_slots FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role = 'cs' 
        AND up.studio_id = time_slots.studio_id
    )
);

-- CS can view/manage reservations for their studio
CREATE POLICY "cs_studio_reservations_access" ON reservations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role = 'cs' 
        AND up.studio_id = reservations.studio_id
    )
);

-- =====================================================
-- CUSTOMER POLICIES
-- =====================================================

-- Anyone can create customer records (for guest bookings)
CREATE POLICY "public_customers_create" ON customers FOR INSERT WITH CHECK (true);

-- Users can view their own customer data
CREATE POLICY "users_own_customers_read" ON customers FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.role IN ('admin', 'cs')
    )
);

-- Anyone can create reservations (for guest bookings)
CREATE POLICY "public_reservations_create" ON reservations FOR INSERT WITH CHECK (true);

-- Users can view their own reservations
CREATE POLICY "users_own_reservations_read" ON reservations FOR SELECT USING (
    user_id = auth.uid() OR 
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);

-- Anyone can create payments
CREATE POLICY "public_payments_create" ON payments FOR INSERT WITH CHECK (true);

-- Users can view their own payments
CREATE POLICY "users_own_payments_read" ON payments FOR SELECT USING (
    reservation_id IN (
        SELECT id FROM reservations 
        WHERE user_id = auth.uid() OR 
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    )
);

-- Verify RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✓ Enabled' 
        ELSE '✗ Disabled' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'studios', 'facilities', 'portfolios', 'packages', 
        'user_profiles', 'customers', 'reservations', 'payments'
    )
ORDER BY tablename;

-- Show policy count per table
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;