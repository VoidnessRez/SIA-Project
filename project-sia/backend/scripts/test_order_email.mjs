import dotenv from 'dotenv';

dotenv.config({ path: './.env', override: true });

const { default: emailService } = await import('../services/emailService.js');
const targetEmail = process.argv[2] || process.env.TEST_EMAIL || 'khenardgwapo123@gmail.com';

const payload = {
  orderNumber: 'TEST-ORDER-001',
  customerName: 'Test User',
  customerEmail: targetEmail,
  items: [{ name: 'Test Item', sku: 'T-001', image: '⚙️', price: 100, quantity: 1 }],
  subtotal: 100,
  tax: 0,
  shippingFee: 0,
  discount: null,
  total: 100,
  paymentMethod: 'Cash on Delivery',
  timestamp: new Date().toISOString()
};

try {
  const result = await emailService.sendOrderReceipt(payload);
  console.log('RESULT', result);
} catch (e) {
  console.error('ORDER_EMAIL_ERROR', e?.message || e);
  process.exitCode = 1;
}
