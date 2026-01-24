# 🔧 Supabase Migration - Copy & Paste Ready

## ⚡ Quick Copy-Paste Instructions

### Step 1: Open Supabase
1. Go to: https://app.supabase.com/
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query** button

### Step 2: Copy This Code

Copy **EVERYTHING** below the "---" line and paste it into Supabase:

---

```sql
-- Add missing columns to orders table for new checkout functionality
-- These columns support the pickup vs delivery fulfillment methods
-- Date: November 14, 2025
-- Purpose: Enable new checkout order system

-- Add fulfillment_method column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS fulfillment_method VARCHAR(20) DEFAULT 'pickup';

-- Add delivery_barangay column for complete delivery address
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_barangay VARCHAR(100);

-- Update existing rows to have fulfillment_method if null (default to pickup)
UPDATE orders SET fulfillment_method = 'pickup' WHERE fulfillment_method IS NULL;

-- Add constraint to ensure valid fulfillment methods
ALTER TABLE orders 
ADD CONSTRAINT valid_fulfillment_method CHECK (fulfillment_method IN ('pickup', 'delivery'));

-- Create index on fulfillment_method for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_method ON orders(fulfillment_method);
```

---

### Step 3: Run the Query
1. Click **Run** button (or press Ctrl+Enter)
2. Wait for success message: ✅ **Query executed successfully**
3. You should see: "Queries completed. 1 total"

### Step 4: Verify It Worked

Copy-paste this verification query:

```sql
-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders' AND (
  column_name = 'fulfillment_method' OR 
  column_name = 'delivery_barangay'
)
ORDER BY column_name;
```

**Expected Result**:
```
delivery_barangay | character varying | YES | NULL
fulfillment_method | character varying | NO | 'pickup'::character varying
```

## ✅ Success Checklist

- [ ] Logged into Supabase
- [ ] In SQL Editor
- [ ] Created new query
- [ ] Pasted the migration code
- [ ] Clicked Run
- [ ] Saw success message
- [ ] Ran verification query
- [ ] Saw 2 rows in result

## 🚀 Next Steps

1. **Restart backend**:
   ```powershell
   cd backend
   npm start
   ```

2. **Test checkout**:
   - Go to http://localhost:5173/products
   - Add item to cart
   - Go to checkout
   - Place order
   - Should succeed ✅

3. **Check browser console** (F12 → Console):
   - Should see: `[Checkout] ✅ Order created successfully`
   - No red errors

## 🐛 Troubleshooting

### Error: "Relation 'orders' does not exist"
**Solution**: Need to run the full schema first
```sql
-- Run INVENTORY_SCHEMA.sql from backend/supabase/ folder
-- Then run this migration again
```

### Error: "Column 'fulfillment_method' already exists"
**No problem!** This is fine - columns already added
- Just run verification query to confirm
- Proceed to restart backend

### Error: "Cannot connect to database"
**Check**:
- Supabase project is running
- You're logged in
- Network connection is good

### Query runs but no success message
- Check for errors in query output
- Scroll down in results panel
- May still have worked - run verification query

## ✨ What This Does

| Column | Type | Purpose |
|--------|------|---------|
| `fulfillment_method` | VARCHAR(20) | Whether order is 'pickup' or 'delivery' |
| `delivery_barangay` | VARCHAR(100) | Barangay name for delivery address |

These columns are **required** for the new checkout system to work.

## 📞 If It Fails

1. Copy the error message
2. Check if it says "already exists" (that's OK)
3. Run the verification query anyway
4. If verification shows the columns, you're good!
5. Proceed to restart backend

---

**Status**: Ready to Apply  
**Time Required**: 1-2 minutes  
**Risk Level**: Low (uses IF NOT EXISTS)  

