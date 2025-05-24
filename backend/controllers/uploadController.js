// controllers/uploadController.js
const path = require('path');
const fs = require('fs');
const util = require('util');

// Промисифицируем fs методы для async/await
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);

const uploadController = {
  // Загрузить изображения
  uploadImages: async (req, res) => {
    try {
      console.log('📤 Загрузка изображений:', {
        filesCount: req.files?.length || 0,
        user: req.user?.email
      });

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Файлы не загружены' });
      }

      // Проверяем типы файлов
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const invalidFiles = req.files.filter(file => !allowedTypes.includes(file.mimetype));
      
      if (invalidFiles.length > 0) {
        // Удаляем неправильные файлы
        invalidFiles.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            console.error('Ошибка удаления файла:', error);
          }
        });
        
        return res.status(400).json({ 
          message: 'Разрешены только изображения (JPEG, PNG, GIF, WebP)',
          invalidFiles: invalidFiles.map(f => f.originalname)
        });
      }

      // Формируем информацию о загруженных файлах
      const imageUrls = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/products/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString()
      }));

      console.log('✅ Изображения успешно загружены:', imageUrls.map(img => img.filename));

      res.json({
        message: `${imageUrls.length} изображений успешно загружено`,
        images: imageUrls,
        count: imageUrls.length
      });
    } catch (error) {
      console.error('❌ Ошибка загрузки изображений:', error);
      res.status(500).json({ 
        message: 'Ошибка загрузки изображений', 
        error: error.message 
      });
    }
  },

  // Удалить изображение
  deleteImage: async (req, res) => {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        return res.status(400).json({ message: 'Имя файла не указано' });
      }

      console.log('🗑️ Удаление изображения:', filename);

      const filePath = path.join(__dirname, '../uploads/products', filename);

      // Проверяем существование файла
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Файл не найден' });
      }

      // Проверяем, что это действительно изображение
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const fileExtension = path.extname(filename).toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ message: 'Можно удалять только изображения' });
      }

      // Удаляем файл
      await unlink(filePath);
      
      console.log('✅ Изображение успешно удалено:', filename);

      res.json({ 
        message: 'Изображение успешно удалено',
        filename: filename 
      });
    } catch (error) {
      console.error('❌ Ошибка удаления изображения:', error);
      
      if (error.code === 'ENOENT') {
        return res.status(404).json({ message: 'Файл не найден' });
      }
      
      res.status(500).json({ 
        message: 'Ошибка удаления изображения', 
        error: error.message 
      });
    }
  },

  // Получить информацию об изображении
  getImageInfo: async (req, res) => {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        return res.status(400).json({ message: 'Имя файла не указано' });
      }

      const filePath = path.join(__dirname, '../uploads/products', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Файл не найден' });
      }

      const stats = await stat(filePath);
      const fileExtension = path.extname(filename).toLowerCase();
      
      // Определяем MIME тип по расширению
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };

      const imageInfo = {
        filename: filename,
        size: stats.size,
        mimetype: mimeTypes[fileExtension] || 'application/octet-stream',
        created: stats.birthtime,
        modified: stats.mtime,
        url: `/uploads/products/${filename}`,
        isImage: Object.keys(mimeTypes).includes(fileExtension)
      };

      res.json({
        message: 'Информация об изображении',
        image: imageInfo
      });
    } catch (error) {
      console.error('❌ Ошибка получения информации об изображении:', error);
      res.status(500).json({ 
        message: 'Ошибка получения информации об изображении', 
        error: error.message 
      });
    }
  },

  // Получить список всех изображений
  listImages: async (req, res) => {
    try {
      const uploadsDir = path.join(__dirname, '../uploads/products');
      
      // Создаем папку если её нет
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        return res.json({
          message: 'Список изображений',
          images: [],
          count: 0
        });
      }

      const files = await readdir(uploadsDir);
      
      // Фильтруем только изображения
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return allowedExtensions.includes(ext);
      });

      // Получаем информацию о каждом файле
      const imagesInfo = await Promise.all(
        imageFiles.map(async (filename) => {
          try {
            const filePath = path.join(uploadsDir, filename);
            const stats = await stat(filePath);
            const fileExtension = path.extname(filename).toLowerCase();
            
            const mimeTypes = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp'
            };

            return {
              filename: filename,
              size: stats.size,
              mimetype: mimeTypes[fileExtension],
              created: stats.birthtime,
              modified: stats.mtime,
              url: `/uploads/products/${filename}`
            };
          } catch (error) {
            console.error(`Ошибка обработки файла ${filename}:`, error);
            return null;
          }
        })
      );

      // Убираем null значения (файлы с ошибками)
      const validImages = imagesInfo.filter(img => img !== null);

      // Сортируем по дате создания (новые сначала)
      validImages.sort((a, b) => new Date(b.created) - new Date(a.created));

      res.json({
        message: 'Список изображений',
        images: validImages,
        count: validImages.length
      });
    } catch (error) {
      console.error('❌ Ошибка получения списка изображений:', error);
      res.status(500).json({ 
        message: 'Ошибка получения списка изображений', 
        error: error.message 
      });
    }
  },

  // Очистить устаревшие изображения (вспомогательная функция)
  cleanupOldImages: async (req, res) => {
    try {
      const uploadsDir = path.join(__dirname, '../uploads/products');
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 дней в миллисекундах
      const now = Date.now();

      if (!fs.existsSync(uploadsDir)) {
        return res.json({
          message: 'Папка загрузок не существует',
          deletedCount: 0
        });
      }

      const files = await readdir(uploadsDir);
      let deletedCount = 0;
      const errors = [];

      for (const filename of files) {
        try {
          const filePath = path.join(uploadsDir, filename);
          const stats = await stat(filePath);
          
          // Если файл старше maxAge, удаляем его
          if (now - stats.mtime.getTime() > maxAge) {
            await unlink(filePath);
            deletedCount++;
            console.log(`🗑️ Удален устаревший файл: ${filename}`);
          }
        } catch (error) {
          console.error(`Ошибка обработки файла ${filename}:`, error);
          errors.push({ filename, error: error.message });
        }
      }

      res.json({
        message: `Очистка завершена. Удалено ${deletedCount} файлов`,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('❌ Ошибка очистки старых изображений:', error);
      res.status(500).json({ 
        message: 'Ошибка очистки старых изображений', 
        error: error.message 
      });
    }
  }
};

module.exports = uploadController;