import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import productsRouter from './routes/products.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);

// Simple endpoint to verify reCAPTCHA tokens server-side
app.post('/api/verify-recaptcha', async (req, res) => {
  const token = req.body && req.body.token;
  if (!token) return res.status(400).json({ success: false, error: 'missing token' });

  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) return res.status(500).json({ success: false, error: 'recaptcha secret not configured' });

  try {
    const fetch = (await import('node-fetch')).default;
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: params
    });
    const data = await resp.json();
    return res.json(data);
  } catch (err) {
    console.error('Error verifying recaptcha:', err);
    return res.status(502).json({ success: false, error: 'recaptcha verification failed' });
  }
});

// Default port for backend is 5174 (as requested)
const port = process.env.PORT || 5174;
const server = app.listen(port, () => {
  // friendly emoji-rich startup logs for easier debugging
  console.log(`\n🚀  Backend starting...`);
  console.log(`✅  Listening on http://localhost:${port}`);
  console.log(`🔒  Supabase URL: ${process.env.SUPABASE_URL ? 'set' : 'NOT SET'}`);
  console.log(`🧭  Routes:`);
  console.log(`   - GET /api/products`);
  console.log(`   - POST /api/products (protected - add auth middleware)`);
  console.log(`   - POST /api/auth/signup`);
  console.log(`   - POST /api/auth/login`);
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
