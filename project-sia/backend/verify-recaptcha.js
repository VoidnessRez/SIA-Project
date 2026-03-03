import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.post('/api/verify-recaptcha', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'missing token' });

    const secret = process.env.RECAPTCHA_SECRET;
    if (!secret) return res.status(500).json({ success: false, error: 'server not configured (RECAPTCHA_SECRET missing)' });

    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    const r = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body: params });
    const json = await r.json();

    // Forward the verification result to the client
    return res.json(json);
  } catch (err) {
    console.error('verify-recaptcha error', err);
    return res.status(500).json({ success: false, error: 'verification failed' });
  }
});

// Start server only when this file is the main module
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
if (import.meta.url === `file:///${process.argv[1]}` || import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => console.log('reCAPTCHA verifier listening on', PORT));
}

export default app;
