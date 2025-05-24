const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const upload = require('../config/multer');

// Middleware для логирования запросов (только в режиме разработки)
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🛍️ Products Route: ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Публичные роуты (доступны всем)
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/search', productController.searchProducts);
router.get('/popular', productController.getPopularProducts);
router.get('/new', productController.getNewProducts);
router.get('/:id', productController.getProduct);

// Защищенные роуты (только для админов)
router.post('/', 
  authMiddleware, 
  adminMiddleware, 
  upload.array('images', 10), // Используем upload напрямую
  productController.createProduct
);

router.put('/:id', 
  authMiddleware, 
  adminMiddleware, 
  upload.array('images', 10), // Используем upload напрямую
  productController.updateProduct
);

router.delete('/:id', 
  authMiddleware, 
  adminMiddleware, 
  productController.deleteProduct
);

module.exports = router;