-- Migration script to support both percentage and fixed amount fees for payment methods
-- This script adds new columns to support fixed fee amounts and fee type selection

-- Add new columns to payment_methods table
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS fee_type VARCHAR(20) DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(10,2) DEFAULT 0;

-- Update existing records to set fee_type based on current fee_percentage
-- If fee_percentage > 0, keep as percentage, otherwise we'll leave as 'percentage' by default
UPDATE payment_methods 
SET fee_type = 'percentage' 
WHERE fee_percentage > 0;

-- Add constraint to ensure fee_type is either 'percentage' or 'fixed'
ALTER TABLE payment_methods 
ADD CONSTRAINT valid_fee_type 
CHECK (fee_type IN ('percentage', 'fixed'));

-- Add comment to explain the new columns
COMMENT ON COLUMN payment_methods.fee_type IS 'Type of fee: percentage or fixed';
COMMENT ON COLUMN payment_methods.fee_amount IS 'Fixed fee amount (used when fee_type is fixed)';