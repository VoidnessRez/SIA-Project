import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.AUDIT_BASE_URL || 'http://localhost:5174';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { res, data };
}

async function getSeedItem() {
  const { res, data } = await requestJson(`${BASE_URL}/api/orders`);
  assert(res.ok && data?.success, 'Failed to load orders for seed item lookup');
  const orders = Array.isArray(data.data) ? data.data : [];
  const seeded = orders.find((o) => Array.isArray(o.order_items) && o.order_items.length > 0);
  assert(seeded, 'No order with order_items found. Seed data is required.');
  const item = seeded.order_items[0];
  return { order: seeded, item };
}

function createOrderPayload(seedOrder, item, paymentMethod, note) {
  const qty = 1;
  const unit = Number(item.unit_price || 0);
  const sub = Number((unit * qty).toFixed(2));

  return {
    user_id: seedOrder.user_id,
    customer_name: seedOrder.customer_name,
    customer_email: seedOrder.customer_email,
    customer_phone: seedOrder.customer_phone,
    fulfillment_method: 'pickup',
    payment_method: paymentMethod,
    delivery_address: null,
    delivery_barangay: null,
    delivery_city: null,
    delivery_province: null,
    delivery_zipcode: null,
    delivery_notes: note,
    items: [
      {
        product_type: item.product_type,
        product_id: item.product_id,
        product_sku: item.product_sku,
        product_name: item.product_name,
        quantity: qty,
        unit_price: unit,
        subtotal: sub,
        discount: 0,
        total: sub
      }
    ],
    subtotal: sub,
    shipping_fee: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: sub
  };
}

async function createOrder(seedOrder, item, paymentMethod, note) {
  const payload = createOrderPayload(seedOrder, item, paymentMethod, note);
  const { res, data } = await requestJson(`${BASE_URL}/api/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert(res.ok && data?.success, `Create order failed (${paymentMethod})`);
  return data;
}

async function uploadProof(orderId) {
  const imagePath = path.resolve('img', 'Comments&Suggtn', 'SIAA311', 'page1.png');
  const bytes = await fs.readFile(imagePath);
  const form = new FormData();
  form.append('receipt', new Blob([bytes], { type: 'image/png' }), 'page1.png');
  form.append('orderId', String(orderId));

  const { res } = await requestJson(`${BASE_URL}/api/upload/payment-proof`, {
    method: 'POST',
    body: form
  });
  return res.status;
}

async function main() {
  console.log('🔎 Running E2E core flow checks...');

  const health = await requestJson(`${BASE_URL}/api/health`);
  assert(health.res.ok && health.data?.status === 'ok', 'Health check failed');
  console.log('✅ Health check passed');

  const { order: seedOrder, item } = await getSeedItem();

  const codOrder = await createOrder(seedOrder, item, 'cod', 'test:e2e core cod');
  assert(codOrder?.data?.order_status === 'confirmed', 'COD pickup should auto-confirm');
  console.log('✅ COD create rule passed');

  const gcNoProof = await createOrder(seedOrder, item, 'gcash', 'test:e2e core gcash no proof');
  assert(gcNoProof?.data?.order_status === 'pending_approval', 'GCash should start pending_approval');
  console.log('✅ GCash create rule passed');

  const gcWithProof = await createOrder(seedOrder, item, 'gcash', 'test:e2e core gcash with proof');

  const codUpload = await uploadProof(codOrder.orderId);
  assert(codUpload === 400, `Expected COD proof upload to fail with 400, got ${codUpload}`);
  console.log('✅ COD proof upload rejection passed');

  const gcUpload = await uploadProof(gcWithProof.orderId);
  assert(gcUpload === 200, `Expected GCash proof upload to succeed with 200, got ${gcUpload}`);
  console.log('✅ GCash proof upload passed');

  const noProofPaid = await requestJson(`${BASE_URL}/api/orders/${gcNoProof.orderId}/payment-status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_status: 'paid' })
  });
  assert(noProofPaid.res.status === 400, `Expected paid-without-proof to fail with 400, got ${noProofPaid.res.status}`);
  console.log('✅ Paid-without-proof validation passed');

  const paidWithProof = await requestJson(`${BASE_URL}/api/orders/${gcWithProof.orderId}/payment-status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_status: 'paid', verification_note: 'E2E core paid check' })
  });
  assert(paidWithProof.res.ok && paidWithProof.data?.data?.payment_status === 'paid', 'Failed to mark paid with proof');
  assert(paidWithProof.data?.data?.order_status === 'confirmed', 'Paid GCash should move order to confirmed');
  console.log('✅ Paid-with-proof transition passed');

  const refundAttempt = await requestJson(`${BASE_URL}/api/orders/${gcWithProof.orderId}/payment-status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_status: 'refunded' })
  });
  assert(refundAttempt.res.status === 400, `Expected refund block with 400, got ${refundAttempt.res.status}`);
  console.log('✅ Non-refundable policy block passed');

  const buyerCancel = await requestJson(`${BASE_URL}/api/orders/${gcWithProof.orderId}/cancel-by-buyer`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancellation_reason: 'E2E buyer cancel check' })
  });
  assert(buyerCancel.res.ok, 'Buyer cancellation failed after paid GCash');
  assert(buyerCancel.data?.data?.payment_status === 'paid', 'Paid GCash should remain paid after cancellation');
  assert(buyerCancel.data?.data?.order_status === 'buyer_cancelled', 'Order should move to buyer_cancelled');
  console.log('✅ Buyer cancellation policy transition passed');

  const finalRead = await requestJson(`${BASE_URL}/api/orders/${gcWithProof.orderId}`);
  assert(finalRead.res.ok && finalRead.data?.success, 'Final order read failed');
  const notes = String(finalRead.data?.data?.admin_notes || '');
  assert(notes.toLowerCase().includes('non-refundable'), 'Policy note missing in admin_notes');
  console.log('✅ Policy note persistence passed');

  console.log('🎉 E2E core flow checks PASSED');
}

main().catch((error) => {
  console.error('❌ E2E core flow checks FAILED:', error.message);
  process.exit(1);
});
