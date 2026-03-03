import express from 'express';
import {
  getPriceHistory,
  getProductPriceHistory,
  getRecentPriceChanges,
  getPriceIncreases,
  getPriceDecreases,
  getPriceHistoryStats,
  createPriceHistoryEntry,
  deletePriceHistoryEntry
} from '../controllers/priceHistoryController.js';

const router = express.Router();

// Get all price history with filters
router.get('/', getPriceHistory);

// Get price history statistics
router.get('/stats', getPriceHistoryStats);

// Get recent price changes
router.get('/recent', getRecentPriceChanges);

// Get price increases
router.get('/increases', getPriceIncreases);

// Get price decreases
router.get('/decreases', getPriceDecreases);

// Get price history for specific product
router.get('/product/:type/:id', getProductPriceHistory);

// Create manual price history entry
router.post('/manual', createPriceHistoryEntry);

// Delete price history entry
router.delete('/:id', deletePriceHistoryEntry);

export default router;
