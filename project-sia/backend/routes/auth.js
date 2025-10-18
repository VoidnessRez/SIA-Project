import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// POST /api/auth/signup
// body: { username, email, password }
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ error: 'username, email and password are required' });

  try {
    // check existing username (case-insensitive)
    const { data: existingByUsername, error: ue } = await supabase
      .from('backend.app_auth')
      .select('id')
      .ilike('username', username)
      .limit(1);
    if (ue) throw ue;
    if (existingByUsername && existingByUsername.length) return res.status(409).json({ error: 'username already exists' });

    // check existing email (case-insensitive)
    const { data: existingByEmail, error: ee } = await supabase
      .from('backend.app_auth')
      .select('id')
      .ilike('email', email)
      .limit(1);
    if (ee) throw ee;
    if (existingByEmail && existingByEmail.length) return res.status(409).json({ error: 'email already exists' });

    // insert (plaintext password intentionally for dev)
    const { data, error } = await supabase
      .from('backend.app_auth')
      .insert([{ username, email, password }])
      .select('id, username, email, created_at');

    if (error) return res.status(500).json({ error });
    return res.status(201).json({ user: data && data[0] });
  } catch (err) {
    console.error('signup error', err);
    return res.status(500).json({ error: 'signup failed' });
  }
});

// POST /api/auth/login
// body: { identifier, password } where identifier is username OR email
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) return res.status(400).json({ error: 'identifier and password are required' });

  try {
    // try matching by email or username (case-insensitive)
    const { data, error } = await supabase
      .from('backend.app_auth')
      .select('id, username, email, password, created_at')
      .or(`ilike(username,'${identifier}'),ilike(email,'${identifier}')`)
      .limit(1);

    if (error) throw error;
    if (!data || !data.length) return res.status(401).json({ error: 'invalid credentials' });

    const user = data[0];
    // plaintext comparison (development only)
    if (user.password !== password) return res.status(401).json({ error: 'invalid credentials' });

    // success - do NOT return password
    const { password: _p, ...safeUser } = user;
    return res.json({ user: safeUser });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'login failed' });
  }
});

export default router;
