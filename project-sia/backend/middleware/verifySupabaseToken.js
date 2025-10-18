import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { supabase } from '../supabaseClient.js';

dotenv.config();

// Basic middleware to verify Supabase JWT from Authorization header (Bearer)
export default async function verifySupabaseToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No authorization header' });

  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Malformed authorization header' });

  const token = parts[1];

  try {
    // Option A: verify via Supabase /auth API or decode JWT locally if you have the public key
    // We'll use Supabase's API to get user info for simplicity
    const { data: user, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // attach user to request
    req.user = user.user || user;
    next();
  } catch (err) {
    console.error('verifySupabaseToken error', err);
    return res.status(401).json({ error: 'Token verification failed' });
  }
}
