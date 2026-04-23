import express from 'express';
import { supabase } from '../supabaseClient.js';
import emailService from '../services/emailService.js';

const router = express.Router();

const ORDER_STATUSES = {
  PENDING_APPROVAL: 'pending_approval',
  INCOMPLETE_TRANSACTION: 'incomplete_txn',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  BUYER_CANCELLED: 'buyer_cancelled',
  DECLINED_ADMIN: 'declined_admin',
  CANCELLED: 'cancelled'
};

const VALID_ORDER_STATUSES = new Set(Object.values(ORDER_STATUSES));

const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

const VALID_PAYMENT_STATUSES = new Set(Object.values(PAYMENT_STATUSES));
const NON_REFUNDABLE_GCASH_NOTE = 'GCash downpayment is non-refundable under store policy.';

function appendAdminNote(existingNotes, noteText) {
  const trimmed = String(noteText || '').trim();
  if (!trimmed) return existingNotes || null;
  const stamp = new Date().toISOString();
  const line = `[Policy ${stamp}] ${trimmed}`;
  return existingNotes ? `${existingNotes}\n${line}` : line;
}

const STOCK_TABLE_BY_TYPE = {
  sparepart: 'spare_parts',
  spare_part: 'spare_parts',
  accessory: 'accessories'
};

function normalizeProductType(rawType) {
  const value = String(rawType || '').trim().toLowerCase();
  if (value === 'spare_part' || value === 'sparepart') return 'sparepart';
  if (value === 'accessory' || value === 'accessories') return 'accessory';
  return 'sparepart';
}

function getStockTable(productType) {
  const normalized = normalizeProductType(productType);
  const table = STOCK_TABLE_BY_TYPE[normalized];
  if (!table) {
    throw new Error(`Unsupported product_type: ${productType}`);
  }
  return table;
}

async function logInventoryTransaction({
  productType,
  productId,
  quantity,
  previousQuantity,
  newQuantity,
  referenceNumber,
  transactionType,
  notes,
  productSku,
  productName
}) {
  const normalizedType = normalizeProductType(productType);

  // Try schema used by INVENTORY_SCHEMA.sql first.
  const modernPayload = {
    transaction_type: transactionType,
    product_type: normalizedType,
    product_id: productId,
    quantity_change: quantity,
    previous_quantity: previousQuantity,
    new_quantity: newQuantity,
    reference_type: 'order',
    reference_id: null,
    notes,
    transaction_date: new Date().toISOString()
  };

  const modernInsert = await supabase
    .from('inventory_transactions')
    .insert([modernPayload]);

  if (!modernInsert.error) return;

  // Fallback for legacy/sample schema variants.
  const legacyPayload = {
    product_type: normalizedType,
    product_id: productId,
    product_sku: productSku || 'N/A',
    product_name: productName || 'Unknown Product',
    transaction_type: transactionType,
    quantity: Math.abs(quantity),
    transaction_reason: transactionType,
    reference_number: referenceNumber,
    previous_quantity: previousQuantity,
    new_quantity: newQuantity,
    notes
  };

  const legacyInsert = await supabase
    .from('inventory_transactions')
    .insert([legacyPayload]);

  if (legacyInsert.error) {
    throw new Error(
      `Failed to log inventory transaction: ${legacyInsert.error.message || modernInsert.error.message}`
    );
  }
}

async function rollbackAppliedStock(appliedChanges) {
  if (!appliedChanges.length) return;

  for (let i = appliedChanges.length - 1; i >= 0; i -= 1) {
    const change = appliedChanges[i];
    await supabase
      .from(change.table)
      .update({ stock_quantity: change.previousQuantity })
      .eq('id', change.productId);
  }
}

async function validateStockAvailability(orderItems) {
  const neededByProduct = new Map();

  for (const item of orderItems) {
    const table = getStockTable(item.product_type);
    const quantity = parseInt(item.quantity, 10);
    const key = `${table}:${item.product_id}`;
    neededByProduct.set(key, (neededByProduct.get(key) || 0) + quantity);
  }

  for (const [key, requiredQty] of neededByProduct.entries()) {
    const [table, idRaw] = key.split(':');
    const productId = parseInt(idRaw, 10);

    const { data: product, error } = await supabase
      .from(table)
      .select('id, stock_quantity, name')
      .eq('id', productId)
      .single();

    if (error || !product) {
      throw new Error(`Product not found for stock validation (${table}:${productId})`);
    }

    const available = parseInt(product.stock_quantity || 0, 10);
    if (available < requiredQty) {
      throw new Error(`Insufficient stock for ${product.name || productId}. Available: ${available}, required: ${requiredQty}`);
    }
  }
}

async function applyStockMovements(orderItems, { direction, referenceNumber, transactionType }) {
  const appliedChanges = [];

  try {
    for (const item of orderItems) {
      const normalizedType = normalizeProductType(item.product_type);
      const table = getStockTable(normalizedType);
      const quantity = parseInt(item.quantity, 10);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity for product ${item.product_id}`);
      }

      const { data: product, error: readError } = await supabase
        .from(table)
        .select('id, stock_quantity, sku, name')
        .eq('id', item.product_id)
        .single();

      if (readError || !product) {
        throw new Error(`Product not found for stock update (table: ${table}, id: ${item.product_id})`);
      }

      const currentQty = parseInt(product.stock_quantity || 0, 10);
      const delta = direction === 'deduct' ? -quantity : quantity;
      const nextQty = currentQty + delta;

      if (direction === 'deduct' && currentQty < quantity) {
        throw new Error(`Insufficient stock for ${item.product_name || product.name || item.product_id}. Available: ${currentQty}, requested: ${quantity}`);
      }

      if (nextQty < 0) {
        throw new Error(`Stock cannot go negative for product ${item.product_id}`);
      }

      const { data: updatedRows, error: updateError } = await supabase
        .from(table)
        .update({ stock_quantity: nextQty })
        .eq('id', item.product_id)
        .eq('stock_quantity', currentQty)
        .select('id, stock_quantity');

      if (updateError) {
        throw new Error(`Stock update failed for product ${item.product_id}: ${updateError.message}`);
      }

      if (!updatedRows || updatedRows.length === 0) {
        throw new Error(`Stock changed concurrently for product ${item.product_id}. Please retry checkout.`);
      }

      appliedChanges.push({
        table,
        productId: item.product_id,
        previousQuantity: currentQty,
        newQuantity: nextQty
      });

      try {
        await logInventoryTransaction({
          productType: normalizedType,
          productId: item.product_id,
          quantity: delta,
          previousQuantity: currentQty,
          newQuantity: nextQty,
          referenceNumber,
          transactionType,
          notes: direction === 'deduct'
            ? `Order reserve: ${referenceNumber}`
            : `Order cancellation restock: ${referenceNumber}`,
          productSku: item.product_sku || product.sku,
          productName: item.product_name || product.name
        });
      } catch (txLogError) {
        // Do not block core order flow when inventory transaction schema variants are incompatible.
        console.warn('[Orders API] Inventory transaction logging skipped:', txLogError.message);
      }
    }
  } catch (error) {
    await rollbackAppliedStock(appliedChanges);
    throw error;
  }
}

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

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    const normalizedPaymentMethod = String(payment_method || '').trim().toLowerCase();
    const allowedPaymentMethods = new Set(['cod', 'gcash', 'bank']);
    if (!allowedPaymentMethods.has(normalizedPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method: ${payment_method}`
      });
    }

    // GCash has an additional verification step, so it always starts in pending approval.
    const isGcashPayment = normalizedPaymentMethod === 'gcash';
    const order_status = isGcashPayment
      ? ORDER_STATUSES.PENDING_APPROVAL
      : (fulfillment_method === 'pickup' ? ORDER_STATUSES.CONFIRMED : ORDER_STATUSES.PENDING_APPROVAL);
    const confirmedAt = !isGcashPayment && fulfillment_method === 'pickup'
      ? new Date().toISOString()
      : null;

    // Validate and normalize order items first.
    const orderItems = items.map((item, index) => {
      const price = parseFloat(item.price || item.unit_price) || 0;
      const quantity = parseInt(item.quantity, 10) || 0;
      const discount = parseFloat(item.discount || 0) || 0;

      if (!item.product_id) {
        throw new Error(`Missing product_id at item index ${index}`);
      }
      if (quantity <= 0) {
        throw new Error(`Invalid quantity (${quantity}) for item at index ${index}`);
      }
      if (price <= 0) {
        throw new Error(`Invalid price (${price}) for item at index ${index}`);
      }
      if (discount < 0) {
        throw new Error(`Invalid discount (${discount}) for item at index ${index}`);
      }

      const normalizedType = normalizeProductType(item.product_type);
      const itemSubtotal = parseFloat(item.subtotal || (price * quantity)) || 0;
      const itemTotal = parseFloat(item.total || ((price * quantity) - discount)) || 0;

      return {
        order_id: null,
        product_type: normalizedType,
        product_id: item.product_id,
        product_sku: item.sku || item.product_sku,
        product_name: item.name || item.product_name,
        product_image: item.image || item.product_image || '🏍️',
        selected_size: item.size || item.selected_size || null,
        selected_color: item.color || item.selected_color || null,
        quantity,
        unit_price: price,
        subtotal: itemSubtotal,
        discount,
        total: itemTotal
      };
    });

    // Read-only stock pre-check before creating order.
    await validateStockAvailability(orderItems);

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
        payment_method: normalizedPaymentMethod,
        payment_status: PAYMENT_STATUSES.PENDING,
        delivery_address,
        delivery_barangay,
        delivery_city,
        delivery_province,
        delivery_zipcode,
        delivery_notes,
        order_status,
        admin_notes: isGcashPayment ? 'Waiting for GCash receipt upload and admin verification.' : null,
        subtotal: parseFloat(subtotal),
        shipping_fee: parseFloat(shipping_fee),
        tax_amount: parseFloat(tax_amount || 0),
        discount_amount: parseFloat(discount_amount || 0),
        total_amount: parseFloat(total_amount),
        order_date: new Date().toISOString(),
        confirmed_at: confirmedAt
      }])
      .select()
      .single();

    if (orderError) {
      console.error('[Orders API] ❌ Error creating order:', orderError);
      throw orderError;
    }

    console.log('[Orders API] ✅ Order created:', orderData.id);

    // Attach order_id to normalized items.
    const orderItemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: orderData.id
    }));

    // Insert order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      console.error('[Orders API] ❌ Error creating order items:', itemsError);

      await supabase.from('orders').delete().eq('id', orderData.id);
      throw itemsError;
    }

    console.log('[Orders API] ✅ Order items created:', orderItemsWithOrderId.length);

    // Deduct stock only after order_items are successfully inserted.
    try {
      await applyStockMovements(orderItemsWithOrderId, {
        direction: 'deduct',
        referenceNumber: order_number,
        transactionType: 'sale_reserved'
      });
    } catch (deductError) {
      console.error('[Orders API] ❌ Stock deduction failed after order creation:', deductError.message);

      // Cleanup created order records if stock deduction fails.
      await supabase.from('order_items').delete().eq('order_id', orderData.id);
      await supabase.from('orders').delete().eq('id', orderData.id);

      throw deductError;
    }

    let receiptEmailStatus = {
      success: false,
      provider: null,
      message: 'Receipt email not attempted'
    };

    // Send receipt email
    try {
      // Transform items to match email template format
      const emailItems = orderItemsWithOrderId.map(item => ({
        id: item.product_id,
        name: item.product_name,
        sku: item.product_sku || 'N/A',
        image: item.product_image || '⚙️',
        price: parseFloat(item.unit_price || 0),
        quantity: parseInt(item.quantity || 1)
      }));

      const emailResult = await emailService.sendOrderReceipt({
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

      receiptEmailStatus = {
        success: true,
        provider: emailResult?.provider || null,
        messageId: emailResult?.messageId || null,
        accepted: emailResult?.accepted || [],
        rejected: emailResult?.rejected || [],
        response: emailResult?.response || null,
        message: 'Receipt email sent'
      };

      console.log('[Orders API] 📧 Receipt email sent');
      console.log('[Orders API] 📬 Receipt delivery details:', {
        provider: receiptEmailStatus.provider,
        messageId: receiptEmailStatus.messageId,
        accepted: receiptEmailStatus.accepted,
        rejected: receiptEmailStatus.rejected,
        response: receiptEmailStatus.response
      });
    } catch (emailError) {
      console.error('[Orders API] ⚠️ Failed to send receipt email:', emailError);
      receiptEmailStatus = {
        success: false,
        provider: null,
        message: emailError?.message || 'Failed to send receipt email'
      };
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
      },
      receiptEmail: receiptEmailStatus
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
 * PUT /api/orders/:id/cancel-by-buyer
 * Cancel order from buyer side
 */
router.put('/:id/cancel-by-buyer', async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body || {};

    const { data: existingOrder, error: existingOrderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        order_status,
        payment_method,
        payment_status,
        admin_notes,
        order_items (
          product_type,
          product_id,
          product_sku,
          product_name,
          quantity
        )
      `)
      .eq('id', id)
      .single();

    if (existingOrderError || !existingOrder) {
      throw new Error('Order not found');
    }

    const cancellableStatuses = [
      ORDER_STATUSES.PENDING_APPROVAL,
      ORDER_STATUSES.INCOMPLETE_TRANSACTION,
      ORDER_STATUSES.CONFIRMED
    ];

    if (!cancellableStatuses.includes(existingOrder.order_status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in status: ${existingOrder.order_status}`
      });
    }

    await applyStockMovements(existingOrder.order_items || [], {
      direction: 'restore',
      referenceNumber: existingOrder.order_number,
      transactionType: 'sale_buyer_cancel_restore'
    });

    const updateData = {
      order_status: ORDER_STATUSES.BUYER_CANCELLED,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: String(cancellation_reason || '').trim() || 'Cancelled by buyer',
      updated_at: new Date().toISOString()
    };

    const isPaidGcash =
      String(existingOrder.payment_method || '').toLowerCase() === 'gcash' &&
      String(existingOrder.payment_status || '').toLowerCase() === PAYMENT_STATUSES.PAID;

    if (isPaidGcash) {
      updateData.admin_notes = appendAdminNote(existingOrder.admin_notes, NON_REFUNDABLE_GCASH_NOTE);
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
      message: 'Order cancelled by buyer',
      data
    });
  } catch (error) {
    console.error('[Orders API] Error in buyer cancellation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
});

/**
 * PUT /api/orders/:id/payment-status
 * Verify or update payment status (admin action)
 */
router.put('/:id/payment-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, verification_note, admin_reason } = req.body || {};

    if (!VALID_PAYMENT_STATUSES.has(payment_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status: ${payment_status}`
      });
    }

    if (payment_status === PAYMENT_STATUSES.FAILED && !String(admin_reason || '').trim()) {
      return res.status(400).json({
        success: false,
        message: 'Admin reason is required when rejecting payment proof'
      });
    }

    const { data: existingOrder, error: existingOrderError } = await supabase
      .from('orders')
      .select('id, order_status, payment_method, payment_proof_url, admin_notes')
      .eq('id', id)
      .single();

    if (existingOrderError || !existingOrder) {
      throw new Error('Order not found');
    }

    if (String(existingOrder.payment_method || '').toLowerCase() !== 'gcash') {
      return res.status(400).json({
        success: false,
        message: 'Payment verification action is only available for GCash orders'
      });
    }

    if (payment_status === PAYMENT_STATUSES.REFUNDED) {
      return res.status(400).json({
        success: false,
        message: 'GCash downpayment is non-refundable and cannot be marked as refunded'
      });
    }

    if (payment_status === PAYMENT_STATUSES.PAID && !existingOrder.payment_proof_url) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark as paid without payment proof'
      });
    }

    const updateData = {
      payment_status,
      updated_at: new Date().toISOString()
    };

    if (
      payment_status === PAYMENT_STATUSES.PAID &&
      [ORDER_STATUSES.PENDING_APPROVAL, ORDER_STATUSES.INCOMPLETE_TRANSACTION].includes(existingOrder.order_status)
    ) {
      updateData.order_status = ORDER_STATUSES.CONFIRMED;
      updateData.confirmed_at = new Date().toISOString();
    }

    if (
      payment_status === PAYMENT_STATUSES.FAILED &&
      [ORDER_STATUSES.PENDING_APPROVAL, ORDER_STATUSES.CONFIRMED].includes(existingOrder.order_status)
    ) {
      updateData.order_status = ORDER_STATUSES.INCOMPLETE_TRANSACTION;
    }

    if (payment_status === PAYMENT_STATUSES.FAILED && String(admin_reason || '').trim()) {
      const stamp = new Date().toISOString();
      const line = `[Admin Reject ${stamp}] ${String(admin_reason).trim()}`;
      updateData.admin_notes = existingOrder.admin_notes
        ? `${existingOrder.admin_notes}\n${line}`
        : line;
    } else if (verification_note) {
      const stamp = new Date().toISOString();
      const line = `[Payment Verification ${stamp}] ${verification_note}`;
      updateData.admin_notes = existingOrder.admin_notes
        ? `${existingOrder.admin_notes}\n${line}`
        : line;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Payment status updated successfully',
      data
    });
  } catch (error) {
    console.error('[Orders API] Error updating payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
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
    const { order_status, admin_notes, cancellation_reason } = req.body;

    if (!VALID_ORDER_STATUSES.has(order_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status: ${order_status}`
      });
    }

    const { data: existingOrder, error: existingOrderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        order_status,
        payment_method,
        payment_status,
        admin_notes,
        order_items (
          product_type,
          product_id,
          product_sku,
          product_name,
          quantity
        )
      `)
      .eq('id', id)
      .single();

    if (existingOrderError || !existingOrder) {
      throw new Error('Order not found');
    }

    const previousStatus = existingOrder.order_status;

    // If a pending/confirmed order is cancelled (not accepted), restore reserved stock.
    const nextIsCancellationStatus = [
      ORDER_STATUSES.CANCELLED,
      ORDER_STATUSES.BUYER_CANCELLED,
      ORDER_STATUSES.DECLINED_ADMIN
    ].includes(order_status);

    const previousWasCancellationStatus = [
      ORDER_STATUSES.CANCELLED,
      ORDER_STATUSES.BUYER_CANCELLED,
      ORDER_STATUSES.DECLINED_ADMIN
    ].includes(previousStatus);

    const shouldRestoreStock =
      nextIsCancellationStatus &&
      !previousWasCancellationStatus &&
      [
        ORDER_STATUSES.PENDING_APPROVAL,
        ORDER_STATUSES.INCOMPLETE_TRANSACTION,
        ORDER_STATUSES.CONFIRMED
      ].includes(previousStatus);

    if (shouldRestoreStock) {
      await applyStockMovements(existingOrder.order_items || [], {
        direction: 'restore',
        referenceNumber: existingOrder.order_number,
        transactionType: 'sale_cancelled_restore'
      });
    }

    const updateData = {
      order_status,
      updated_at: new Date().toISOString()
    };

    // Add timestamp fields based on status
    if (order_status === ORDER_STATUSES.CONFIRMED) {
      updateData.confirmed_at = new Date().toISOString();
    } else if (order_status === ORDER_STATUSES.SHIPPED) {
      updateData.shipped_at = new Date().toISOString();
    } else if (order_status === ORDER_STATUSES.DELIVERED) {
      updateData.delivered_at = new Date().toISOString();
    } else if (
      [
        ORDER_STATUSES.CANCELLED,
        ORDER_STATUSES.BUYER_CANCELLED,
        ORDER_STATUSES.DECLINED_ADMIN
      ].includes(order_status)
    ) {
      updateData.cancelled_at = new Date().toISOString();
      if (cancellation_reason) {
        updateData.cancellation_reason = cancellation_reason;
      }
    }

    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    const isPaidGcash =
      String(existingOrder.payment_method || '').toLowerCase() === 'gcash' &&
      String(existingOrder.payment_status || '').toLowerCase() === PAYMENT_STATUSES.PAID;

    if (nextIsCancellationStatus && isPaidGcash) {
      updateData.admin_notes = appendAdminNote(updateData.admin_notes || existingOrder.admin_notes, NON_REFUNDABLE_GCASH_NOTE);
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
