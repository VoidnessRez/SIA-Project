import express from 'express';
import {
  getStockReleases,
  createStockRelease,
  approveStockRelease,
  processStockRelease,
  cancelStockRelease,
  getStockReleaseStats
} from '../controllers/stockReleaseController.js';

const router = express.Router();

// Get all stock releases
router.get('/', getStockReleases);

// Get statistics
router.get('/stats', getStockReleaseStats);

// Create new stock release
router.post('/create', createStockRelease);

// Approve stock release
router.put('/:id/approve', approveStockRelease);

// Process and release stock
router.put('/:id/release', processStockRelease);

// Cancel stock release
router.put('/:id/cancel', cancelStockRelease);

export default router;
