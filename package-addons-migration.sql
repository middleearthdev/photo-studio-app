-- Migration: Add Package-Addons Relationship
-- This creates a many-to-many relationship between packages and addons

-- Package Addons relationship table
CREATE TABLE package_addons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    addon_id UUID REFERENCES addons(id) ON DELETE CASCADE,
    is_included BOOLEAN DEFAULT false, -- Whether addon is included in package price
    discount_percentage DECIMAL(5,2) DEFAULT 0, -- Discount when bundled with package
    display_order INTEGER DEFAULT 0, -- Order to display in UI
    is_recommended BOOLEAN DEFAULT false, -- Mark as recommended addon
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_package_addon UNIQUE (package_id, addon_id)
);

-- Add indexes for performance
CREATE INDEX idx_package_addons_package_id ON package_addons(package_id);
CREATE INDEX idx_package_addons_addon_id ON package_addons(addon_id);
CREATE INDEX idx_package_addons_display_order ON package_addons(package_id, display_order);

-- Add trigger for updated_at
CREATE TRIGGER trigger_package_addons_updated_at 
    BEFORE UPDATE ON package_addons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE package_addons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can view package addons
CREATE POLICY "Package addons are public" ON package_addons 
    FOR SELECT USING (true);

-- Admin can manage all package addons
CREATE POLICY "Admins can manage all package addons" ON package_addons 
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
    );

-- CS can manage their studio's package addons
CREATE POLICY "CS can manage their studio package addons" ON package_addons 
    FOR ALL USING (
        auth.uid() IN (
            SELECT up.id FROM user_profiles up
            JOIN packages p ON p.studio_id = up.studio_id
            WHERE up.role = 'cs' AND p.id = package_addons.package_id
        )
    );

-- Sample data (optional - uncomment to add test data)
/*
-- Insert some sample package-addon relationships
INSERT INTO package_addons (package_id, addon_id, is_included, discount_percentage, is_recommended, display_order)
SELECT 
    p.id as package_id,
    a.id as addon_id,
    false as is_included,
    10 as discount_percentage,
    true as is_recommended,
    ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY a.created_at) as display_order
FROM packages p
CROSS JOIN addons a
WHERE p.studio_id = a.studio_id
LIMIT 20; -- Adjust as needed
*/