-- Add missing icon column to facilities table
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS icon VARCHAR(50);

-- Update existing facilities with default icon if needed
UPDATE facilities SET icon = 'camera' WHERE icon IS NULL;