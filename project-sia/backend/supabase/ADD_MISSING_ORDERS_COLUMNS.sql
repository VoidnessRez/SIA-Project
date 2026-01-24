-- Add missing columns to orders table for new checkout functionality
-- These columns support the pickup vs delivery fulfillment methods

-- Add fulfillment_method column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS fulfillment_method VARCHAR(20) DEFAULT 'pickup';
-- fulfillment_method: 'pickup' or 'delivery'

-- Add delivery_barangay column for complete delivery address
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_barangay VARCHAR(100);

-- Comment on columns for documentation
COMMENT ON COLUMN orders.fulfillment_method IS 'How customer receives order: pickup (from store) or delivery (to address)';
COMMENT ON COLUMN orders.delivery_barangay IS 'Barangay/Ward for delivery address';

-- Update existing rows to have fulfillment_method if null (default to pickup)
UPDATE orders SET fulfillment_method = 'pickup' WHERE fulfillment_method IS NULL;

-- Add constraint to ensure valid fulfillment methods
ALTER TABLE orders 
ADD CONSTRAINT valid_fulfillment_method CHECK (fulfillment_method IN ('pickup', 'delivery'));

-- Create index on fulfillment_method for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_method ON orders(fulfillment_method);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

