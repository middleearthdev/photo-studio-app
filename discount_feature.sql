-- ============================================
-- SQL Script untuk Discount Feature
-- Studio Foto App - Manual Booking
-- ============================================

-- 1. Tambah field discount_id ke tabel reservations (opsional reference)
ALTER TABLE reservations 
ADD COLUMN discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL;

-- Add comment untuk field yang sudah ada
COMMENT ON COLUMN reservations.discount_amount IS 'Total amount discount applied to this reservation';
COMMENT ON COLUMN reservations.discount_id IS 'Reference to discount used (optional, for tracking)';

-- 2. Create table discounts - Master data discount
CREATE TABLE discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    
    -- Discount info
    code VARCHAR(50) UNIQUE, -- kode diskon (opsional untuk manual entry)
    name VARCHAR(255) NOT NULL, -- nama diskon
    description TEXT,
    
    -- Discount calculation
    type VARCHAR(20) CHECK (type IN ('percentage', 'fixed_amount')) NOT NULL,
    value DECIMAL(10,2) NOT NULL, -- nilai diskon (% atau rupiah)
    minimum_amount DECIMAL(15,2) DEFAULT 0, -- minimum transaksi untuk apply discount
    maximum_discount DECIMAL(15,2), -- maksimum diskon (untuk percentage type)
    
    -- Validity and limits
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER, -- batas penggunaan (NULL = unlimited)
    used_count INTEGER DEFAULT 0, -- tracking berapa kali sudah digunakan
    
    -- Scope
    applies_to VARCHAR(20) CHECK (applies_to IN ('all', 'packages', 'addons')) DEFAULT 'all',
    
    -- Audit fields
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comments untuk table discounts
COMMENT ON TABLE discounts IS 'Master data for discount codes and promotions';
COMMENT ON COLUMN discounts.code IS 'Unique discount code (optional, can be used for promo codes)';
COMMENT ON COLUMN discounts.type IS 'Type of discount: percentage (%) or fixed_amount (Rp)';
COMMENT ON COLUMN discounts.value IS 'Discount value - percentage (1-100) or fixed amount in Rupiah';
COMMENT ON COLUMN discounts.minimum_amount IS 'Minimum transaction amount to apply this discount';
COMMENT ON COLUMN discounts.maximum_discount IS 'Maximum discount amount for percentage type';
COMMENT ON COLUMN discounts.usage_limit IS 'Maximum number of times this discount can be used (NULL = unlimited)';
COMMENT ON COLUMN discounts.applies_to IS 'What the discount applies to: all, packages only, or addons only';

-- 3. Create table reservation_discounts - Track discount usage
CREATE TABLE reservation_discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL,
    
    -- Snapshot of discount details (for historical record)
    discount_code VARCHAR(50),
    discount_name VARCHAR(255) NOT NULL,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(15,2) NOT NULL, -- actual amount discounted
    
    -- Audit
    applied_by UUID REFERENCES user_profiles(id),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    notes TEXT -- untuk manual discount bisa ada keterangan
);

-- Add comments untuk table reservation_discounts
COMMENT ON TABLE reservation_discounts IS 'Track discount applications to reservations';
COMMENT ON COLUMN reservation_discounts.discount_amount IS 'Actual discount amount applied to the reservation';
COMMENT ON COLUMN reservation_discounts.applied_by IS 'Staff member who applied the discount';
COMMENT ON COLUMN reservation_discounts.notes IS 'Additional notes for manual discounts';

-- 4. Create indexes untuk performance
CREATE INDEX idx_discounts_studio_id ON discounts(studio_id);
CREATE INDEX idx_discounts_code ON discounts(code) WHERE code IS NOT NULL;
CREATE INDEX idx_discounts_active ON discounts(is_active, valid_from, valid_until);
CREATE INDEX idx_discounts_studio_active ON discounts(studio_id, is_active) WHERE is_active = true;

CREATE INDEX idx_reservation_discounts_reservation_id ON reservation_discounts(reservation_id);
CREATE INDEX idx_reservation_discounts_discount_id ON reservation_discounts(discount_id) WHERE discount_id IS NOT NULL;
CREATE INDEX idx_reservation_discounts_applied_by ON reservation_discounts(applied_by);

-- 5. Enable RLS (Row Level Security)
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_discounts ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
-- Policy untuk discounts - hanya admin atau CS dari studio yang sama
CREATE POLICY "discounts_studio_access" ON discounts
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM user_profiles 
            WHERE role = 'admin' 
               OR (role = 'cs' AND studio_id = discounts.studio_id)
        )
    );

-- Policy untuk reservation_discounts 
CREATE POLICY "reservation_discounts_studio_access" ON reservation_discounts
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM user_profiles 
            WHERE role = 'admin' 
               OR (role = 'cs' AND studio_id IN (
                   SELECT studio_id FROM reservations 
                   WHERE id = reservation_discounts.reservation_id
               ))
        )
    );

-- 7. Create function untuk validasi discount
CREATE OR REPLACE FUNCTION validate_discount(
    p_discount_id UUID,
    p_reservation_total DECIMAL(15,2),
    p_studio_id UUID DEFAULT NULL
) RETURNS TABLE(
    is_valid BOOLEAN,
    discount_amount DECIMAL(15,2),
    error_message TEXT,
    discount_info JSON
) AS $$
DECLARE
    discount_record discounts;
    calculated_discount DECIMAL(15,2);
BEGIN
    -- Get discount record
    SELECT * INTO discount_record 
    FROM discounts 
    WHERE id = p_discount_id 
      AND is_active = true
      AND (p_studio_id IS NULL OR studio_id = p_studio_id);
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0::DECIMAL(15,2), 'Discount not found or inactive', '{}'::JSON;
        RETURN;
    END IF;
    
    -- Check validity period
    IF discount_record.valid_from IS NOT NULL AND discount_record.valid_from > now() THEN
        RETURN QUERY SELECT false, 0::DECIMAL(15,2), 'Discount is not yet valid', '{}'::JSON;
        RETURN;
    END IF;
    
    IF discount_record.valid_until IS NOT NULL AND discount_record.valid_until < now() THEN
        RETURN QUERY SELECT false, 0::DECIMAL(15,2), 'Discount has expired', '{}'::JSON;
        RETURN;
    END IF;
    
    -- Check minimum amount
    IF p_reservation_total < discount_record.minimum_amount THEN
        RETURN QUERY SELECT false, 0::DECIMAL(15,2), 
            'Minimum transaction amount: Rp ' || discount_record.minimum_amount::TEXT, 
            '{}'::JSON;
        RETURN;
    END IF;
    
    -- Check usage limit
    IF discount_record.usage_limit IS NOT NULL AND discount_record.used_count >= discount_record.usage_limit THEN
        RETURN QUERY SELECT false, 0::DECIMAL(15,2), 'Discount usage limit exceeded', '{}'::JSON;
        RETURN;
    END IF;
    
    -- Calculate discount amount
    IF discount_record.type = 'percentage' THEN
        calculated_discount := (p_reservation_total * discount_record.value / 100);
        -- Apply maximum discount if set
        IF discount_record.maximum_discount IS NOT NULL AND calculated_discount > discount_record.maximum_discount THEN
            calculated_discount := discount_record.maximum_discount;
        END IF;
    ELSE
        calculated_discount := discount_record.value;
    END IF;
    
    -- Ensure discount doesn't exceed total
    IF calculated_discount > p_reservation_total THEN
        calculated_discount := p_reservation_total;
    END IF;
    
    -- Return success with discount info
    RETURN QUERY SELECT 
        true, 
        calculated_discount,
        ''::TEXT,
        json_build_object(
            'id', discount_record.id,
            'code', discount_record.code,
            'name', discount_record.name,
            'type', discount_record.type,
            'value', discount_record.value,
            'remaining_uses', CASE 
                WHEN discount_record.usage_limit IS NULL THEN NULL
                ELSE discount_record.usage_limit - discount_record.used_count
            END
        );
END;
$$ LANGUAGE plpgsql;

-- 8. Create function untuk apply discount
CREATE OR REPLACE FUNCTION apply_discount_to_reservation(
    p_reservation_id UUID,
    p_discount_id UUID,
    p_applied_by UUID,
    p_notes TEXT DEFAULT NULL
) RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    discount_amount DECIMAL(15,2)
) AS $$
DECLARE
    reservation_record reservations;
    discount_record discounts;
    validation_result RECORD;
    calculated_discount DECIMAL(15,2);
BEGIN
    -- Get reservation
    SELECT * INTO reservation_record FROM reservations WHERE id = p_reservation_id;
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Reservation not found', 0::DECIMAL(15,2);
        RETURN;
    END IF;
    
    -- Validate discount
    SELECT * INTO validation_result 
    FROM validate_discount(p_discount_id, reservation_record.total_amount, reservation_record.studio_id);
    
    IF NOT validation_result.is_valid THEN
        RETURN QUERY SELECT false, validation_result.error_message, 0::DECIMAL(15,2);
        RETURN;
    END IF;
    
    calculated_discount := validation_result.discount_amount;
    
    -- Get discount record for snapshot
    SELECT * INTO discount_record FROM discounts WHERE id = p_discount_id;
    
    -- Update reservation with discount
    UPDATE reservations 
    SET discount_id = p_discount_id,
        discount_amount = calculated_discount,
        total_amount = total_amount - calculated_discount,
        remaining_amount = remaining_amount - calculated_discount,
        updated_at = now()
    WHERE id = p_reservation_id;
    
    -- Record discount application
    INSERT INTO reservation_discounts (
        reservation_id, discount_id, discount_code, discount_name, 
        discount_type, discount_value, discount_amount, applied_by, notes
    ) VALUES (
        p_reservation_id, p_discount_id, discount_record.code, discount_record.name,
        discount_record.type, discount_record.value, calculated_discount, p_applied_by, p_notes
    );
    
    -- Increment usage count
    UPDATE discounts 
    SET used_count = used_count + 1,
        updated_at = now()
    WHERE id = p_discount_id;
    
    RETURN QUERY SELECT true, 'Discount applied successfully', calculated_discount;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function untuk remove discount
CREATE OR REPLACE FUNCTION remove_discount_from_reservation(
    p_reservation_id UUID,
    p_removed_by UUID
) RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    reservation_record reservations;
    discount_amount_to_restore DECIMAL(15,2);
    discount_id_to_update UUID;
BEGIN
    -- Get reservation with current discount
    SELECT * INTO reservation_record FROM reservations WHERE id = p_reservation_id;
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Reservation not found';
        RETURN;
    END IF;
    
    IF reservation_record.discount_amount = 0 THEN
        RETURN QUERY SELECT false, 'No discount applied to this reservation';
        RETURN;
    END IF;
    
    discount_amount_to_restore := reservation_record.discount_amount;
    discount_id_to_update := reservation_record.discount_id;
    
    -- Remove discount from reservation
    UPDATE reservations 
    SET discount_id = NULL,
        discount_amount = 0,
        total_amount = total_amount + discount_amount_to_restore,
        remaining_amount = remaining_amount + discount_amount_to_restore,
        updated_at = now()
    WHERE id = p_reservation_id;
    
    -- Soft delete discount application record (keep for audit)
    UPDATE reservation_discounts 
    SET notes = COALESCE(notes, '') || ' [REMOVED by staff on ' || now()::TEXT || ']'
    WHERE reservation_id = p_reservation_id;
    
    -- Decrement usage count if discount still exists
    IF discount_id_to_update IS NOT NULL THEN
        UPDATE discounts 
        SET used_count = GREATEST(used_count - 1, 0),
            updated_at = now()
        WHERE id = discount_id_to_update;
    END IF;
    
    RETURN QUERY SELECT true, 'Discount removed successfully';
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 11. Insert sample data untuk testing (opsional)
-- Uncomment jika ingin insert sample data

/*
-- Sample discounts untuk testing
INSERT INTO discounts (studio_id, name, description, type, value, minimum_amount, maximum_discount, is_active, applies_to, created_by) 
VALUES 
-- Discount percentage
((SELECT id FROM studios LIMIT 1), 'Diskon 10%', 'Diskon 10% untuk semua paket', 'percentage', 10.00, 100000, 50000, true, 'all', (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1)),
-- Discount fixed amount
((SELECT id FROM studios LIMIT 1), 'Potongan 25rb', 'Potongan langsung Rp 25.000', 'fixed_amount', 25000.00, 150000, NULL, true, 'all', (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1)),
-- Discount dengan kode
((SELECT id FROM studios LIMIT 1), 'Promo Akhir Tahun', 'Promo spesial akhir tahun', 'percentage', 15.00, 200000, 100000, true, 'all', (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1));

-- Update discount dengan kode
UPDATE discounts SET code = 'NEWYEAR2024' WHERE name = 'Promo Akhir Tahun';
*/

-- 12. Grant permissions (sesuaikan dengan user role Anda)
-- GRANT SELECT, INSERT, UPDATE ON discounts TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON reservation_discounts TO authenticated;

-- ============================================
-- End of SQL Script
-- ============================================

-- Untuk rollback jika diperlukan:
-- DROP FUNCTION IF EXISTS remove_discount_from_reservation(UUID, UUID);
-- DROP FUNCTION IF EXISTS apply_discount_to_reservation(UUID, UUID, UUID, TEXT);
-- DROP FUNCTION IF EXISTS validate_discount(UUID, DECIMAL(15,2), UUID);
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS reservation_discounts CASCADE;
-- DROP TABLE IF EXISTS discounts CASCADE;
-- ALTER TABLE reservations DROP COLUMN IF EXISTS discount_id;