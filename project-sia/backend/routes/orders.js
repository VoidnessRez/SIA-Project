import express from 'express';
import { supabase } from '../supabaseClient.js';
import emailService from '../services/emailService.js';

const router = express.Router();

/**
 * POST /api/orders/create
 * Create a new order with order items
 */
router.post('/create', async (req, res) => {
  try {
    const {
      user_id,
      customer_name,
      customer_email,
      customer_phone,
      fulfillment_method,
      payment_method,
      delivery_address,
      delivery_barangay,
      delivery_city,
      delivery_province,
      delivery_zipcode,
      delivery_notes,
      items, // Array of order items
      subtotal,
      shipping_fee,
      tax_amount,
      discount_amount,
      total_amount
    } = req.body;

    console.log('[Orders API] 📦 Creating new order for user:', user_id);

    // Determine order status based on fulfillment method
    // Pickup = auto-approved (confirmed)
    // Delivery = pending_approval (admin needs to verify)
    const order_status = fulfillment_method === 'pickup' ? 'confirmed' : 'pending_approval';

    // Generate order number
    const order_number = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Insert order into orders table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number,
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        fulfillment_method,
        payment_method,
        delivery_address,
        delivery_barangay,
        delivery_city,
        delivery_province,
        delivery_zipcode,
        delivery_notes,
        order_status,
        subtotal: parseFloat(subtotal),
        shipping_fee: parseFloat(shipping_fee),
        tax_amount: parseFloat(tax_amount || 0),
        discount_amount: parseFloat(discount_amount || 0),
        total_amount: parseFloat(total_amount),
        order_date: new Date().toISOString(),
        confirmed_at: fulfillment_method === 'pickup' ? new Date().toISOString() : null
      }])
      .select()
      .single();

    if (orderError) {
      console.error('[Orders API] ❌ Error creating order:', orderError);
      throw orderError;
    }

    console.log('[Orders API] ✅ Order created:', orderData.id);

    // Insert order items
    if (items && items.length > 0) {
      const orderItems = items.map(item => {
        // Support both 'price' and 'unit_price' field names from frontend
        const price = parseFloat(item.price || item.unit_price);
        const quantity = parseInt(item.quantity);
        const discount = parseFloat(item.discount || 0);
        
        return {
          order_id: orderData.id,
          product_type: item.product_type || 'motorcycle', // motorcycle, spare_part, accessory
          product_id: item.product_id,
          product_sku: item.sku || item.product_sku,
          product_name: item.name || item.product_name,
          product_image: item.image || item.product_image || '🏍️',
          selected_size: item.size || item.selected_size || null,
          selected_color: item.color || item.selected_color || null,
          quantity: quantity,
          unit_price: price,
          subtotal: parseFloat(item.subtotal || (price * quantity)),
          discount: discount,
          total: parseFloat(item.total || ((price * quantity) - discount))
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('[Orders API] ❌ Error creating order items:', itemsError);
        // Delete the order if items fail
        await supabase.from('orders').delete().eq('id', orderData.id);
        throw itemsError;
      }

      console.log('[Orders API] ✅ Order items created:', orderItems.length);
    }

    // Send receipt email
    try {
      // Transform items to match email template format
      const emailItems = items.map(item => ({
        id: item.product_id,
        name: item.product_name,
        sku: item.product_sku || 'N/A',
        image: item.product_image || '⚙️',
        price: parseFloat(item.unit_price || 0),
        quantity: parseInt(item.quantity || 1)
      }));

      await emailService.sendOrderReceipt({
        orderNumber: orderData.order_number,
        customerName: customer_name,
        customerEmail: customer_email,
        items: emailItems,
        subtotal: subtotal,
        tax: tax_amount || 0,
        shippingFee: shipping_fee || 0,
        discount: discount_amount > 0 ? {
          type: req.body.discount_type || 'Discount',
          amount: discount_amount
        } : null,
        total: total_amount,
        paymentMethod: payment_method,
        timestamp: orderData.order_date
      });
      console.log('[Orders API] 📧 Receipt email sent');
    } catch (emailError) {
      console.error('[Orders API] ⚠️ Failed to send receipt email:', emailError);
      // Don't fail the order if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: orderData.id,
      orderNumber: orderData.order_number,
      data: {
        order_id: orderData.id,
        order_number: orderData.order_number,
        order_status: orderData.order_status,
        total_amount: orderData.total_amount,
        fulfillment_method: orderData.fulfillment_method
      }
    });

  } catch (error) {
    console.error('[Orders API] 💥 Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

/**
 * GET /api/orders
 * Get all orders (admin only)
 */
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

    res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('[Orders API] Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

/**
 * GET /api/orders/:id
 * Get single order by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Orders API] Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

/**
 * PUT /api/orders/:id/status
 * Update order status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, admin_notes } = req.body;

    const updateData = {
      order_status,
      updated_at: new Date().toISOString()
    };

    // Add timestamp fields based on status
    if (order_status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
    } else if (order_status === 'shipped') {
      updateData.shipped_at = new Date().toISOString();
    } else if (order_status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (order_status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
    }

    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Order status updated',
      data
    });

  } catch (error) {
    console.error('[Orders API] Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

export default router;
