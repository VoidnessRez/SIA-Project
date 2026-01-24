# 🎯 Customer Orders System - Implementation Guide

## ✅ What's Already Done

### 1. Database Schema (INVENTORY_SCHEMA.sql)
- ✅ `orders` table with all necessary fields
- ✅ `order_items` table for order line items
- ✅ Order statuses: pending_approval, confirmed, processing, shipped, delivered, cancelled
- ✅ Fulfillment tracking fields (confirmed_by, shipped_at, delivered_at, etc.)
- ✅ Delivery address fields
- ✅ Payment tracking

### 2. Frontend Admin Component
- ✅ `CustomerOrders.jsx` - Full admin UI for order management
- ✅ `CustomerOrders.css` - Complete styling
- ✅ View all orders with filters (pending, confirmed, processing, etc.)
- ✅ Approve/Decline pending orders
- ✅ Update order status (processing → shipped → delivered)
- ✅ Admin notes functionality
- ✅ Order detail modal with full info
- ✅ Route added to `/admin/orders`

### 3. Checkout Flow (Frontend)
- ✅ Fulfillment method selection (pickup vs delivery)
- ✅ Address selection (saved vs new)
- ✅ Delivery fee calculation
- ✅ Order status logic:
  - Pickup = 'confirmed' (auto-approved)
  - Delivery = 'pending_approval' (needs admin approval)

## 🚧 What Needs to Be Done

### Step 1: Update Checkout.jsx to Save to Database
**File:** `frontend/src/pages/checkout/Checkout.jsx`

Current Issue: Orders are saved to localStorage only
```javascript
// CURRENT (localStorage only):
const order = { id: newOrderId, ... };
localStorage.setItem('orders', JSON.stringify(existingOrders));
```

Need to change to:
```javascript
// NEW (save to database):
const response = await fetch('http://localhost:5174/api/orders/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: user?.id,
    customer_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
    customer_email: shippingInfo.email,
    customer_phone: shippingInfo.phone,
    delivery_address: fulfillmentMethod === 'delivery' ? shippingInfo.address : null,
    delivery_city: fulfillmentMethod === 'delivery' ? shippingInfo.city : null,
    delivery_province: fulfillmentMethod === 'delivery' ? shippingInfo.province : null,
    delivery_zipcode: fulfillmentMethod === 'delivery' ? shippingInfo.zipCode : null,
    delivery_notes: shippingInfo.notes,
    subtotal: calculateSubtotal(),
    shipping_fee: calculateShipping(),
    tax_amount: calculateTax(),
    total_amount: calculateTotal(),
    payment_method: paymentMethod,
    order_status: fulfillmentMethod === 'pickup' ? 'confirmed' : 'pending_approval',
    items: cartItems.map(item => ({
      product_type: 'sparepart', // or 'accessory'
      product_id: item.id,
      product_sku: item.sku,
      product_name: item.name,
      product_image: item.image,
      selected_size: item.size || null,
      selected_color: item.color || null,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
      total: item.price * item.quantity
    }))
  })
});
```

### Step 2: Create Backend Orders API
**File:** `backend/routes/orders.js` (NEW FILE)

```javascript
import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// POST /api/orders/create
router.post('/create', async (req, res) => {
  console.log('[Orders] 📝 Creating new order...');
  
  const {
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    delivery_address,
    delivery_city,
    delivery_province,
    delivery_zipcode,
    delivery_notes,
    subtotal,
    shipping_fee,
    tax_amount,
    total_amount,
    payment_method,
    order_status,
    items
  } = req.body;

  try {
    // Generate order number
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    
    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        delivery_address,
        delivery_city,
        delivery_province,
        delivery_zipcode,
        delivery_notes,
        subtotal,
        shipping_fee,
        tax_amount,
        total_amount,
        payment_method,
        payment_status: 'pending',
        order_status
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      ...item
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    console.log('[Orders] ✅ Order created:', orderNumber);
    return res.json({ 
      success: true, 
      order: order,
      order_number: orderNumber 
    });

  } catch (error) {
    console.error('[Orders] ❌ Error creating order:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create order' 
    });
  }
});

// GET /api/orders (for admin)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('order_date', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error) {
    console.error('[Orders] ❌ Error fetching orders:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// PUT /api/orders/:id/status (for admin)
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { order_status, admin_notes, confirmed_by } = req.body;

  try {
    const updateData = {
      order_status,
      admin_notes,
      updated_at: new Date().toISOString()
    };

    if (order_status === 'confirmed') {
      updateData.confirmed_by = confirmed_by;
      updateData.confirmed_at = new Date().toISOString();
    } else if (order_status === 'shipped') {
      updateData.shipped_at = new Date().toISOString();
    } else if (order_status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (order_status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    return res.json({ success: true });
  } catch (error) {
    console.error('[Orders] ❌ Error updating order:', error);
    return res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

export default router;
```

### Step 3: Register Orders Routes in Backend
**File:** `backend/index.js`

Add import:
```javascript
import ordersRouter from './routes/orders.js';
```

Add route:
```javascript
app.use('/api/orders', ordersRouter);
```

## 📊 Database Alignment Check

### Orders Table Fields (from INVENTORY_SCHEMA.sql):
✅ All fields exist and are properly typed:
- `id` (SERIAL PRIMARY KEY)
- `order_number` (VARCHAR(50) UNIQUE)
- `user_id` (UUID REFERENCES auth_users)
- `customer_name`, `customer_email`, `customer_phone`
- `delivery_address`, `delivery_city`, `delivery_province`, `delivery_zipcode`
- `subtotal`, `shipping_fee`, `tax_amount`, `total_amount`
- `payment_method`, `payment_status`
- `order_status` (default 'pending')
- `confirmed_by`, `confirmed_at`, `shipped_at`, `delivered_at`, `cancelled_at`
- `admin_notes`, `customer_notes`
- `order_date`, `created_at`, `updated_at`

### Order Items Table Fields:
✅ All fields exist:
- `id`, `order_id`
- `product_type`, `product_id`, `product_sku`, `product_name`, `product_image`
- `selected_size`, `selected_color`
- `quantity`, `unit_price`, `subtotal`, `discount`, `total`

## 🔄 Complete Flow

### Customer Flow:
1. Customer adds items to cart
2. Goes to checkout
3. Selects fulfillment method:
   - **Pickup**: Order status = 'confirmed' (auto-approved)
   - **Delivery**: Order status = 'pending_approval' (needs admin review)
4. Fills shipping info
5. Places order → Saved to database
6. Receives order confirmation with order number

### Admin Flow:
1. Admin logs into admin panel
2. Navigates to **Orders & Sales → Customer Orders**
3. Sees list of all orders with badges showing pending count
4. **For Pending Orders**:
   - Clicks order to view details
   - Reviews:
     - Customer info
     - Delivery address
     - Items ordered
     - Total amount
   - Can:
     - ✅ Approve → Status changes to 'confirmed'
     - ❌ Decline → Status changes to 'cancelled' with reason
5. **For Confirmed Orders**:
   - Mark as 'processing' when preparing
   - Mark as 'shipped' when dispatched
   - Mark as 'delivered' when received
6. Can add admin notes at any stage

## 🎯 Next Actions

1. **Update `Checkout.jsx`** - Change from localStorage to API call
2. **Create `backend/routes/orders.js`** - Implement order creation API
3. **Update `backend/index.js`** - Register orders routes
4. **Test the flow**:
   - Place a pickup order (should auto-approve)
   - Place a delivery order (should show as pending)
   - Login to admin panel
   - View orders in `/admin/orders`
   - Approve/decline delivery orders
   - Update order statuses

## 📝 Notes

- Pickup orders are auto-approved since customer will pick up from store
- Delivery orders need admin approval to verify location and delivery capacity
- Order numbers follow format: `ORD-2025-12345`
- Admin can track order progress through status updates
- All order actions are logged with timestamps
- Delivery fees are calculated based on province/city matching

## 🚀 Benefits

✅ Real-time order tracking for admin
✅ Approval workflow for deliveries  
✅ Complete order history in database
✅ Audit trail with timestamps and admin notes
✅ Scalable system for growing business
✅ Integration-ready for future features (email notifications, SMS, etc.)
