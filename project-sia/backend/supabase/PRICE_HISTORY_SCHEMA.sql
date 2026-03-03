-- =====================================================
-- PRICE HISTORY TABLE
-- Tracks all price changes for spare parts and accessories
-- =====================================================

CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  
  -- Product Reference
  product_type VARCHAR(20) NOT NULL, -- 'spare_part' or 'accessory'
  product_id INTEGER NOT NULL,
  product_sku VARCHAR(50) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  
  -- Price Information
  old_cost_price DECIMAL(10, 2),
  new_cost_price DECIMAL(10, 2),
  old_selling_price DECIMAL(10, 2) NOT NULL,
  new_selling_price DECIMAL(10, 2) NOT NULL,
  
  -- Price Change Details
  price_difference DECIMAL(10, 2), -- Calculated: new - old
  percentage_change DECIMAL(5, 2), -- Calculated: ((new - old) / old) * 100
  change_type VARCHAR(20) NOT NULL, -- 'increase' or 'decrease'
  
  -- Change Metadata
  change_reason TEXT, -- e.g., "Market price adjustment", "Supplier cost increase", "Promotion"
  changed_by UUID REFERENCES adminauth(id) ON DELETE SET NULL,
  change_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional Context
  market_price DECIMAL(10, 2), -- Current market price if known
  competitor_price DECIMAL(10, 2), -- Competitor price if available
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_sku ON price_history(product_sku);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(change_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_change_type ON price_history(change_type);

-- =====================================================
-- TRIGGER: Auto-create price history entry when product price changes
-- =====================================================

-- Function to log spare parts price changes
CREATE OR REPLACE FUNCTION log_spare_part_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.selling_price IS DISTINCT FROM NEW.selling_price) OR (OLD.cost_price IS DISTINCT FROM NEW.cost_price) THEN
    INSERT INTO price_history (
      product_type,
      product_id,
      product_sku,
      product_name,
      old_cost_price,
      new_cost_price,
      old_selling_price,
      new_selling_price,
      price_difference,
      percentage_change,
      change_type,
      change_reason,
      changed_by
    ) VALUES (
      'spare_part',
      NEW.id,
      NEW.sku,
      NEW.name,
      OLD.cost_price,
      NEW.cost_price,
      OLD.selling_price,
      NEW.selling_price,
      NEW.selling_price - OLD.selling_price,
      CASE 
        WHEN OLD.selling_price > 0 THEN ((NEW.selling_price - OLD.selling_price) / OLD.selling_price * 100)
        ELSE 0
      END,
      CASE 
        WHEN NEW.selling_price > OLD.selling_price THEN 'increase'
        ELSE 'decrease'
      END,
      'Auto-logged price update',
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log accessory price changes
CREATE OR REPLACE FUNCTION log_accessory_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.selling_price IS DISTINCT FROM NEW.selling_price) OR (OLD.cost_price IS DISTINCT FROM NEW.cost_price) THEN
    INSERT INTO price_history (
      product_type,
      product_id,
      product_sku,
      product_name,
      old_cost_price,
      new_cost_price,
      old_selling_price,
      new_selling_price,
      price_difference,
      percentage_change,
      change_type,
      change_reason,
      changed_by
    ) VALUES (
      'accessory',
      NEW.id,
      NEW.sku,
      NEW.name,
      OLD.cost_price,
      NEW.cost_price,
      OLD.selling_price,
      NEW.selling_price,
      NEW.selling_price - OLD.selling_price,
      CASE 
        WHEN OLD.selling_price > 0 THEN ((NEW.selling_price - OLD.selling_price) / OLD.selling_price * 100)
        ELSE 0
      END,
      CASE 
        WHEN NEW.selling_price > OLD.selling_price THEN 'increase'
        ELSE 'decrease'
      END,
      'Auto-logged price update',
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS spare_part_price_change_trigger ON spare_parts;
CREATE TRIGGER spare_part_price_change_trigger
AFTER UPDATE ON spare_parts
FOR EACH ROW
EXECUTE FUNCTION log_spare_part_price_change();

DROP TRIGGER IF EXISTS accessory_price_change_trigger ON accessories;
CREATE TRIGGER accessory_price_change_trigger
AFTER UPDATE ON accessories
FOR EACH ROW
EXECUTE FUNCTION log_accessory_price_change();

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get all price changes for a specific product
-- SELECT * FROM price_history 
-- WHERE product_type = 'spare_part' AND product_id = 1 
-- ORDER BY change_date DESC;

-- Get recent price increases
-- SELECT * FROM price_history 
-- WHERE change_type = 'increase' 
-- ORDER BY change_date DESC LIMIT 20;

-- Get price changes in last 30 days
-- SELECT * FROM price_history 
-- WHERE change_date >= NOW() - INTERVAL '30 days' 
-- ORDER BY change_date DESC;

-- Get products with biggest price changes
-- SELECT 
--   product_name,
--   product_sku,
--   old_selling_price,
--   new_selling_price,
--   price_difference,
--   percentage_change
-- FROM price_history
-- ORDER BY ABS(percentage_change) DESC
-- LIMIT 10;
