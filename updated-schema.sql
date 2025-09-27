-- =====================================================
-- UPDATED SCHEMA FOR MULTI-STUDIO PROJECT
-- Fixed RLS policies for Admin role to be GENERAL
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types/enums (FIXED: 3 roles only)
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'cs');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed', 'failed');

-- Studios Table
CREATE TABLE studios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    operating_hours JSONB,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Facilities Table
CREATE TABLE facilities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INTEGER DEFAULT 1,
    equipment JSONB,
    hourly_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT true,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio Categories
CREATE TABLE portfolio_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio
CREATE TABLE portfolios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    category_id UUID REFERENCES portfolio_categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Package Categories
CREATE TABLE package_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Packages
CREATE TABLE packages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    category_id UUID REFERENCES package_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    dp_percentage DECIMAL(5,2) DEFAULT 30.00,
    includes JSONB,
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Package Facilities
CREATE TABLE package_facilities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    is_included BOOLEAN DEFAULT true,
    additional_cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_package_facility UNIQUE (package_id, facility_id)
);

-- Add-ons
CREATE TABLE addons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    type VARCHAR(100),
    max_quantity INTEGER DEFAULT 1,
    is_conditional BOOLEAN DEFAULT false,
    conditional_logic JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FIXED: User Profiles (admin has studio_id = NULL for general access)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE, -- NULL for admin (general access)
    role user_role DEFAULT 'customer',
    full_name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    birth_date DATE,
    preferences JSONB DEFAULT '{}',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PERFECT: Customers (general - not tied to studios)
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    birth_date DATE,
    notes TEXT,
    is_guest BOOLEAN DEFAULT false,
    guest_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_email UNIQUE (user_id, email) DEFERRABLE INITIALLY DEFERRED
);

-- Time Slots
CREATE TABLE time_slots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    is_blocked BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_facility_time UNIQUE (facility_id, slot_date, start_time)
);

-- Reservations (studio relationship here)
CREATE TABLE reservations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    invoice_number VARCHAR(50) UNIQUE,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE, -- Studio relationship
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
    
    -- Guest booking support
    is_guest_booking BOOLEAN DEFAULT false,
    guest_email VARCHAR(255),
    guest_phone VARCHAR(20),
    
    -- Booking details
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_duration INTEGER NOT NULL,
    
    -- Selected facilities
    selected_facilities JSONB,
    
    -- Pricing breakdown
    package_price DECIMAL(10,2) NOT NULL,
    facility_addon_total DECIMAL(10,2) DEFAULT 0,
    other_addon_total DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    dp_amount DECIMAL(10,2) NOT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    
    -- Status
    status reservation_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    
    -- Additional info
    special_requests TEXT,
    notes TEXT,
    internal_notes TEXT,
    
    -- Timestamps
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservation Add-ons
CREATE TABLE reservation_addons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    addon_id UUID REFERENCES addons(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_reservation_addon UNIQUE (reservation_id, addon_id)
);

-- Payment Methods
CREATE TABLE payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    provider VARCHAR(100),
    account_details JSONB,
    xendit_config JSONB,
    fee_type VARCHAR(20) DEFAULT 'percentage',
    fee_percentage DECIMAL(5,2) DEFAULT 0,
    fee_amount DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_fee_type CHECK (fee_type IN ('percentage', 'fixed'))
);

-- Payments
CREATE TABLE payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    payment_method_id UUID REFERENCES payment_methods(id),
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    status payment_status DEFAULT 'pending',
    
    -- External payment gateway
    external_payment_id VARCHAR(255),
    external_status VARCHAR(100),
    payment_url TEXT,
    callback_data JSONB,
    
    -- Fee tracking
    gateway_fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2),
    
    -- Timestamps
    paid_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    photos JSONB,
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    replied_at TIMESTAMP WITH TIME ZONE,
    reply_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_studio_role ON user_profiles(studio_id, role);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_reservations_studio_date ON reservations(studio_id, reservation_date);
CREATE INDEX idx_reservations_customer ON reservations(customer_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_portfolios_studio_category ON portfolios(studio_id, category_id);
CREATE INDEX idx_packages_studio_active ON packages(studio_id, is_active);
CREATE INDEX idx_facilities_studio_available ON facilities(studio_id, is_available);

-- Functions and triggers
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, full_name, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'customer');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trigger_studios_updated_at BEFORE UPDATE ON studios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_facilities_updated_at BEFORE UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIXED RLS POLICIES FOR MULTI-STUDIO ADMIN ACCESS
-- =====================================================

-- Enable RLS
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES (for website visitors)
CREATE POLICY "Studios are viewable by everyone" ON studios FOR SELECT USING (is_active = true);
CREATE POLICY "Portfolio is public" ON portfolios FOR SELECT USING (is_active = true);
CREATE POLICY "Portfolio categories are public" ON portfolio_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Packages are public" ON packages FOR SELECT USING (is_active = true);
CREATE POLICY "Package categories are public" ON package_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Addons are public" ON addons FOR SELECT USING (is_active = true);
CREATE POLICY "Facilities are public" ON facilities FOR SELECT USING (is_available = true);
CREATE POLICY "Available time slots are public" ON time_slots FOR SELECT USING (is_available = true AND is_blocked = false);

-- USER PROFILE POLICIES
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- FIXED: Admin can access ALL studios (no studio restriction)
CREATE POLICY "Admins can manage all profiles" ON user_profiles FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
);

-- CUSTOMER POLICIES (supports guest bookings)
CREATE POLICY "Anyone can create customer record" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users and staff can view customers" ON customers FOR SELECT USING (
    user_id = auth.uid() OR 
    auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'cs'))
);

-- RESERVATION POLICIES
CREATE POLICY "Anyone can create reservations" ON reservations FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view reservations" ON reservations FOR SELECT USING (
    user_id = auth.uid() OR 
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin') OR -- Admin sees ALL
    auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE studio_id = reservations.studio_id AND role = 'cs' -- CS sees only their studio
    )
);

-- FIXED: Admin can manage ALL reservations, CS only their studio
CREATE POLICY "Staff can manage reservations" ON reservations FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin') OR -- Admin manages ALL
    auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE studio_id = reservations.studio_id AND role = 'cs' -- CS manages only their studio
    )
);

-- PAYMENT POLICIES
CREATE POLICY "Anyone can create payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users and staff can view payments" ON payments FOR SELECT USING (
    reservation_id IN (
        SELECT id FROM reservations 
        WHERE user_id = auth.uid() OR 
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    ) OR
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin') OR -- Admin sees ALL
    auth.uid() IN (
        SELECT up.id FROM user_profiles up
        JOIN reservations r ON r.studio_id = up.studio_id
        WHERE r.id = payments.reservation_id AND up.role = 'cs' -- CS sees only their studio
    )
);

-- FIXED: STUDIO MANAGEMENT POLICIES - Admin can access ALL studios
CREATE POLICY "Admins can manage all studios" ON studios FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin') -- Admin manages ALL studios
);

CREATE POLICY "Admins can manage all facilities" ON facilities FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin') -- Admin manages ALL facilities
);

CREATE POLICY "Admins can manage all packages" ON packages FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin') -- Admin manages ALL packages
);

CREATE POLICY "Admins can manage all addons" ON addons FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin') -- Admin manages ALL addons
);

CREATE POLICY "Admins can manage all portfolio" ON portfolios FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin') -- Admin manages ALL portfolio
);

CREATE POLICY "Admins can manage all portfolio categories" ON portfolio_categories FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin') -- Admin manages ALL categories
);

CREATE POLICY "Admins can manage all package categories" ON package_categories FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin') -- Admin manages ALL package categories
);

CREATE POLICY "Admins can manage all time slots" ON time_slots FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin') -- Admin manages ALL time slots
);

CREATE POLICY "Admins can manage all reviews" ON reviews FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin') -- Admin manages ALL reviews
);

-- CS POLICIES - CS can only manage their assigned studio data
CREATE POLICY "CS can manage their studio facilities" ON facilities FOR ALL USING (
    auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE studio_id = facilities.studio_id AND role = 'cs'
    )
);

CREATE POLICY "CS can manage their studio packages" ON packages FOR ALL USING (
    auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE studio_id = packages.studio_id AND role = 'cs'
    )
);

CREATE POLICY "CS can manage their studio time slots" ON time_slots FOR ALL USING (
    auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE studio_id = time_slots.studio_id AND role = 'cs'
    )
);

CREATE POLICY "CS can manage their studio reviews" ON reviews FOR ALL USING (
    auth.uid() IN (
        SELECT up.id FROM user_profiles up
        JOIN reservations r ON r.studio_id = up.studio_id
        WHERE r.id = reviews.reservation_id AND up.role = 'cs'
    )
);

-- Create helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
    user_role_result user_role;
BEGIN
    SELECT role INTO user_role_result
    FROM user_profiles 
    WHERE id = user_id;
    
    RETURN COALESCE(user_role_result, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;