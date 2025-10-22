-- =====================================================
-- MIGRATION: Update product_compatibility table
-- Add proper foreign key references to spare_parts and accessories
-- =====================================================

-- Step 1: Add new columns for foreign keys
ALTER TABLE product_compatibility 
ADD COLUMN IF NOT EXISTS sparepart_id INTEGER REFERENCES spare_parts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS accessory_id INTEGER REFERENCES accessories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_exact_fit BOOLEAN DEFAULT TRUE;

-- Step 2: Migrate existing data (if may laman na)
-- Convert product_type + product_id to proper foreign keys
UPDATE product_compatibility
SET sparepart_id = product_id
WHERE product_type = 'sparepart' AND sparepart_id IS NULL;

UPDATE product_compatibility
SET accessory_id = product_id
WHERE product_type = 'accessory' AND accessory_id IS NULL;

-- Step 3: Add constraint to ensure only one product type is set
ALTER TABLE product_compatibility
ADD CONSTRAINT check_product_reference CHECK (
  (sparepart_id IS NOT NULL AND accessory_id IS NULL) OR
  (sparepart_id IS NULL AND accessory_id IS NOT NULL)
);

-- Step 4: Drop old columns (optional - comment out if you want to keep for now)
-- ALTER TABLE product_compatibility 
-- DROP COLUMN IF EXISTS product_type,
-- DROP COLUMN IF EXISTS product_id;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to check the updated table structure:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'product_compatibility' 
-- ORDER BY ordinal_position;

-- =====================================================
-- COMPLETED! ✅
-- =====================================================
