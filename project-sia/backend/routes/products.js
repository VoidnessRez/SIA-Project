import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

const ensureAdmin = (req, res) => {
  const user = req.user;
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'forbidden' });
    return false;
  }
  return true;
};

// Public: list products (RLS policies on Supabase should allow public read or adjust accordingly)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch products' });
  }
});

// Public: get single product by id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid product id' });
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return res.status(404).json({ error });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch product' });
  }
});

// Protected: create product (example, requires auth middleware to set req.user.role)
router.post('/', async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const body = req.body;
    const { data, error } = await supabase.from('products').insert([body]).select();
    if (error) return res.status(400).json({ error });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create product' });
  }
});

// Protected: update product
router.put('/:id', async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid product id' });
    }

    const { data, error } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', id)
      .select();

    if (error) return res.status(400).json({ error });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update product' });
  }
});

// Protected: delete product
router.delete('/:id', async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid product id' });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) return res.status(400).json({ error });
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to delete product' });
  }
});

export default router;
