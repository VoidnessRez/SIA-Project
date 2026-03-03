-- =====================================================
-- STOCK RELEASE SCHEMA  
-- Track stock releases for various purposes
-- =====================================================

CREATE TABLE IF NOT EXISTS stock_releases (
  id SERIAL PRIMARY KEY,
  release_number VARCHAR(50) NOT NULL UNIQUE, -- REL-2026-00001
  
  -- Product Reference
  product_type VARCHAR(20) NOT NULL, -- 'spare_part' or 'accessory'
  product_id INTEGER NOT NULL,
  product_sku VARCHAR(50) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  
  -- Release Details
  quantity_released INTEGER NOT NULL,
  release_type VARCHAR(30) NOT NULL, -- 'sale', 'damage', 'return_to_supplier', 'transfer', 'sample', 'internal_use'
  release_reason TEXT,
  
  -- Destination/Recipient
  released_to VARCHAR(200), -- Customer name, department, or location
  destination TEXT, -- Physical location or purpose
  
  -- Cost Impact
  unit_cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2), -- quantity * unit_cost
  
  -- Approval & Processing
  requested_by UUID REFERENCES adminauth(id),
  approved_by UUID REFERENCES adminauth(id),
  processed_by UUID REFERENCES adminauth(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, released, cancelled
  
  -- Timestamps
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional Info
  notes TEXT,
  reference_number VARCHAR(100), -- Related order/transaction number
  
  -- Constraints
  CONSTRAINT positive_quantity_release CHECK (quantity_released > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stock_releases_product ON stock_releases(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_releases_status ON stock_releases(status);
CREATE INDEX IF NOT EXISTS idx_stock_releases_type ON stock_releases(release_type);
CREATE INDEX IF NOT EXISTS idx_stock_releases_date ON stock_releases(released_at DESC);

-- Auto-generate release number
CREATE OR REPLACE FUNCTION generate_release_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.release_number IS NULL THEN
    NEW.release_number := 'REL-' || 
                          TO_CHAR(NOW(), 'YYYY') || '-' || 
                          LPAD(NEXTVAL('stock_releases_id_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_release_number
BEFORE INSERT ON stock_releases
FOR EACH ROW
EXECUTE FUNCTION generate_release_number();
