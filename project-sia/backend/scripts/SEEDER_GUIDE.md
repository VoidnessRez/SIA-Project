# 🌱 New Features Seeder Guide

This script dynamically populates your database with sample data for the new features, **using your actual existing products** instead of static data.

## 📋 Prerequisites

Before running the seeder, make sure you've run these SQL files in Supabase:

1. ✅ `ADD_MAX_STOCK_LEVEL.sql` - Adds max_stock_level columns
2. ✅ `PRICE_HISTORY_SCHEMA.sql` - Creates price_history table
3. ✅ `STOCK_RELEASE_SCHEMA.sql` - Creates stock_releases table

## 🚀 How to Run

### Option 1: Simple Command
```bash
cd backend
npm run seed:features
```

### Option 2: Direct Node
```bash
cd backend
node scripts/seed_new_features.js
```

### Wholesale Seed (after migration #005)
```bash
cd backend
npm run seed:wholesale
```

Dry run validation (no writes):
```bash
cd backend
$env:DRY_RUN="1"; npm run seed:wholesale
```

## 🎯 What Gets Created

The script will **dynamically fetch your existing products** and generate:

### 1. **Price History Module** 💰
- 15-20 price change records
- Mix of increases (60%) and decreases (40%)
- Realistic reasons (supplier costs, promotions, etc.)
- Date range: Last 60 days
- Uses actual product names, SKUs, and prices

### 2. **Overstock Alerts** 🔴
- Sets realistic `max_stock_level` for all products
- Creates 3-5 intentionally overstocked items for testing
- Based on current inventory levels
- Adjusts spare parts and accessories separately

### 3. **Stock Release Feature** 📤
- 8-13 stock release records
- Various types: damage, samples, returns, internal use
- Mixed statuses: pending, approved, released
- Auto-generated release numbers (REL-2026-XXXXX)
- Uses real product data

### 4. **Inventory Transactions** 📊
- 30-40 transaction records
- Incoming: Purchase orders (PO-XXXX)
- Outgoing: Sales orders (ORD-XXXX), adjustments
- Realistic quantities and costs
- Date range: Last 30 days

## 📊 Sample Output

```
🌱 Starting to seed new features with dynamic data...

📦 Fetching existing spare parts...
   ✅ Found 25 spare parts
📦 Fetching existing accessories...
   ✅ Found 18 accessories

🔧 Setting up max stock levels...
   ✅ Updated 25 spare parts with max stock levels
   ✅ Updated 18 accessories with max stock levels
   ✅ Created 3 overstocked spare parts for testing

💰 Generating price history entries...
   ✅ Generated 22 price history entries

📤 Generating stock releases...
   ✅ Generated 13 stock releases

📊 Generating inventory transactions...
   ✅ Generated 37 inventory transactions

📊 VERIFICATION SUMMARY:

═══════════════════════════════════════════
🔴 Overstocked Items: 3
   • Premium Brake Pads Set: 145/100 units (45 excess)
   • Engine Air Filter: 158/120 units (38 excess)
   • Spark Plug Set: 127/90 units (37 excess)

💰 Price History Records: 22

📤 Stock Releases: 13
   • pending: 4
   • approved: 5
   • released: 4

📊 Inventory Transactions: 37
   • incoming: 22 transactions (827 total units)
   • outgoing: 15 transactions (185 total units)

═══════════════════════════════════════════
✅ Seeding completed successfully!
```

## ✨ Features

### Dynamic Data Generation
- **Not static!** Uses actual products from your database
- Adapts to however many products you have
- Realistic prices based on actual costs
- Smart quantity calculations

### Smart Algorithms
- Price changes: 5-20% increases/decreases
- Overstock: Intentionally creates 3-5 items above max level
- Stock releases: Random types and statuses for variety
- Transactions: Mix of incoming (purchases) and outgoing (sales)

### Safe & Repeatable
- Can be run multiple times (will add more data)
- Won't break if tables already have data
- Uses transactions for data integrity
- Clear error messages

## 🔍 Testing the Results

After running the seeder:

1. **Overstock Alerts** → http://localhost:5173/admin/overstock
   - Should see 3-5 overstocked items
   - Click any item to edit max stock level

2. **Price History** → http://localhost:5173/admin/priceHistory
   - Should see 15-22 price changes
   - Filter by product type, change type
   - View statistics cards

3. **Wholesale Discounts** → Add 15+ items to cart
   - Bronze: 10-19 items = 5% off
   - Silver: 20-29 items = 10% off
   - Gold: 30-49 items = 15% off
   - Platinum: 50+ items = 20% off

4. **Stock Releases** → API endpoints ready
   - GET `/api/stock-release` - List all
   - GET `/api/stock-release/stats` - Statistics
   - POST `/api/stock-release/create` - Create new

5. **Inventory Transactions** → API endpoints ready
   - GET `/api/inventory/transactions` - View all
   - POST `/api/inventory/transactions` - Create new

## 🛠️ Troubleshooting

### "No products found!"
```bash
# Run the main seeder first to create products
npm run seed
# Then run feature seeder
npm run seed:features
```

### "Table does not exist"
Make sure you've run all SQL schema files in Supabase SQL Editor:
- ADD_MAX_STOCK_LEVEL.sql
- PRICE_HISTORY_SCHEMA.sql
- STOCK_RELEASE_SCHEMA.sql

For wholesale module seed, run:
- backend/migrations/005_create_wholesale_tables.sql

### "Connection error"
Check your `.env` file has correct Supabase credentials:
```env
SUPABASE_URL=your_url_here
SUPABASE_SERVICE_KEY=your_service_key_here
```

## 📝 Notes

- This script uses **Supabase Service Key** (not anon key)
- Safe to run multiple times (adds more data each time)
- All data is marked as "sample data for testing"
- Date ranges are randomized for realistic distribution

## 🎉 Next Steps

After successful seeding:

1. Restart backend: `npm start`
2. Visit admin panel and test all new features
3. Check that data displays correctly
4. Try editing max stock levels
5. Test wholesale discounts in checkout

## ✅ Core E2E Test Command

After backend is running, execute:

```bash
cd backend
npm run test:e2e:core
```

This scripted check validates key order/payment policy flows (COD vs GCash create rules, proof upload rules, paid verification requirements, non-refundable policy enforcement, and cancellation policy behavior).

---

**Created by:** Your friendly neighborhood AI 🤖
**Last Updated:** March 2026
