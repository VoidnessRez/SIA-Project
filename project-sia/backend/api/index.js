import app from '../index.js';

// Vercel expects a default export with (req, res) signature.
export default function handler(req, res) {
  return app(req, res);
}
