// routes/upload.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const upload = require('../config/multer');

// Middleware для логирования запросов
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📤 Upload Route: ${req.method} ${req.originalUrl}`);
  }
  next();
});

// POST /api/upload/images - Загрузка изображений (только для админов)
router.post('/images', 
  authMiddleware, 
  adminMiddleware, 
  upload.array('images', 10), // Используем upload напрямую
  uploadController.uploadImages
);

// DELETE /api/upload/images/:filename - Удаление изображения
router.delete('/images/:filename', 
  authMiddleware, 
  adminMiddleware, 
  uploadController.deleteImage
);

// GET /api/upload/images/:filename - Получение информации об изображении
router.get('/images/:filename', 
  authMiddleware, 
  adminMiddleware, 
  uploadController.getImageInfo
);

// GET /api/upload/list - Получение списка всех изображений
router.get('/list', 
  authMiddleware, 
  adminMiddleware, 
  uploadController.listImages
);

module.exports = router;