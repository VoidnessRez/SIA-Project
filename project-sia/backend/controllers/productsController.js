import { supabase } from '../supabaseClient.js';

export async function listProducts(req, res) {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return res.status(500).json({ error });
  res.json(data);
}

export async function createProduct(req, res) {
  const { body } = req;
  const { data, error } = await supabase.from('products').insert([body]);
  if (error) return res.status(400).json({ error });
  res.json(data);
}
