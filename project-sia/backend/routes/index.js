import express from 'express';
import productsRouter from './products.js';

const router = express.Router();

router.use('/products', productsRouter);

export default router;
