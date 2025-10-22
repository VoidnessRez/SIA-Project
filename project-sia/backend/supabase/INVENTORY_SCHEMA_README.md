# Meja Spareparts - Inventory System Database Schema

## 📋 Overview
Complete database schema for motorcycle parts inventory management system with separate tracking for spare parts and accessories, multi-brand support, and sales tracking.

---

## 🗂️ Database Tables

### 1. **motorcycle_brands** 🏍️
Stores all motorcycle manufacturers (Honda, Yamaha, Suzuki, Kawasaki, etc.)
- Used to determine product compatibility
- Links to spare parts and accessories

**Key Fields:**
- `name`, `code`, `country`, `logo_emoji`
- `is_active` - can enable/disable brands

---

### 2. **sparepart_brands** ⚙️
Brands that manufacture spare parts (NGK, Brembo, DID, etc.)
- Separate from motorcycle brands
- Tracks OEM vs aftermarket brands

**Key Fields:**
- `name`, `code`, `specialty`
- `is_oem` - identifies original equipment manufacturers

---

### 3. **accessory_brands** 🛡️
Brands that manufacture accessories (Shoei, Alpinestars, etc.)
- Helmets, gloves, lights, luggage, etc.
- Separate tracking from parts brands

**Key Fields:**
- `name`, `code`, `country`, `specialty`

---

### 4. **part_types** 🔧
Categories for both spare parts and accessories
- Brake System, Engine, Electrical, Safety Gear, etc.
- Used for filtering and organization

**Key Fields:**
- `name`, `code`, `category` (sparepart/accessory)
- `icon_emoji` - for UI display

---

### 5. **spare_parts** 🛠️
Main inventory table for spare parts

**Key Features:**
- SKU tracking (unique identifier)
- Brand and type classification
- **Universal compatibility flag** - parts that fit multiple brands
- Pricing: cost price, selling price, auto-calculated markup %
- Stock management: quantity, reorder level, reorder quantity
- Product details: weight, dimensions, warranty
- Sales tracking: rating, total sales
- Admin tracking: who created/updated

**Key Fields:**
```sql
sku, name, description
sparepart_brand_id, part_type_id
is_universal, compatible_bike_models (JSON)
cost_price, selling_price, markup_percentage
stock_quantity, reorder_level, reorder_quantity
rating, total_sales
```

---

### 6. **accessories** 🛡️
Main inventory table for accessories

**Key Features:**
- Similar to spare_parts but with accessory-specific fields
- **Size and color variants** (helmets, gloves, etc.)
- Safety certifications (DOT, ECE, SNELL)
- Most are universal by default

**Key Fields:**
```sql
sku, name, description
accessory_brand_id, part_type_id
is_universal, compatible_bike_models (JSON)
available_sizes (JSON), available_colors (JSON)
certifications (JSON) - for safety gear
cost_price, selling_price, markup_percentage
stock_quantity, reorder_level, reorder_quantity
```

---

### 7. **product_compatibility** 🔗
Links products to specific motorcycle models

**Use Case:**
- Track which spare parts fit which motorcycle models
- Supports year ranges (e.g., 2015-2020)
- Works for both spare parts and accessories

**Key Fields:**
```sql
product_type ('sparepart' or 'accessory')
product_id
motorcycle_brand_id
model_name, year_from, year_to
```

---

### 8. **sales** 💰
Tracks all sales transactions

**Key Features:**
- Unique sale number (SALE-2025-00001)
- Customer information (optional)
- Subtotal, discount, tax, total
- Payment method and status
- Links to admin who processed sale

**Key Fields:**
```sql
sale_number, customer_name, customer_phone
subtotal, discount_amount, tax_amount, total_amount
payment_method, payment_status
status (completed, cancelled, returned)
processed_by (admin user)
```

---

### 9. **sales_items** 📦
Individual items in each sale

**Key Features:**
- Links to sales table
- Tracks product type (sparepart/accessory)
- Stores quantity, price, discount per item
- Snapshot of product info at time of sale

**Key Fields:**
```sql
sale_id
product_type, product_id, product_sku, product_name
quantity, unit_price, subtotal, discount, total
```

---

### 10. **inventory_transactions** 📊
Complete audit trail of all inventory changes

**Transaction Types:**
- `purchase` - stock coming in
- `sale` - stock going out
- `adjustment` - manual corrections
- `return` - customer returns

**Key Fields:**
```sql
transaction_type, product_type, product_id
quantity_change, previous_quantity, new_quantity
unit_cost, total_cost
reference_type, reference_id
performed_by (admin user)
```

---

## 📈 Database Views

### **low_stock_items** ⚠️
Automatically shows all products below reorder level
- Combines spare parts and accessories
- Filtered to active products only
- Shows current stock vs reorder level

### **sales_summary** 📊
Quick overview of sales with item counts
- Shows total items per sale
- Links to admin who processed
- Filtered by status

---

## 🔧 Automatic Features

### **Auto-Triggers:**
1. **Update Timestamps** - `updated_at` auto-updates on changes
2. **Calculate Markup** - Auto-calculates markup percentage from cost/selling price

### **Indexes:**
Optimized queries for:
- SKU lookups
- Brand filtering
- Stock level checks
- Sales date ranges

---

## 🔐 Security (RLS Policies)
- Row Level Security enabled on all tables
- Currently set to development mode (all access)
- Update policies when deploying to production

---

## 📦 Seed Data Included

### Pre-loaded Data:
✅ 5 Motorcycle brands (Honda, Yamaha, Suzuki, Kawasaki, Universal)
✅ 12 Part types (Brake System, Engine, Electrical, etc.)
✅ 10 Spare part brands (NGK, Brembo, DID, K&N, etc.)
✅ 7 Accessory brands (Shoei, Alpinestars, Progrip, etc.)

---

## 🚀 Usage in Inventory System

### **Universal Parts Feature:**
Products marked as `is_universal = TRUE` can be sold for any motorcycle brand. Perfect for:
- Generic brake pads
- Universal oil filters
- Standard spark plugs
- Helmets and gloves
- LED lights

### **Brand-Specific Parts:**
Set `is_universal = FALSE` and use `product_compatibility` table to link to specific models.

### **Stock Alerts:**
Query `low_stock_items` view to see what needs reordering.

### **Sales Tracking:**
1. Create entry in `sales` table
2. Add items to `sales_items`
3. Automatically creates `inventory_transactions` records
4. Stock quantity updates automatically

---

## 📝 Next Steps

1. **Run this SQL in Supabase SQL Editor**
2. **Verify all tables created successfully**
3. **Check seed data is populated**
4. **Build frontend inventory management UI**
5. **Implement barcode scanning (optional)**
6. **Add purchase order system (optional)**

---

## 🎯 Key Benefits

✅ Separate spare parts and accessories tracking
✅ Multi-brand support (motorcycle brands, part brands, accessory brands)
✅ Universal parts compatibility
✅ Complete sales tracking with audit trail
✅ Automatic stock alerts
✅ Cost and profit tracking
✅ Admin user tracking for accountability

---

**Created for:** Meja Spareparts - Motorcycle Parts & Accessories Shop  
**Date:** October 2025  
**Status:** Ready for Implementation 🎉
