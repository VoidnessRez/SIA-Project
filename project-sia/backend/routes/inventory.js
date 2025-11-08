import express from 'express';
import {
  // Spare Parts
  getAllSpareParts,
  getSparePartById,
  createSparePart,
  updateSparePart,
  deleteSparePart,
  // Accessories
  getAllAccessories,
  getAccessoryById,
  createAccessory,
  updateAccessory,
  deleteAccessory,
  // Combined Products
  getAllProducts,
  // Brands & Types
  getAllBrands,
  getPartTypes,
  // Stock & Transactions
  getLowStockItems,
  createInventoryTransaction,
  getInventoryTransactions
} from '../controllers/inventoryController.js';

const router = express.Router();

// =====================================================
// SPARE PARTS ROUTES
// =====================================================
router.get('/spare-parts', getAllSpareParts);
router.get('/spare-parts/:id', getSparePartById);
router.post('/spare-parts', createSparePart);
router.put('/spare-parts/:id', updateSparePart);
router.delete('/spare-parts/:id', deleteSparePart);

// =====================================================
// ACCESSORIES ROUTES
// =====================================================
router.get('/accessories', getAllAccessories);
router.get('/accessories/:id', getAccessoryById);
router.post('/accessories', createAccessory);
router.put('/accessories/:id', updateAccessory);
router.delete('/accessories/:id', deleteAccessory);

// =====================================================
// COMBINED PRODUCTS (for customer ordering system)
// =====================================================
router.get('/products', getAllProducts);

// =====================================================
// BRANDS & TYPES
// =====================================================
router.get('/brands', getAllBrands);
router.get('/part-types', getPartTypes);

// =====================================================
// STOCK MANAGEMENT
// =====================================================
router.get('/low-stock', getLowStockItems);

// =====================================================
// INVENTORY TRANSACTIONS
// =====================================================
router.get('/transactions', getInventoryTransactions);
router.post('/transactions', createInventoryTransaction);

export default router;
