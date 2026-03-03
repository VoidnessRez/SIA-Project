-- =====================================================
-- POPULATE SAMPLE DATA FOR NEW FEATURES
-- Run this AFTER running the schema files
-- =====================================================

-- =====================================================
-- 1. UPDATE MAX STOCK LEVELS (for Overstock Alerts)
-- =====================================================

-- Set realistic max stock levels for existing spare parts
UPDATE spare_parts 
SET max_stock_level = CASE 
  WHEN stock_quantity > 150 THEN stock_quantity + 20  -- Items already high in stock
  WHEN stock_quantity > 100 THEN 150
  WHEN stock_quantity > 50 THEN 100
  ELSE 80
END
WHERE max_stock_level = 200; -- Only update defaults

-- Set realistic max stock levels for existing accessories
UPDATE accessories 
SET max_stock_level = CASE 
  WHEN stock_quantity > 150 THEN stock_quantity + 20
  WHEN stock_quantity > 100 THEN 150
  WHEN stock_quantity > 50 THEN 100
  ELSE 80
END
WHERE max_stock_level = 200;

-- Create some intentional overstocked items for testing
UPDATE spare_parts 
SET stock_quantity = max_stock_level + 50,
    max_stock_level = GREATEST(max_stock_level, 80)
WHERE id IN (
  SELECT id FROM spare_parts 
  WHERE is_active = true 
  ORDER BY RANDOM() 
  LIMIT 3
);

UPDATE accessories 
SET stock_quantity = max_stock_level + 30,
    max_stock_level = GREATEST(max_stock_level, 60)
WHERE id IN (
  SELECT id FROM accessories 
  WHERE is_active = true 
  ORDER BY RANDOM() 
  LIMIT 2
);

-- =====================================================
-- 2. CREATE SAMPLE PRICE HISTORY (Manual entries)
-- =====================================================

-- Insert historical price changes for spare parts
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
  change_date
)
SELECT 
  'spare_part' as product_type,
  sp.id as product_id,
  sp.sku as product_sku,
  sp.name as product_name,
  sp.cost_price - (RANDOM() * 50 + 20) as old_cost_price,
  sp.cost_price as new_cost_price,
  sp.selling_price - (RANDOM() * 100 + 50) as old_selling_price,
  sp.selling_price as new_selling_price,
  (RANDOM() * 100 + 50) as price_difference,
  ((RANDOM() * 20) + 5) as percentage_change,
  'increase' as change_type,
  CASE 
    WHEN RANDOM() > 0.7 THEN 'Supplier cost increase'
    WHEN RANDOM() > 0.4 THEN 'Market price adjustment'
    ELSE 'Inventory revaluation'
  END as change_reason,
  NOW() - (RANDOM() * INTERVAL '60 days') as change_date
FROM spare_parts sp
WHERE sp.is_active = true
ORDER BY RANDOM()
LIMIT 10;

-- Insert some price decreases
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
  change_date
)
SELECT 
  'spare_part' as product_type,
  sp.id as product_id,
  sp.sku as product_sku,
  sp.name as product_name,
  sp.cost_price + (RANDOM() * 30 + 10) as old_cost_price,
  sp.cost_price as new_cost_price,
  sp.selling_price + (RANDOM() * 80 + 30) as old_selling_price,
  sp.selling_price as new_selling_price,
  -(RANDOM() * 80 + 30) as price_difference,
  -((RANDOM() * 15) + 5) as percentage_change,
  'decrease' as change_type,
  CASE 
    WHEN RANDOM() > 0.6 THEN 'Promotional discount'
    WHEN RANDOM() > 0.3 THEN 'Clearance sale'
    ELSE 'Competitor price matching'
  END as change_reason,
  NOW() - (RANDOM() * INTERVAL '45 days') as change_date
FROM spare_parts sp
WHERE sp.is_active = true
ORDER BY RANDOM()
LIMIT 5;

-- Add price history for accessories
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
  change_date
)
SELECT 
  'accessory' as product_type,
  ac.id as product_id,
  ac.sku as product_sku,
  ac.name as product_name,
  ac.cost_price - (RANDOM() * 40 + 15) as old_cost_price,
  ac.cost_price as new_cost_price,
  ac.selling_price - (RANDOM() * 75 + 25) as old_selling_price,
  ac.selling_price as new_selling_price,
  (RANDOM() * 75 + 25) as price_difference,
  ((RANDOM() * 18) + 4) as percentage_change,
  'increase' as change_type,
  'Regular price adjustment' as change_reason,
  NOW() - (RANDOM() * INTERVAL '30 days') as change_date
FROM accessories ac
WHERE ac.is_active = true
ORDER BY RANDOM()
LIMIT 8;

-- =====================================================
-- 3. CREATE SAMPLE STOCK RELEASES
-- =====================================================

-- Insert sample stock release requests
INSERT INTO stock_releases (
  product_type,
  product_id,
  product_sku,
  product_name,
  quantity_released,
  release_type,
  release_reason,
  released_to,
  destination,
  unit_cost,
  total_cost,
  status,
  requested_at,
  notes
)
SELECT 
  'spare_part' as product_type,
  sp.id as product_id,
  sp.sku as product_sku,
  sp.name as product_name,
  FLOOR(RANDOM() * 10 + 5)::INTEGER as quantity_released,
  CASE 
    WHEN RANDOM() > 0.7 THEN 'damage'
    WHEN RANDOM() > 0.4 THEN 'internal_use'
    WHEN RANDOM() > 0.2 THEN 'sample'
    ELSE 'return_to_supplier'
  END as release_type,
  CASE 
    WHEN RANDOM() > 0.6 THEN 'Defective units found during inspection'
    WHEN RANDOM() > 0.3 THEN 'Used for testing and quality control'
    ELSE 'Wrong specification received'
  END as release_reason,
  CASE 
    WHEN RANDOM() > 0.5 THEN 'Warehouse - Quality Control'
    ELSE 'Service Center'
  END as released_to,
  'Main Warehouse Bay 3' as destination,
  sp.cost_price as unit_cost,
  sp.cost_price * FLOOR(RANDOM() * 10 + 5) as total_cost,
  CASE 
    WHEN RANDOM() > 0.6 THEN 'pending'
    WHEN RANDOM() > 0.3 THEN 'approved'
    ELSE 'released'
  END as status,
  NOW() - (RANDOM() * INTERVAL '14 days') as requested_at,
  'Auto-generated sample data for testing' as notes
FROM spare_parts sp
WHERE sp.is_active = true
ORDER BY RANDOM()
LIMIT 8;

-- Add stock releases for accessories
INSERT INTO stock_releases (
  product_type,
  product_id,
  product_sku,
  product_name,
  quantity_released,
  release_type,
  release_reason,
  released_to,
  destination,
  unit_cost,
  total_cost,
  status,
  requested_at,
  notes
)
SELECT 
  'accessory' as product_type,
  ac.id as product_id,
  ac.sku as product_sku,
  ac.name as product_name,
  FLOOR(RANDOM() * 8 + 3)::INTEGER as quantity_released,
  CASE 
    WHEN RANDOM() > 0.5 THEN 'damage'
    ELSE 'sample'
  END as release_type,
  'Quality inspection - Sample units' as release_reason,
  'QC Department' as released_to,
  'Testing Lab' as destination,
  ac.cost_price as unit_cost,
  ac.cost_price * FLOOR(RANDOM() * 8 + 3) as total_cost,
  CASE 
    WHEN RANDOM() > 0.5 THEN 'pending'
    ELSE 'approved'
  END as status,
  NOW() - (RANDOM() * INTERVAL '7 days') as requested_at,
  'Sample for product review' as notes
FROM accessories ac
WHERE ac.is_active = true
ORDER BY RANDOM()
LIMIT 5;

-- =====================================================
-- 4. CREATE SAMPLE INVENTORY TRANSACTIONS (Incoming/Outgoing)
-- =====================================================

-- Check if inventory_transactions table exists, if not create it
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id SERIAL PRIMARY KEY,
  product_type VARCHAR(20) NOT NULL,
  product_id INTEGER NOT NULL,
  product_sku VARCHAR(50) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL, -- 'incoming', 'outgoing'
  quantity INTEGER NOT NULL,
  transaction_reason VARCHAR(100), -- 'purchase', 'sale', 'adjustment', 'return', 'damage'
  reference_number VARCHAR(100),
  unit_cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  previous_quantity INTEGER,
  new_quantity INTEGER,
  notes TEXT,
  created_by UUID REFERENCES adminauth(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(created_at DESC);

-- Insert incoming transactions (stock purchases/deliveries)
INSERT INTO inventory_transactions (
  product_type,
  product_id,
  product_sku,
  product_name,
  transaction_type,
  quantity,
  transaction_reason,
  reference_number,
  unit_cost,
  total_cost,
  previous_quantity,
  new_quantity,
  notes,
  created_at
)
SELECT 
  'spare_part' as product_type,
  sp.id as product_id,
  sp.sku as product_sku,
  sp.name as product_name,
  'incoming' as transaction_type,
  FLOOR(RANDOM() * 50 + 20)::INTEGER as quantity,
  'purchase' as transaction_reason,
  'PO-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0') as reference_number,
  sp.cost_price as unit_cost,
  sp.cost_price * FLOOR(RANDOM() * 50 + 20) as total_cost,
  sp.stock_quantity - FLOOR(RANDOM() * 50 + 20) as previous_quantity,
  sp.stock_quantity as new_quantity,
  'Regular stock replenishment' as notes,
  NOW() - (RANDOM() * INTERVAL '30 days') as created_at
FROM spare_parts sp
WHERE sp.is_active = true
ORDER BY RANDOM()
LIMIT 15;

-- Insert outgoing transactions (sales/usage)
INSERT INTO inventory_transactions (
  product_type,
  product_id,
  product_sku,
  product_name,
  transaction_type,
  quantity,
  transaction_reason,
  reference_number,
  unit_cost,
  total_cost,
  previous_quantity,
  new_quantity,
  notes,
  created_at
)
SELECT 
  'spare_part' as product_type,
  sp.id as product_id,
  sp.sku as product_sku,
  sp.name as product_name,
  'outgoing' as transaction_type,
  FLOOR(RANDOM() * 15 + 5)::INTEGER as quantity,
  CASE 
    WHEN RANDOM() > 0.7 THEN 'sale'
    WHEN RANDOM() > 0.4 THEN 'internal_use'
    ELSE 'adjustment'
  END as transaction_reason,
  'ORD-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0') as reference_number,
  sp.cost_price as unit_cost,
  sp.cost_price * FLOOR(RANDOM() * 15 + 5) as total_cost,
  sp.stock_quantity + FLOOR(RANDOM() * 15 + 5) as previous_quantity,
  sp.stock_quantity as new_quantity,
  'Customer order fulfillment' as notes,
  NOW() - (RANDOM() * INTERVAL '20 days') as created_at
FROM spare_parts sp
WHERE sp.is_active = true
ORDER BY RANDOM()
LIMIT 12;

-- Add transactions for accessories
INSERT INTO inventory_transactions (
  product_type,
  product_id,
  product_sku,
  product_name,
  transaction_type,
  quantity,
  transaction_reason,
  reference_number,
  unit_cost,
  total_cost,
  previous_quantity,
  new_quantity,
  notes,
  created_at
)
SELECT 
  'accessory' as product_type,
  ac.id as product_id,
  ac.sku as product_sku,
  ac.name as product_name,
  CASE 
    WHEN RANDOM() > 0.5 THEN 'incoming'
    ELSE 'outgoing'
  END as transaction_type,
  FLOOR(RANDOM() * 30 + 10)::INTEGER as quantity,
  CASE 
    WHEN RANDOM() > 0.6 THEN 'purchase'
    WHEN RANDOM() > 0.3 THEN 'sale'
    ELSE 'adjustment'
  END as transaction_reason,
  'TXN-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0') as reference_number,
  ac.cost_price as unit_cost,
  ac.cost_price * FLOOR(RANDOM() * 30 + 10) as total_cost,
  ac.stock_quantity as previous_quantity,
  ac.stock_quantity as new_quantity,
  'Regular inventory movement' as notes,
  NOW() - (RANDOM() * INTERVAL '25 days') as created_at
FROM accessories ac
WHERE ac.is_active = true
ORDER BY RANDOM()
LIMIT 10;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check overstocked items
SELECT 
  'Overstocked Items' as check_type,
  COUNT(*) as count
FROM spare_parts
WHERE stock_quantity > max_stock_level
UNION ALL
SELECT 
  'Overstocked Accessories',
  COUNT(*)
FROM accessories
WHERE stock_quantity > max_stock_level;

-- Check price history entries
SELECT 
  'Price History Entries' as check_type,
  COUNT(*) as count
FROM price_history;

-- Check stock releases
SELECT 
  'Stock Releases' as check_type,
  COUNT(*) as count
FROM stock_releases;

-- Check inventory transactions
SELECT 
  'Inventory Transactions' as check_type,
  COUNT(*) as count
FROM inventory_transactions;

-- Summary by status
SELECT 
  status,
  COUNT(*) as release_count
FROM stock_releases
GROUP BY status
ORDER BY status;

-- Summary by transaction type
SELECT 
  transaction_type,
  COUNT(*) as transaction_count,
  SUM(quantity) as total_quantity
FROM inventory_transactions
GROUP BY transaction_type
ORDER BY transaction_type;

COMMENT ON TABLE inventory_transactions IS 'Tracks all inventory movements (incoming/outgoing stock)';
COMMENT ON TABLE price_history IS 'Historical record of all product price changes';
COMMENT ON TABLE stock_releases IS 'Tracks stock releases for various purposes (damage, samples, returns, etc.)';
