// config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем папку uploads если её нет
const uploadDir = 'uploads/products';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Создана папка для загрузок:', uploadDir);
}

// Конфигурация хранилища
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Создаем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const name = file.fieldname + '-' + uniqueSuffix + ext;
    
    console.log('📎 Сохранение файла:', name);
    cb(null, name);
  }
});

// Фильтр файлов - только изображения
const fileFilter = (req, file, cb) => {
  console.log('🔍 Проверка файла:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });

  // Разрешенные типы MIME
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp'
  ];

  // Разрешенные расширения
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
  
  const mimetype = allowedMimeTypes.includes(file.mimetype);
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    console.log('✅ Файл прошел проверку:', file.originalname);
    return cb(null, true);
  } else {
    console.log('❌ Файл не прошел проверку:', {
      file: file.originalname,
      mimetype: file.mimetype,
      expectedTypes: allowedMimeTypes
    });
    cb(new Error(`Недопустимый тип файла. Разрешены только изображения: ${allowedMimeTypes.join(', ')}`));
  }
};

// Основная конфигурация multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB максимальный размер файла
    files: 10, // Максимум 10 файлов за раз
    fieldSize: 2 * 1024 * 1024 // 2MB для текстовых полей
  },
  fileFilter: fileFilter
});

// Middleware для обработки ошибок multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ Ошибка Multer:', err);
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          message: 'Размер файла превышает допустимый лимит (5MB)',
          error: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          message: 'Превышено максимальное количество файлов (10)',
          error: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          message: 'Неожиданное поле файла',
          error: 'UNEXPECTED_FIELD'
        });
      case 'LIMIT_FIELD_KEY':
        return res.status(400).json({
          message: 'Слишком длинное имя поля',
          error: 'FIELD_NAME_TOO_LONG'
        });
      case 'LIMIT_FIELD_VALUE':
        return res.status(400).json({
          message: 'Слишком большое значение поля',
          error: 'FIELD_VALUE_TOO_LONG'
        });
      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          message: 'Слишком много полей',
          error: 'TOO_MANY_FIELDS'
        });
      default:
        return res.status(400).json({
          message: 'Ошибка загрузки файла',
          error: err.code
        });
    }
  } else if (err) {
    console.error('❌ Ошибка загрузки файла:', err);
    return res.status(400).json({
      message: err.message || 'Ошибка загрузки файла',
      error: 'UPLOAD_ERROR'
    });
  }
  
  next();
};

// Middleware для логирования успешной загрузки
const logSuccessfulUpload = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    console.log('✅ Успешно загружено файлов:', req.files.length);
    req.files.forEach((file, index) => {
      console.log(`📎 Файл ${index + 1}:`, {
        original: file.originalname,
        saved: file.filename,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.mimetype
      });
    });
  }
  next();
};

// Утилитарные функции
const utils = {
  // Проверить, является ли файл изображением
  isImage: (filename) => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    return imageExtensions.test(filename);
  },

  // Получить размер файла в человекочитаемом формате
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Получить информацию о загруженных файлах
  getFileInfo: (files) => {
    if (!files || !Array.isArray(files)) return [];
    
    return files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      size: utils.formatFileSize(file.size),
      mimetype: file.mimetype,
      path: file.path,
      url: `/uploads/products/${file.filename}`
    }));
  },

  // Удалить файл
  deleteFile: (filename) => {
    const filePath = path.join(__dirname, '../uploads/products', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ Файл удален:', filename);
      return true;
    }
    return false;
  }
};

// Экспортируем основной upload объект
module.exports = upload;

// Дополнительные экспорты
module.exports.handleMulterError = handleMulterError;
module.exports.logSuccessfulUpload = logSuccessfulUpload;
module.exports.utils = utils;