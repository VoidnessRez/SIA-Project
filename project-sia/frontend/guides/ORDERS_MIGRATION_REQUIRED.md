# 🔧 Orders System - Supabase Migration Guide

## ❌ Current Issue

The backend is failing to create orders because the Supabase `orders` table is missing two columns:
- `fulfillment_method` (VARCHAR 20) - Indicates 'pickup' or 'delivery'
- `delivery_barangay` (VARCHAR 100) - Barangay/Ward for delivery address

## ✅ Solution

### Step 1: Run the Migration in Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com/
   - Select your project
   - Go to **SQL Editor**

2. **Create a New Query**
   - Click **"New Query"** button
   - Paste the contents of `backend/supabase/ADD_MISSING_ORDERS_COLUMNS.sql`
   - Or copy this code:

```sql
-- Add missing columns to orders table for new checkout functionality
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS fulfillment_method VARCHAR(20) DEFAULT 'pickup';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_barangay VARCHAR(100);

UPDATE orders SET fulfillment_method = 'pickup' WHERE fulfillment_method IS NULL;

ALTER TABLE orders 
ADD CONSTRAINT valid_fulfillment_method CHECK (fulfillment_method IN ('pickup', 'delivery'));

CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_method ON orders(fulfillment_method);
```

3. **Execute the Query**
   - Click **"Run"** button (or press Ctrl+Enter)
   - Wait for confirmation: "Query executed successfully"

### Step 2: Verify the Changes

Run this verification query in Supabase:

```sql
-- Check if columns were added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

You should see these new columns:
- `fulfillment_method` | character varying | NO | 'pickup'::character varying
- `delivery_barangay` | character varying | YES | NULL

### Step 3: Test the Checkout

1. **Ensure backend is running**
   ```powershell
   cd backend
   npm start
   ```

2. **Ensure frontend is running**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Test placing an order**
   - Go to http://localhost:5173/products
   - Add items to cart
   - Go to checkout
   - Try placing an order

4. **Check browser console** (F12 → Console tab)
   - Should see: `[Checkout] ✅ Order created successfully: {...}`
   - Order should appear in database

### Step 4: Verify in Database

Run this query in Supabase to see your new orders:

```sql
SELECT 
  id,
  order_number,
  customer_name,
  fulfillment_method,
  delivery_address,
  delivery_barangay,
  delivery_city,
  delivery_province,
  order_status,
  total_amount,
  order_date
FROM orders
ORDER BY order_date DESC
LIMIT 10;
```

## 📋 Troubleshooting

### Error: "Column already exists"
- This is fine, the migration uses `IF NOT EXISTS` to handle this

### Error: "Table 'orders' does not exist"
- Run the full `INVENTORY_SCHEMA.sql` first:
  1. Open `backend/supabase/INVENTORY_SCHEMA.sql` in Supabase SQL Editor
  2. Run the entire script
  3. Then run `ADD_MISSING_ORDERS_COLUMNS.sql`

### Error: "Cannot connect to server"
- Make sure backend is running: `cd backend && npm start`
- Check that it shows: `✅ Listening on http://localhost:5174`

### Order creation still fails
- Check browser console (F12 → Console)
- Look for the exact error message
- Check backend terminal for error logs
- Verify Supabase credentials in `backend/.env`

## 🎯 What This Enables

✅ Customers can now place orders via checkout form
✅ Orders are saved to Supabase database
✅ Pickup orders auto-confirmed
✅ Delivery orders marked as pending for admin approval
✅ Complete order history in database
✅ Admin can view and manage orders in admin panel

## 📚 Related Files

- **Migration SQL**: `backend/supabase/ADD_MISSING_ORDERS_COLUMNS.sql`
- **Full Schema**: `backend/supabase/INVENTORY_SCHEMA.sql`
- **Backend Orders API**: `backend/routes/orders.js`
- **Frontend Checkout**: `frontend/src/pages/checkout/Checkout.jsx`
- **Admin Orders View**: `frontend/src/admin/components/CustomerOrders.jsx`

## ✨ Next Steps (Optional)

After orders are working:
1. Set up email notifications for order confirmation
2. Add SMS notifications via Twilio
3. Create order tracking page for customers
4. Add payment gateway integration (Stripe/GCash)
5. Generate invoices/receipts

