-- =====================================================
-- STEP 1: SUPABASE BASIC SETUP
-- Run this FIRST in Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('customer', 'admin',  'customer_service');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed', 'failed', 'refunded');

-- Verify setup
SELECT 'Extensions and enums created successfully' as status;



-- =====================================================
-- STEP 2: CORE TABLES
-- Run this AFTER Step 1
-- =====================================================

-- Studios Table
CREATE TABLE studios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    operating_hours JSONB, -- {"monday": {"open": "09:00", "close": "18:00"}}
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
    max_photos INTEGER,
    max_edited_photos INTEGER,
    includes JSONB,
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Package Facilities (Many-to-Many)
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

-- Verify tables created
SELECT 'Core tables created successfully' as status;

-- =====================================================
-- STEP 3: USER MANAGEMENT & AUTH INTEGRATION
-- Run this AFTER Step 2
-- =====================================================

-- User Profiles (extends auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
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

-- Customers (supports both guest and registered users)
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

-- Staff (extends user_profiles)
CREATE TABLE staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    specialization JSONB,
    hourly_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT true,
    working_hours JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, full_name, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'customer');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Verify user management setup
SELECT 'User management tables and triggers created successfully' as status;


-- =====================================================
-- STEP 4: BOOKING SYSTEM
-- Run this AFTER Step 3
-- =====================================================

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

-- Reservations
CREATE TABLE reservations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    invoice_number VARCHAR(50) UNIQUE,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
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

-- Verify booking system setup
SELECT 'Booking system tables created successfully' as status;


-- =====================================================
-- STEP 5: PAYMENT SYSTEM & REVIEWS
-- Run this AFTER Step 4
-- =====================================================

-- Payment Methods
CREATE TABLE payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'bank_transfer', 'credit_card', 'e_wallet', 'qris', 'va', 'cash'
    provider VARCHAR(100), -- 'xendit', 'manual'
    account_details JSONB,
    xendit_config JSONB,
    fee_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    payment_method_id UUID REFERENCES payment_methods(id),
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- 'dp', 'remaining', 'full'
    status payment_status DEFAULT 'pending',
    
    -- External payment gateway (Xendit)
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

-- Verify payment system setup
SELECT 'Payment system and reviews tables created successfully' as status;


-- =====================================================
-- STEP 6: INDEXES & PERFORMANCE OPTIMIZATION
-- Run this AFTER Step 5
-- =====================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_studio_role ON user_profiles(studio_id, role);
CREATE INDEX idx_user_profiles_email ON user_profiles(id) WHERE role = 'customer';

-- Time slots indexes
CREATE INDEX idx_time_slots_date_available ON time_slots(slot_date, is_available) WHERE is_available = true;
CREATE INDEX idx_time_slots_facility_date ON time_slots(facility_id, slot_date);

-- Reservations indexes
CREATE INDEX idx_reservations_studio_date ON reservations(studio_id, reservation_date);
CREATE INDEX idx_reservations_customer ON reservations(customer_id);
CREATE INDEX idx_reservations_user ON reservations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_booking_code ON reservations(booking_code);
CREATE INDEX idx_reservations_guest_email ON reservations(guest_email) WHERE is_guest_booking = true;

-- Payments indexes
CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_external_id ON payments(external_payment_id);

-- Portfolio indexes
CREATE INDEX idx_portfolios_studio_category ON portfolios(studio_id, category_id);
CREATE INDEX idx_portfolios_featured ON portfolios(is_featured, is_active) WHERE is_featured = true;

-- Reviews indexes
CREATE INDEX idx_reviews_reservation_approved ON reviews(reservation_id) WHERE is_approved = true;

-- Package indexes
CREATE INDEX idx_packages_studio_active ON packages(studio_id, is_active) WHERE is_active = true;
CREATE INDEX idx_packages_popular ON packages(is_popular, is_active) WHERE is_popular = true;

-- Facilities indexes
CREATE INDEX idx_facilities_studio_available ON facilities(studio_id, is_available) WHERE is_available = true;

-- Add-ons indexes  
CREATE INDEX idx_addons_studio_active ON addons(studio_id, is_active) WHERE is_active = true;
CREATE INDEX idx_addons_facility ON addons(facility_id) WHERE facility_id IS NOT NULL;

-- Verify indexes created
SELECT 'Performance indexes created successfully' as status;


-- =====================================================
-- STEP 7: VIEWS & BASIC FUNCTIONS
-- Run this AFTER Step 6
-- =====================================================

-- Available Time Slots View
CREATE VIEW available_time_slots AS
SELECT 
    ts.*,
    f.name as facility_name,
    f.capacity,
    s.name as studio_name
FROM time_slots ts
JOIN facilities f ON ts.facility_id = f.id
JOIN studios s ON ts.studio_id = s.id
WHERE ts.is_available = true 
    AND ts.is_blocked = false
    AND ts.slot_date >= CURRENT_DATE
    AND NOT EXISTS (
        SELECT 1 FROM reservations r 
        WHERE r.reservation_date = ts.slot_date
        AND r.start_time < ts.end_time 
        AND r.end_time > ts.start_time
        AND r.status IN ('confirmed', 'in_progress')
        AND r.selected_facilities::jsonb ? ts.facility_id::text
    );

-- Reservation Summary View
CREATE VIEW reservation_summary AS
SELECT 
    r.*,
    c.full_name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    p.name as package_name,
    p.duration_minutes,
    s.name as studio_name,
    COALESCE(addon_summary.total_addons, 0) as addon_count,
    COALESCE(addon_summary.addon_total, 0) as calculated_addon_total
FROM reservations r
LEFT JOIN customers c ON r.customer_id = c.id
LEFT JOIN packages p ON r.package_id = p.id
LEFT JOIN studios s ON r.studio_id = s.id
LEFT JOIN (
    SELECT 
        ra.reservation_id,
        COUNT(*) as total_addons,
        SUM(ra.total_price) as addon_total
    FROM reservation_addons ra
    GROUP BY ra.reservation_id
) addon_summary ON r.id = addon_summary.reservation_id;

-- Basic utility functions
CREATE OR REPLACE FUNCTION check_slot_availability(
    p_studio_id UUID,
    p_facility_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_duration_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_end_time TIME;
    v_conflict_count INTEGER;
BEGIN
    v_end_time := p_start_time + (p_duration_minutes || ' minutes')::INTERVAL;
    
    -- Check for overlapping reservations
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM reservations r
    WHERE r.studio_id = p_studio_id
        AND r.reservation_date = p_date
        AND r.status IN ('confirmed', 'in_progress')
        AND r.selected_facilities::jsonb ? p_facility_id::text
        AND (
            (r.start_time < v_end_time AND r.end_time > p_start_time)
        );
    
    RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Get available slots for a date range
CREATE OR REPLACE FUNCTION get_available_slots(
    p_studio_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_duration_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (
    slot_id UUID,
    facility_id UUID,
    facility_name VARCHAR,
    slot_date DATE,
    start_time TIME,
    end_time TIME,
    can_fit_duration BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id,
        ts.facility_id,
        f.name,
        ts.slot_date,
        ts.start_time,
        ts.end_time,
        (EXTRACT(EPOCH FROM (ts.end_time - ts.start_time)) / 60)::INTEGER >= p_duration_minutes as can_fit_duration
    FROM time_slots ts
    JOIN facilities f ON ts.facility_id = f.id
    WHERE ts.studio_id = p_studio_id
        AND ts.slot_date BETWEEN p_start_date AND p_end_date
        AND ts.is_available = true
        AND ts.is_blocked = false
        AND NOT EXISTS (
            SELECT 1 FROM reservations r 
            WHERE r.reservation_date = ts.slot_date
            AND r.start_time < ts.end_time 
            AND r.end_time > ts.start_time
            AND r.status IN ('confirmed', 'in_progress')
            AND r.selected_facilities::jsonb ? ts.facility_id::text
        )
    ORDER BY ts.slot_date, ts.start_time;
END;
$$ LANGUAGE plpgsql;

-- Get package details with facilities
CREATE OR REPLACE FUNCTION get_package_details(p_package_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'package', row_to_json(p.*),
        'included_facilities', (
            SELECT json_agg(
                json_build_object(
                    'id', f.id,
                    'name', f.name,
                    'description', f.description,
                    'capacity', f.capacity,
                    'equipment', f.equipment,
                    'is_included', pf.is_included,
                    'additional_cost', pf.additional_cost
                )
            )
            FROM package_facilities pf
            JOIN facilities f ON pf.facility_id = f.id
            WHERE pf.package_id = p_package_id AND pf.is_included = true
        ),
        'optional_facilities', (
            SELECT json_agg(
                json_build_object(
                    'id', f.id,
                    'name', f.name,
                    'description', f.description,
                    'capacity', f.capacity,
                    'equipment', f.equipment,
                    'additional_cost', pf.additional_cost
                )
            )
            FROM package_facilities pf
            JOIN facilities f ON pf.facility_id = f.id
            WHERE pf.package_id = p_package_id AND pf.is_included = false
        ),
        'available_addons', (
            SELECT json_agg(
                json_build_object(
                    'id', a.id,
                    'name', a.name,
                    'description', a.description,
                    'price', a.price,
                    'type', a.type,
                    'max_quantity', a.max_quantity,
                    'is_conditional', a.is_conditional
                )
            )
            FROM addons a
            JOIN packages pkg ON a.studio_id = pkg.studio_id
            WHERE pkg.id = p_package_id AND a.is_active = true
        )
    ) INTO result
    FROM packages p
    WHERE p.id = p_package_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Verify views and functions
SELECT 'Views and basic functions created successfully' as status;


-- =====================================================
-- STEP 8: TRIGGERS & AUTOMATION
-- Run this AFTER Step 7
-- =====================================================

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate booking code and handle guest bookings
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate booking code
    NEW.booking_code := 'STD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 6, '0');
    
    -- Set guest booking flag and store guest info
    IF NEW.user_id IS NULL THEN
        NEW.is_guest_booking := true;
        -- Get customer email and phone for guest tracking
        SELECT email, phone INTO NEW.guest_email, NEW.guest_phone
        FROM customers WHERE id = NEW.customer_id;
    ELSE
        NEW.is_guest_booking := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update slot availability based on reservations
CREATE OR REPLACE FUNCTION update_slot_availability()
RETURNS TRIGGER AS $$
DECLARE
    facility_item JSONB;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Mark slots as unavailable if reservation is confirmed
        IF NEW.status IN ('confirmed', 'in_progress') THEN
            FOR facility_item IN SELECT * FROM jsonb_array_elements(NEW.selected_facilities)
            LOOP
                UPDATE time_slots 
                SET is_available = false, updated_at = NOW()
                WHERE facility_id = (facility_item->>'facility_id')::UUID
                    AND slot_date = NEW.reservation_date
                    AND start_time < NEW.end_time 
                    AND end_time > NEW.start_time;
            END LOOP;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.status IN ('confirmed', 'in_progress') AND NEW.status = 'cancelled') THEN
        -- Mark slots as available if reservation is cancelled
        FOR facility_item IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.selected_facilities, OLD.selected_facilities))
        LOOP
            UPDATE time_slots 
            SET is_available = true, updated_at = NOW()
            WHERE facility_id = (facility_item->>'facility_id')::UUID
                AND slot_date = COALESCE(NEW.reservation_date, OLD.reservation_date)
                AND start_time < COALESCE(NEW.end_time, OLD.end_time)
                AND end_time > COALESCE(NEW.start_time, OLD.start_time);
        END LOOP;
        RETURN COALESCE(NEW, OLD);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER trigger_generate_booking_code
    BEFORE INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION generate_booking_code();

CREATE TRIGGER trigger_update_slot_availability
    AFTER INSERT OR UPDATE OR DELETE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_slot_availability();

-- Apply updated_at triggers to all tables
CREATE TRIGGER trigger_studios_updated_at BEFORE UPDATE ON studios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_facilities_updated_at BEFORE UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_addons_updated_at BEFORE UPDATE ON addons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_time_slots_updated_at BEFORE UPDATE ON time_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify triggers setup
SELECT 'Triggers and automation created successfully' as status;


-- =====================================================
-- STEP 10: GUEST & USER MANAGEMENT FUNCTIONS
-- Run this AFTER Step 9
-- =====================================================

-- Get user reservation history (logged-in users only)
CREATE OR REPLACE FUNCTION get_user_reservation_history(p_user_id UUID)
RETURNS TABLE (
    reservation_id UUID,
    booking_code VARCHAR,
    invoice_number VARCHAR,
    package_name VARCHAR,
    reservation_date DATE,
    start_time TIME,
    total_amount DECIMAL,
    payment_status payment_status,
    reservation_status reservation_status,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.booking_code,
        r.invoice_number,
        p.name,
        r.reservation_date,
        r.start_time,
        r.total_amount,
        r.payment_status,
        r.status,
        r.created_at
    FROM reservations r
    LEFT JOIN packages p ON r.package_id = p.id
    WHERE r.user_id = p_user_id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Guest booking lookup by booking code + email
CREATE OR REPLACE FUNCTION get_guest_reservation(
    p_booking_code VARCHAR(20),
    p_email VARCHAR(255)
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT generate_invoice_data(r.id) INTO result
    FROM reservations r
    WHERE r.booking_code = p_booking_code 
        AND r.is_guest_booking = true
        AND r.guest_email = p_email;
    
    IF result IS NULL THEN
        RAISE EXCEPTION 'Reservation not found or email does not match';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Link guest reservations to user account (when guest signs up)
CREATE OR REPLACE FUNCTION link_guest_reservations_to_user(
    p_user_id UUID,
    p_email VARCHAR(255)
)
RETURNS INTEGER AS $$
DECLARE
    v_customer_id UUID;
    v_linked_count INTEGER := 0;
BEGIN
    -- Create customer record for the new user
    INSERT INTO customers (user_id, full_name, email, phone, is_guest)
    SELECT p_user_id, up.full_name, p_email, up.phone, false
    FROM user_profiles up
    WHERE up.id = p_user_id
    RETURNING id INTO v_customer_id;
    
    -- Update guest reservations to link with user account
    UPDATE reservations 
    SET 
        user_id = p_user_id,
        customer_id = v_customer_id,
        is_guest_booking = false,
        updated_at = NOW()
    WHERE guest_email = p_email 
        AND is_guest_booking = true
        AND user_id IS NULL;
    
    GET DIAGNOSTICS v_linked_count = ROW_COUNT;
    
    RETURN v_linked_count;
END;
$$ LANGUAGE plpgsql;

-- Get studio analytics
CREATE OR REPLACE FUNCTION get_studio_analytics(
    p_studio_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_reservations', (
            SELECT COUNT(*) FROM reservations 
            WHERE studio_id = p_studio_id 
            AND reservation_date BETWEEN p_start_date AND p_end_date
        ),
        'completed_reservations', (
            SELECT COUNT(*) FROM reservations 
            WHERE studio_id = p_studio_id 
            AND status = 'completed'
            AND reservation_date BETWEEN p_start_date AND p_end_date
        ),
        'guest_vs_user_bookings', (
            SELECT json_build_object(
                'guest_bookings', COUNT(*) FILTER (WHERE is_guest_booking = true),
                'user_bookings', COUNT(*) FILTER (WHERE is_guest_booking = false)
            )
            FROM reservations 
            WHERE studio_id = p_studio_id 
            AND reservation_date BETWEEN p_start_date AND p_end_date
        ),
        'total_revenue', (
            SELECT COALESCE(SUM(total_amount), 0) FROM reservations 
            WHERE studio_id = p_studio_id 
            AND status = 'completed'
            AND reservation_date BETWEEN p_start_date AND p_end_date
        ),
        'average_rating', (
            SELECT ROUND(AVG(rating), 2) FROM reviews r
            JOIN reservations res ON r.reservation_id = res.id
            WHERE res.studio_id = p_studio_id
            AND res.reservation_date BETWEEN p_start_date AND p_end_date
            AND r.is_approved = true
        ),
        'popular_packages', (
            SELECT json_agg(json_build_object('name', p.name, 'bookings', package_stats.booking_count))
            FROM (
                SELECT package_id, COUNT(*) as booking_count
                FROM reservations 
                WHERE studio_id = p_studio_id
                AND reservation_date BETWEEN p_start_date AND p_end_date
                GROUP BY package_id
                ORDER BY booking_count DESC
                LIMIT 5
            ) package_stats
            JOIN packages p ON package_stats.package_id = p.id
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Verify user management functions
SELECT 'Guest and user management functions created successfully' as status;


-- =====================================================
-- STEP 11: PAYMENT INTEGRATION (XENDIT)
-- Run this AFTER Step 10
-- =====================================================

-- Create Xendit payment intent
CREATE OR REPLACE FUNCTION create_xendit_payment(
    p_reservation_id UUID,
    p_payment_method_id UUID,
    p_amount DECIMAL(10,2),
    p_payment_type VARCHAR(50)
)
RETURNS JSON AS $$
DECLARE
    v_payment_id UUID;
    v_payment_method JSON;
    v_reservation_data JSON;
BEGIN
    -- Get payment method details
    SELECT row_to_json(pm.*) INTO v_payment_method
    FROM payment_methods pm
    WHERE pm.id = p_payment_method_id;
    
    -- Get reservation and customer details
    SELECT json_build_object(
        'reservation_id', r.id,
        'booking_code', r.booking_code,
        'invoice_number', r.invoice_number,
        'customer_name', c.full_name,
        'customer_email', c.email,
        'customer_phone', c.phone,
        'studio_name', s.name
    ) INTO v_reservation_data
    FROM reservations r
    JOIN customers c ON r.customer_id = c.id
    JOIN studios s ON r.studio_id = s.id
    WHERE r.id = p_reservation_id;
    
    -- Create payment record
    INSERT INTO payments (
        reservation_id, payment_method_id, amount, payment_type,
        expires_at
    ) VALUES (
        p_reservation_id, p_payment_method_id, p_amount, p_payment_type,
        NOW() + INTERVAL '24 hours'
    ) RETURNING id INTO v_payment_id;
    
    -- Return data for Xendit API call
    RETURN json_build_object(
        'payment_id', v_payment_id,
        'reservation_data', v_reservation_data,
        'payment_method', v_payment_method,
        'amount', p_amount,
        'currency', 'IDR',
        'external_id', v_payment_id::TEXT,
        'description', 'Studio Photo - ' || (v_reservation_data->>'booking_code') || ' - ' || p_payment_type
    );
END;
$$ LANGUAGE plpgsql;

-- Handle Xendit payment callback
CREATE OR REPLACE FUNCTION handle_xendit_callback(
    p_external_payment_id VARCHAR(255),
    p_status VARCHAR(100),
    p_callback_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_payment_record RECORD;
    v_total_paid DECIMAL(10,2);
BEGIN
    -- Update payment record
    UPDATE payments 
    SET 
        external_status = p_status,
        callback_data = p_callback_data,
        status = CASE 
            WHEN p_status IN ('PAID', 'SETTLED') THEN 'completed'
            WHEN p_status IN ('FAILED', 'EXPIRED') THEN 'failed'
            ELSE 'pending'
        END,
        paid_at = CASE 
            WHEN p_status IN ('PAID', 'SETTLED') THEN NOW()
            ELSE paid_at
        END,
        updated_at = NOW()
    WHERE external_payment_id = p_external_payment_id
    RETURNING * INTO v_payment_record;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Calculate total paid for this reservation
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM payments 
    WHERE reservation_id = v_payment_record.reservation_id 
        AND status = 'completed';
    
    -- Update reservation status based on payment
    UPDATE reservations 
    SET 
        payment_status = CASE 
            WHEN v_total_paid >= total_amount THEN 'completed'
            WHEN v_total_paid >= dp_amount THEN 'partial'
            ELSE 'pending'
        END,
        status = CASE 
            WHEN status = 'pending' AND v_total_paid >= dp_amount THEN 'confirmed'
            WHEN v_total_paid >= total_amount THEN 'completed'
            ELSE status
        END,
        confirmed_at = CASE 
            WHEN status = 'pending' AND v_total_paid >= dp_amount THEN NOW()
            ELSE confirmed_at
        END,
        updated_at = NOW()
    WHERE id = v_payment_record.reservation_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Verify payment functions
SELECT 'Xendit payment integration functions created successfully' as status;


-- =====================================================
-- STEP 12: ROW LEVEL SECURITY (RLS) POLICIES
-- Run this AFTER Step 11
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES (for website visitors)
CREATE POLICY "Studios are viewable by everyone" ON studios FOR SELECT USING (is_active = true);
CREATE POLICY "Portfolio is public" ON portfolios FOR SELECT USING (is_active = true);
CREATE POLICY "Portfolio categories are public" ON portfolio_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Packages are public" ON packages FOR SELECT USING (is_active = true);
CREATE POLICY "Package categories are public" ON package_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Package facilities are public" ON package_facilities FOR SELECT USING (true);
CREATE POLICY "Addons are public" ON addons FOR SELECT USING (is_active = true);
CREATE POLICY "Facilities are public" ON facilities FOR SELECT USING (is_available = true);
CREATE POLICY "Available time slots are public" ON time_slots FOR SELECT USING (is_available = true AND is_blocked = false);
CREATE POLICY "Payment methods are public" ON payment_methods FOR SELECT USING (is_active = true);

-- USER PROFILE POLICIES
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON user_profiles FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
);

-- CUSTOMER POLICIES (supports guest bookings)
CREATE POLICY "Anyone can create customer record" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own customer data" ON customers FOR SELECT USING (
    user_id = auth.uid() OR 
    auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'customer_service'))
);

-- RESERVATION POLICIES (guest + logged-in support)
CREATE POLICY "Anyone can create reservations" ON reservations FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own reservations" ON reservations FOR SELECT USING (
    user_id = auth.uid() OR 
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR
    auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE studio_id = reservations.studio_id 
        AND role IN ('admin', 'customer_service')
    )
);

CREATE POLICY "Staff can manage reservations" ON reservations FOR ALL USING (
    auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE studio_id = reservations.studio_id 
        AND role IN ('admin', 'customer_service')
    )
);

-- RESERVATION ADDONS POLICIES
CREATE POLICY "Anyone can create reservation addons" ON reservation_addons FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own reservation addons" ON reservation_addons FOR SELECT USING (
    reservation_id IN (
        SELECT id FROM reservations 
        WHERE user_id = auth.uid() OR 
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    ) OR
    auth.uid() IN (
        SELECT up.id FROM user_profiles up
        JOIN reservations r ON r.studio_id = up.studio_id
        WHERE r.id = reservation_addons.reservation_id 
        AND up.role IN ('admin', 'customer_service')
    )
);

-- PAYMENT POLICIES
CREATE POLICY "Anyone can create payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (
    reservation_id IN (
        SELECT id FROM reservations 
        WHERE user_id = auth.uid() OR 
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    ) OR
    auth.uid() IN (
        SELECT up.id FROM user_profiles up
        JOIN reservations r ON r.studio_id = up.studio_id
        WHERE r.id = payments.reservation_id 
        AND up.role IN ('admin', 'customer_service')
    )
);

-- ADMIN MANAGEMENT POLICIES
CREATE POLICY "Admins can manage studios" ON studios FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin' AND studio_id = studios.id)
);

CREATE POLICY "Admins can manage facilities" ON facilities FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin' AND studio_id = facilities.studio_id)
);

CREATE POLICY "Admins can manage packages" ON packages FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin' AND studio_id = packages.studio_id)
);

CREATE POLICY "Admins can manage addons" ON addons FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin' AND studio_id = addons.studio_id)
);

CREATE POLICY "Admins can manage portfolio" ON portfolios FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin' AND studio_id = portfolios.studio_id)
);

CREATE POLICY "Admins can manage reviews" ON reviews FOR ALL USING (
    auth.uid() IN (
        SELECT up.id FROM user_profiles up
        JOIN reservations r ON r.studio_id = up.studio_id
        WHERE r.id = reviews.reservation_id AND up.role = 'admin'
    )
);

-- STAFF POLICIES
CREATE POLICY "Staff can view studio data" ON staff FOR SELECT USING (
    user_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin' AND studio_id = staff.studio_id)
);

-- Verify RLS policies
SELECT 'Row Level Security policies created successfully' as status;


