import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import productsRouter from './routes/products.js';
import authRouter from './routes/auth.js';
import uploadRouter from './routes/upload.js';
import recaptchaRouter from './routes/recaptcha.js';
import inventoryRouter from './routes/inventory.js';
import ordersRouter from './routes/orders.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log('📦 Loading routes...');
app.use('/api/products', productsRouter);
console.log('   ✓ Products routes loaded');
app.use('/api/auth', authRouter);
console.log('   ✓ Auth routes loaded');
app.use('/api/upload', uploadRouter);
console.log('   ✓ Upload routes loaded');
app.use('/api/recaptcha', recaptchaRouter);
console.log('   ✓ reCAPTCHA routes loaded');
app.use('/api/inventory', inventoryRouter);
console.log('   ✓ Inventory routes loaded');
app.use('/api/orders', ordersRouter);
console.log('   ✓ Orders routes loaded');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    routes: {
      products: '/api/products',
      auth: '/api/auth',
      upload: '/api/upload',
      recaptcha: '/api/recaptcha/verify',
      inventory: '/api/inventory'
    }
  });
});

// Default port for backend is 5174 (as requested)
const port = process.env.PORT || 5174;
const server = app.listen(port, () => {
  // friendly emoji-rich startup logs for easier debugging
  console.log(`\n🚀  Backend starting...`);
  console.log(`✅  Listening on http://localhost:${port}`);
  console.log(`🔒  Supabase URL: ${process.env.SUPABASE_URL ? 'set' : 'NOT SET'}`);
  console.log(`🔐  reCAPTCHA Secret: ${process.env.RECAPTCHA_SECRET ? 'set ✓' : 'NOT SET ✗'}`);
  console.log(`🧭  Available Routes:`);
  console.log(`   📦 Products:`);
  console.log(`      - GET    /api/products`);
  console.log(`      - POST   /api/products (protected)`);
  console.log(`   🔐 Auth:`);
  console.log(`      - POST   /api/auth/login`);
  console.log(`      - POST   /api/auth/signup`);
  console.log(`      - PUT    /api/auth/profile/:userId`);
  console.log(`   📤 Upload:`);
  console.log(`      - POST   /api/upload/avatar`);
  console.log(`   🤖 reCAPTCHA:`);
  console.log(`      - POST   /api/recaptcha/verify`);
  console.log(`   📦 Inventory:`);
  console.log(`      - GET    /api/inventory/spare-parts`);
  console.log(`      - POST   /api/inventory/spare-parts (protected)`);
  console.log(`      - GET    /api/inventory/accessories`);
  console.log(`      - POST   /api/inventory/accessories (protected)`);
  console.log(`      - GET    /api/inventory/products`);
  console.log(`      - GET    /api/inventory/brands`);
  console.log(`      - GET    /api/inventory/part-types`);
  console.log(`      - GET    /api/inventory/low-stock`);
  console.log(`   🛒 Orders:`);
  console.log(`      - POST   /api/orders/create`);
  console.log(`      - GET    /api/orders`);
  console.log(`      - GET    /api/orders/:id`);
  console.log(`      - PUT    /api/orders/:id/status`);
  console.log(`   💚 Health:`);
  console.log(`      - GET    /api/health`);
  console.log(`\n💡 Tip: Visit http://localhost:${port}/api/health to check server status`);
  console.log(`\n`);
});

// Graceful shutdown and unhandled error handlers
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down server...');
  server.close(() => {
    console.log('🟢 Server stopped.');
    process.exit(0);
  });
});
