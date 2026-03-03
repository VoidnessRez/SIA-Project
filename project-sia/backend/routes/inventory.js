import express from 'express';
import {
  // spare parts
  getAllSpareParts,
  getSparePartById,
  createSparePart,
  updateSparePart,
  deleteSparePart,
  // accessories
  getAllAccessories,
  getAccessoryById,
  createAccessory,
  updateAccessory,
  deleteAccessory,
  // combined products
  getAllProducts,
  // brands and types
  getAllBrands,
  getPartTypes,
  // stock and transactions
  getLowStockItems,
  createInventoryTransaction,
  getInventoryTransactions
} from '../controllers/inventoryController.js';
import {
  getOverstockedItems,
  getOverstockStats,
  updateMaxStockLevel
} from '../controllers/overstockController.js';

const router = express.Router();


// --spare parts routes--

router.get('/spare-parts', getAllSpareParts);
router.get('/spare-parts/:id', getSparePartById);
router.post('/spare-parts', createSparePart);
router.put('/spare-parts/:id', updateSparePart);
router.delete('/spare-parts/:id', deleteSparePart);


// --accessories routes--
router.get('/accessories', getAllAccessories);
router.get('/accessories/:id', getAccessoryById);
router.post('/accessories', createAccessory);
router.put('/accessories/:id', updateAccessory);
router.delete('/accessories/:id', deleteAccessory);


// --combined products (for customer ordering system)--

router.get('/products', getAllProducts);


// --brands & types--
router.get('/brands', getAllBrands);
router.get('/part-types', getPartTypes);

// --stock management--
 


router.get('/low-stock', getLowStockItems);
router.get('/overstocked', getOverstockedItems);
router.get('/overstocked/stats', getOverstockStats);
router.put('/update-max-stock/:type/:id', updateMaxStockLevel);

// --inventory transactions--
router.get('/transactions', getInventoryTransactions);
router.post('/transactions', createInventoryTransaction);

export default router;
