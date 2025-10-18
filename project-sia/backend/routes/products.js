import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Public: list products (RLS policies on Supabase should allow public read or adjust accordingly)
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Protected: create product (example, requires auth middleware to set req.user.role)
router.post('/', async (req, res) => {
  // Placeholder: integrate your auth middleware to check admin role
  const user = req.user;
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });

  const body = req.body;
  const { data, error } = await supabase.from('products').insert([body]);
  if (error) return res.status(400).json({ error });
  res.json(data);
});

export default router;
