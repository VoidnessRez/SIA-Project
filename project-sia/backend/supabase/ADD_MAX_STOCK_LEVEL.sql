-- =====================================================
-- ADD MAX_STOCK_LEVEL COLUMNS FOR OVERSTOCKING MONITORING
-- =====================================================

-- Add max_stock_level to spare_parts table
ALTER TABLE spare_parts 
ADD COLUMN IF NOT EXISTS max_stock_level INTEGER DEFAULT 200;

-- Add max_stock_level to accessories table
ALTER TABLE accessories 
ADD COLUMN IF NOT EXISTS max_stock_level INTEGER DEFAULT 200;

-- Comment the columns
COMMENT ON COLUMN spare_parts.max_stock_level IS 'Maximum stock level before overstocking alert';
COMMENT ON COLUMN accessories.max_stock_level IS 'Maximum stock level before overstocking alert';

-- Create index for faster queries on overstocked items
CREATE INDEX IF NOT EXISTS idx_spare_parts_overstock 
ON spare_parts(stock_quantity) 
WHERE stock_quantity > max_stock_level;

CREATE INDEX IF NOT EXISTS idx_accessories_overstock 
ON accessories(stock_quantity) 
WHERE stock_quantity > max_stock_level;
