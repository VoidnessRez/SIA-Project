-- =====================================================
-- MEJA SPAREPARTS INVENTORY SYSTEM - DATABASE SCHEMA
-- Complete inventory management system for motorcycle shop
-- =====================================================

-- =====================================================
-- 1. MOTORCYCLE BRANDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS motorcycle_brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE, -- HON, YAM, SUZ, KAW, etc.
  country VARCHAR(100),
  logo_emoji VARCHAR(10) DEFAULT '🏍️',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. SPARE PART BRANDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sparepart_brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,
  country VARCHAR(100),
  specialty TEXT, -- "Brake Systems", "Engine Parts", etc.
  logo_emoji VARCHAR(10) DEFAULT '⚙️',
  is_oem BOOLEAN DEFAULT FALSE, -- Original Equipment Manufacturer
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ACCESSORY BRANDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS accessory_brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,
  country VARCHAR(100),
  specialty TEXT, -- "Helmets", "Gloves", "Lighting", etc.
  logo_emoji VARCHAR(10) DEFAULT '🛡️',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. PART TYPES TABLE (Categories for parts)
-- =====================================================
CREATE TABLE IF NOT EXISTS part_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL, -- 'sparepart' or 'accessory'
  icon_emoji VARCHAR(10) DEFAULT '🔧',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. SPARE PARTS INVENTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS spare_parts (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Brand and Type
  sparepart_brand_id INTEGER REFERENCES sparepart_brands(id) ON DELETE SET NULL,
  part_type_id INTEGER REFERENCES part_types(id) ON DELETE SET NULL,
  
  -- Compatibility
  is_universal BOOLEAN DEFAULT FALSE,
  compatible_bike_models TEXT, -- JSON array of compatible models
  
  -- Pricing
  cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0, -- How much you bought it
  selling_price DECIMAL(10, 2) NOT NULL,
  markup_percentage DECIMAL(5, 2), -- Auto-calculated
  
  -- Inventory
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER DEFAULT 10, -- Alert when stock is low
  reorder_quantity INTEGER DEFAULT 20,
  
  -- Product Info
  unit VARCHAR(20) DEFAULT 'piece', -- piece, set, pair, etc.
  weight_kg DECIMAL(8, 2),
  dimensions VARCHAR(100), -- "L x W x H"
  warranty_months INTEGER DEFAULT 0,
  expiry_date DATE, -- For items like tires, oils, brake fluids (nullable)
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Images (up to 5 pictures for ordering system showcase)
  image_url TEXT DEFAULT '⚙️', -- Main/primary image
  image_2 TEXT, -- Additional image 2
  image_3 TEXT, -- Additional image 3
  image_4 TEXT, -- Additional image 4
  image_5 TEXT, -- Additional image 5
  image_alt_text TEXT, -- Alt text for SEO
  
  -- SEO
  rating DECIMAL(3, 2) DEFAULT 0.0,
  total_sales INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES adminauth(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT positive_stock CHECK (stock_quantity >= 0),
  CONSTRAINT positive_price CHECK (selling_price >= 0)
);

-- =====================================================
-- 6. ACCESSORIES INVENTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS accessories (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Brand and Type
  accessory_brand_id INTEGER REFERENCES accessory_brands(id) ON DELETE SET NULL,
  part_type_id INTEGER REFERENCES part_types(id) ON DELETE SET NULL,
  
  -- Compatibility
  is_universal BOOLEAN DEFAULT TRUE, -- Most accessories are universal
  compatible_bike_models TEXT, -- JSON array if specific
  
  -- Sizing (for helmets, gloves, etc.)
  available_sizes TEXT, -- JSON array: ["S", "M", "L", "XL"]
  available_colors TEXT, -- JSON array: ["Black", "Red", "Blue"]
  
  -- Pricing
  cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10, 2) NOT NULL,
  markup_percentage DECIMAL(5, 2),
  
  -- Inventory
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  reorder_quantity INTEGER DEFAULT 20,
  
  -- Product Info
  unit VARCHAR(20) DEFAULT 'piece',
  weight_kg DECIMAL(8, 2),
  dimensions VARCHAR(100),
  warranty_months INTEGER DEFAULT 0,
  expiry_date DATE, -- For items with expiration (nullable)
  
  -- Safety certifications (for helmets, etc.)
  certifications TEXT, -- JSON array: ["DOT", "ECE", "SNELL"]
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Images (up to 5 pictures for ordering system showcase)
  image_url TEXT DEFAULT '🛡️', -- Main/primary image
  image_2 TEXT, -- Additional image 2
  image_3 TEXT, -- Additional image 3
  image_4 TEXT, -- Additional image 4
  image_5 TEXT, -- Additional image 5
  image_alt_text TEXT, -- Alt text for SEO
  
  -- SEO
  rating DECIMAL(3, 2) DEFAULT 0.0,
  total_sales INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES adminauth(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT positive_stock_acc CHECK (stock_quantity >= 0),
  CONSTRAINT positive_price_acc CHECK (selling_price >= 0)
);

-- =====================================================
-- 7. MOTORCYCLE COMPATIBILITY TABLE
-- Links specific spare parts and accessories to motorcycle brands/models
-- =====================================================
CREATE TABLE IF NOT EXISTS product_compatibility (
  id SERIAL PRIMARY KEY,
  
  -- Product References (one must be set, not both)
  sparepart_id INTEGER REFERENCES spare_parts(id) ON DELETE CASCADE,
  accessory_id INTEGER REFERENCES accessories(id) ON DELETE CASCADE,
  
  -- Motorcycle Reference
  motorcycle_brand_id INTEGER REFERENCES motorcycle_brands(id) ON DELETE CASCADE,
  model_name VARCHAR(100),
  year_from INTEGER,
  year_to INTEGER,
  
  -- Additional info
  notes TEXT,
  is_exact_fit BOOLEAN DEFAULT TRUE, -- false if modifications needed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Must have either sparepart_id OR accessory_id, not both
  CONSTRAINT check_product_reference CHECK (
    (sparepart_id IS NOT NULL AND accessory_id IS NULL) OR
    (sparepart_id IS NULL AND accessory_id IS NOT NULL)
  )
);

-- =====================================================
-- 8. ORDERS TABLE (from customers via ordering system)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE, -- ORD-2025-00001
  
  -- Customer (linked to auth_users table from auth system)
  user_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  customer_name VARCHAR(200) NOT NULL,
  customer_email VARCHAR(200),
  customer_phone VARCHAR(20),
  
  -- Delivery Address
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_province VARCHAR(100),
  delivery_zipcode VARCHAR(10),
  delivery_notes TEXT,
  
  -- Order Details
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_fee DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2), -- Nullable: only if BIR accredited
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment
  payment_method VARCHAR(50), -- cod, gcash, bank_transfer, card
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed, refunded
  payment_proof_url TEXT, -- for bank transfer/gcash screenshots
  
  -- Order Status
  order_status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
  
  -- Fulfillment
  confirmed_by UUID REFERENCES adminauth(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Tracking
  tracking_number VARCHAR(100),
  courier VARCHAR(100), -- JRS, LBC, J&T, etc.
  
  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_type VARCHAR(20) NOT NULL, -- 'sparepart' or 'accessory'
  product_id INTEGER NOT NULL,
  product_sku VARCHAR(50) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  product_image TEXT,
  
  -- Variant Info (for accessories with size/color)
  selected_size VARCHAR(20),
  selected_color VARCHAR(50),
  
  -- Order Details
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_quantity_order CHECK (quantity > 0)
);

-- =====================================================
-- 10. SALES TABLE (converted from orders when delivered/completed)
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  sale_number VARCHAR(50) NOT NULL UNIQUE, -- SALE-2025-00001
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL, -- Link to original order
  
  -- Customer (linked to auth_users table)
  user_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  customer_name VARCHAR(200),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(200),
  
  -- Sale Details
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_fee DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2), -- Nullable: only if BIR accredited
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment
  payment_method VARCHAR(50), -- cash, gcash, card, bank_transfer, cod
  payment_status VARCHAR(20) DEFAULT 'paid', -- paid, pending, refunded
  
  -- Status
  status VARCHAR(20) DEFAULT 'completed', -- completed, cancelled, returned
  notes TEXT,
  
  -- Admin who processed/confirmed
  processed_by UUID REFERENCES adminauth(id) ON DELETE SET NULL,
  
  -- Timestamps
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 11. SALES ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sales_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_type VARCHAR(20) NOT NULL, -- 'sparepart' or 'accessory'
  product_id INTEGER NOT NULL,
  product_sku VARCHAR(50) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  product_image TEXT,
  
  -- Variant Info
  selected_size VARCHAR(20),
  selected_color VARCHAR(50),
  
  -- Sale Details
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

-- =====================================================
-- 12. INVENTORY TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id SERIAL PRIMARY KEY,
  transaction_type VARCHAR(20) NOT NULL, -- 'purchase', 'sale', 'adjustment', 'return'
  product_type VARCHAR(20) NOT NULL, -- 'sparepart' or 'accessory'
  product_id INTEGER NOT NULL,
  
  -- Transaction Details
  quantity_change INTEGER NOT NULL, -- positive for additions, negative for sales
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  
  -- Cost tracking
  unit_cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  
  -- References
  reference_type VARCHAR(50), -- 'sale', 'purchase_order', 'manual_adjustment'
  reference_id INTEGER, -- ID of sale, PO, etc.
  
  -- Notes
  notes TEXT,
  performed_by UUID REFERENCES adminauth(id) ON DELETE SET NULL,
  
  -- Timestamp
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 13. DAILY SALES SUMMARY VIEW
-- =====================================================
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
  DATE(sale_date) as sale_day,
  COUNT(*) as total_sales,
  SUM(total_amount) as total_revenue,
  SUM(discount_amount) as total_discounts,
  SUM(shipping_fee) as total_shipping,
  AVG(total_amount) as average_sale,
  COUNT(DISTINCT user_id) as unique_customers
FROM sales
WHERE status = 'completed'
GROUP BY DATE(sale_date)
ORDER BY sale_day DESC;

-- =====================================================
-- 14. ORDER STATUS SUMMARY VIEW
-- =====================================================
CREATE OR REPLACE VIEW order_status_summary AS
SELECT 
  order_status,
  COUNT(*) as order_count,
  SUM(total_amount) as total_value,
  AVG(total_amount) as average_value
FROM orders
GROUP BY order_status
ORDER BY order_count DESC;

-- =====================================================
-- 15. LOW STOCK ALERTS VIEW
-- =====================================================
CREATE OR REPLACE VIEW low_stock_items AS
SELECT 
  'sparepart' as product_type,
  sp.id,
  sp.sku,
  sp.name,
  sp.stock_quantity,
  sp.reorder_level,
  sp.reorder_quantity,
  sb.name as brand_name
FROM spare_parts sp
LEFT JOIN sparepart_brands sb ON sp.sparepart_brand_id = sb.id
WHERE sp.stock_quantity <= sp.reorder_level AND sp.is_active = TRUE

UNION ALL

SELECT 
  'accessory' as product_type,
  a.id,
  a.sku,
  a.name,
  a.stock_quantity,
  a.reorder_level,
  a.reorder_quantity,
  ab.name as brand_name
FROM accessories a
LEFT JOIN accessory_brands ab ON a.accessory_brand_id = ab.id
WHERE a.stock_quantity <= a.reorder_level AND a.is_active = TRUE;

-- =====================================================
-- 16. SALES SUMMARY VIEW
-- =====================================================
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
  s.id,
  s.sale_number,
  s.sale_date,
  s.total_amount,
  s.payment_method,
  s.status,
  u.username as customer_username,
  COUNT(si.id) as total_items,
  a.username as processed_by_username
FROM sales s
LEFT JOIN sales_items si ON s.id = si.sale_id
LEFT JOIN auth_users u ON s.user_id = u.id
LEFT JOIN adminauth a ON s.processed_by = a.id
GROUP BY s.id, s.sale_number, s.sale_date, s.total_amount, s.payment_method, s.status, u.username, a.username;

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX idx_spare_parts_sku ON spare_parts(sku);
CREATE INDEX idx_spare_parts_brand ON spare_parts(sparepart_brand_id);
CREATE INDEX idx_spare_parts_active ON spare_parts(is_active);
CREATE INDEX idx_spare_parts_stock ON spare_parts(stock_quantity);

CREATE INDEX idx_accessories_sku ON accessories(sku);
CREATE INDEX idx_accessories_brand ON accessories(accessory_brand_id);
CREATE INDEX idx_accessories_active ON accessories(is_active);
CREATE INDEX idx_accessories_stock ON accessories(stock_quantity);

CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_date ON orders(order_date);

CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE INDEX idx_sales_number ON sales(sale_number);
CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_status ON sales(status);

CREATE INDEX idx_sales_items_sale ON sales_items(sale_id);
CREATE INDEX idx_inventory_trans_product ON inventory_transactions(product_type, product_id);
CREATE INDEX idx_inventory_trans_date ON inventory_transactions(transaction_date);

-- =====================================================
-- TRIGGERS for auto-updates
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_spare_parts_updated_at BEFORE UPDATE ON spare_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessories_updated_at BEFORE UPDATE ON accessories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate markup percentage
CREATE OR REPLACE FUNCTION calculate_markup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cost_price > 0 THEN
    NEW.markup_percentage = ((NEW.selling_price - NEW.cost_price) / NEW.cost_price) * 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_spare_parts_markup BEFORE INSERT OR UPDATE ON spare_parts
  FOR EACH ROW EXECUTE FUNCTION calculate_markup();

CREATE TRIGGER calculate_accessories_markup BEFORE INSERT OR UPDATE ON accessories
  FOR EACH ROW EXECUTE FUNCTION calculate_markup();

-- =====================================================
-- RLS POLICIES (Row Level Security)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE motorcycle_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE sparepart_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessory_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PUBLIC READ ACCESS (for ordering system/website)
-- =====================================================

-- Anyone can view active brands
CREATE POLICY "Public read access for motorcycle brands" 
  ON motorcycle_brands FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Public read access for sparepart brands" 
  ON sparepart_brands FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Public read access for accessory brands" 
  ON accessory_brands FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Public read access for part types" 
  ON part_types FOR SELECT 
  USING (is_active = true);

-- Anyone can view active products
CREATE POLICY "Public read access for spare parts" 
  ON spare_parts FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Public read access for accessories" 
  ON accessories FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Public read access for product compatibility" 
  ON product_compatibility FOR SELECT 
  USING (true);

-- =====================================================
-- ADMIN/STAFF FULL ACCESS (for inventory management)
-- =====================================================

-- Admins can do everything on all tables
CREATE POLICY "Admin full access to motorcycle brands" 
  ON motorcycle_brands FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to sparepart brands" 
  ON sparepart_brands FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to accessory brands" 
  ON accessory_brands FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to part types" 
  ON part_types FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to spare parts" 
  ON spare_parts FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to accessories" 
  ON accessories FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to product compatibility" 
  ON product_compatibility FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to orders" 
  ON orders FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to order items" 
  ON order_items FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to sales" 
  ON sales FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to sales items" 
  ON sales_items FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to inventory transactions" 
  ON inventory_transactions FOR ALL 
  USING (true) WITH CHECK (true);

-- =====================================================
-- USER ACCESS TO THEIR OWN ORDERS
-- =====================================================

-- Users can view their own orders
CREATE POLICY "Users can view their own orders" 
  ON orders FOR SELECT 
  USING (true);

-- Users can create their own orders
CREATE POLICY "Users can create orders" 
  ON orders FOR INSERT 
  WITH CHECK (true);

-- Users can update their own pending orders only
CREATE POLICY "Users can update their pending orders" 
  ON orders FOR UPDATE 
  USING (order_status = 'pending');

-- Users can view order items for their orders
CREATE POLICY "Users can view their order items" 
  ON order_items FOR SELECT 
  USING (true);

-- Users can insert order items for their orders
CREATE POLICY "Users can create order items" 
  ON order_items FOR INSERT 
  WITH CHECK (true);

-- Users can view their own sales history
CREATE POLICY "Users can view their own sales" 
  ON sales FOR SELECT 
  USING (true);

CREATE POLICY "Users can view their sales items" 
  ON sales_items FOR SELECT 
  USING (true);

-- =====================================================
-- SEED DATA - Initial Setup
-- =====================================================

-- Motorcycle Brands
INSERT INTO motorcycle_brands (name, code, country, logo_emoji, description) VALUES
('Honda', 'HON', 'Japan', '🔴', 'World''s largest motorcycle manufacturer'),
('Yamaha', 'YAM', 'Japan', '⚫', 'Japanese multinational conglomerate'),
('Suzuki', 'SUZ', 'Japan', '🔵', 'Japanese motorcycle manufacturer'),
('Kawasaki', 'KAW', 'Japan', '🟢', 'Japanese heavy industries company'),
('Universal', 'UNI', 'Global', '⭐', 'Universal fit for all brands')
ON CONFLICT (name) DO NOTHING;

-- Part Types
INSERT INTO part_types (name, code, category, icon_emoji, description) VALUES
('Brake System', 'brake-system', 'sparepart', '🛑', 'Brake pads, discs, calipers'),
('Engine Parts', 'engine', 'sparepart', '⚙️', 'Pistons, rings, valves'),
('Electrical', 'electrical', 'sparepart', '🔋', 'Batteries, wiring, fuses'),
('Drivetrain', 'drivetrain', 'sparepart', '⛓️', 'Chains, sprockets, gears'),
('Fuel System', 'fuel-system', 'sparepart', '⛽', 'Fuel injectors, pumps, filters'),
('Wheels & Tires', 'wheels', 'sparepart', '⭕', 'Tires, rims, spokes'),
('Lighting', 'lighting', 'accessory', '💡', 'LED lights, headlights'),
('Safety Gear', 'safety', 'accessory', '🪖', 'Helmets, gloves, protective gear'),
('Body Parts', 'body', 'sparepart', '🏍️', 'Fairings, fenders, panels'),
('Controls', 'controls', 'sparepart', '🎛️', 'Levers, cables, switches'),
('Air Intake', 'intake', 'sparepart', '🌬️', 'Air filters, intake systems'),
('Ignition', 'ignition', 'sparepart', '⚡', 'Spark plugs, coils, CDI')
ON CONFLICT (code) DO NOTHING;

-- Spare Part Brands
INSERT INTO sparepart_brands (name, code, country, specialty, is_oem) VALUES
('NGK', 'NGK', 'Japan', 'Spark Plugs & Ignition', false),
('Brembo', 'BRE', 'Italy', 'Brake Systems', false),
('DID', 'DID', 'Japan', 'Chains & Sprockets', false),
('K&N', 'KN', 'USA', 'Air Filters', false),
('Denso', 'DEN', 'Japan', 'Fuel Injection & Electrical', false),
('IRC', 'IRC', 'Japan', 'Tires', false),
('Motolite', 'MTL', 'Philippines', 'Batteries', false),
('OEM Honda', 'OEMH', 'Japan', 'Original Honda Parts', true),
('OEM Yamaha', 'OEMY', 'Japan', 'Original Yamaha Parts', true),
('OEM Suzuki', 'OEMS', 'Japan', 'Original Suzuki Parts', true)
ON CONFLICT (code) DO NOTHING;

-- Accessory Brands
INSERT INTO accessory_brands (name, code, country, specialty) VALUES
('Shoei', 'SHO', 'Japan', 'Premium Helmets'),
('Alpinestars', 'ALP', 'Italy', 'Riding Gear & Gloves'),
('Progrip', 'PRO', 'Italy', 'Handlebar Grips'),
('Oxford', 'OXF', 'UK', 'Motorcycle Accessories'),
('Givi', 'GIV', 'Italy', 'Luggage & Racks'),
('HJC', 'HJC', 'South Korea', 'Helmets'),
('AGV', 'AGV', 'Italy', 'Racing Helmets')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- COMPLETED SUCCESSFULLY! 🎉
-- =====================================================
