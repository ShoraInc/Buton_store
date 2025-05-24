// components/ProductModal/ProductModal.js
import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, AlertCircle, Check } from 'lucide-react';
import { productsAPI, uploadAPI } from '../../services/api';

const ProductModal = ({
  isOpen,
  onClose,
  product = null,
  onSuccess
}) => {
  const isEdit = !!product;

  // Состояние формы
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    category: 'Комбо',
    inStock: '',
    isNew: false,
    isReady: true,
    isBudget: false,
    tags: []
  });

  // Состояние изображений
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesPreviews, setImagesPreviews] = useState([]);

  // Состояние UI
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  // Категории продуктов
  const categories = [
    'Комбо',
    'Сборные букеты',
    'Композиции',
    'Розы',
    'Комнатные растения',
    'Сладости',
    'Игрушки'
  ];

  // Инициализация формы при редактировании
  useEffect(() => {
    if (isEdit && product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        discountPrice: product.discountPrice || '',
        category: product.category || 'Комбо',
        inStock: product.inStock || '',
        isNew: product.isNew || false,
        isReady: product.isReady !== undefined ? product.isReady : true,
        isBudget: product.isBudget || false,
        tags: product.tags || []
      });

      // Устанавливаем существующие изображения
      if (product.images && Array.isArray(product.images)) {
        setImages(product.images);
      }
    } else {
      // Сброс формы для создания нового продукта
      resetForm();
    }
  }, [isEdit, product]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      discountPrice: '',
      category: 'Комбо',
      inStock: '',
      isNew: false,
      isReady: true,
      isBudget: false,
      tags: []
    });
    setImages([]);
    setNewImages([]);
    setImagesPreviews([]);
    setErrors({});
    setAlert({ show: false, type: '', message: '' });
  };

  // Обработка изменений в форме
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Очистка ошибки для данного поля
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Обработка загрузки новых изображений
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Проверка типов файлов
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      showAlert('error', 'Разрешены только изображения (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Проверка размера файлов (5MB макс)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      showAlert('error', 'Размер файла не должен превышать 5MB');
      return;
    }

    try {
      setUploadingImages(true);

      // Загружаем изображения на сервер
      const response = await uploadAPI.uploadImages(files);
      const uploadedImages = response.data.images;

      // Добавляем новые изображения к существующим
      setImages(prev => [...prev, ...uploadedImages.map(img => img.filename)]);

      showAlert('success', `Загружено ${uploadedImages.length} изображений`);

    } catch (error) {
      console.error('Ошибка загрузки изображений:', error);
      showAlert('error', 'Ошибка загрузки изображений');
    } finally {
      setUploadingImages(false);
      e.target.value = ''; // Сбрасываем input
    }
  };

  // Удаление изображения
  const handleRemoveImage = async (imageFilename, index) => {
    try {
      // Если это новое изображение (уже на сервере), удаляем его
      if (images.includes(imageFilename)) {
        await uploadAPI.deleteImage(imageFilename);
      }

      // Удаляем из списка
      setImages(prev => prev.filter((img, i) => i !== index));

    } catch (error) {
      console.error('Ошибка удаления изображения:', error);
      showAlert('error', 'Ошибка удаления изображения');
    }
  };

  // Валидация формы
  const validateForm = () => {
    const newErrors = {};
    const price = parseFloat(formData.price);
    const discountPrice = parseFloat(formData.discountPrice)

    if (!formData.name.trim()) {
      newErrors.name = 'Название товара обязательно';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Название должно быть не менее 3 символов';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Цена должна быть больше 0';
    }

    if (formData.discountPrice && !isNaN(discountPrice) && discountPrice >= price) {
      newErrors.discountPrice = 'Цена со скидкой должна быть меньше обычной цены';
    }

    if (!formData.inStock || formData.inStock < 0) {
      newErrors.inStock = 'Количество на складе не может быть отрицательным';
    }

    if (!formData.category) {
      newErrors.category = 'Выберите категорию';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showAlert('error', 'Пожалуйста, исправьте ошибки в форме');
      return;
    }

    try {
      setLoading(true);

      // Подготавливаем данные для отправки
      const submitData = new FormData();

      // Добавляем основные поля
      Object.keys(formData).forEach(key => {
        if (key === 'tags') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      });

      // Добавляем изображения
      if (images.length > 0) {
        submitData.append('images', JSON.stringify(images));
      }

      let response;
      if (isEdit) {
        response = await productsAPI.update(product.id, submitData);
      } else {
        response = await productsAPI.create(submitData);
      }

      showAlert('success', response.data.message);

      // Вызываем callback успеха
      if (onSuccess) {
        onSuccess(response.data.product);
      }

      // Закрываем модальное окно через небольшую задержку
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Ошибка сохранения товара:', error);
      const errorMessage = error.response?.data?.message || 'Ошибка сохранения товара';
      showAlert('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: '', message: '' });
    }, 5000);
  };

  const getImageUrl = (filename) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    return `${baseUrl}/uploads/products/${filename}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold">
            {isEdit ? 'Редактировать товар' : 'Добавить новый товар'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Alert */}
        {alert.show && (
          <div className={`mx-6 mt-4 p-4 rounded-lg flex items-center gap-2 ${alert.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
            {alert.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            {alert.message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Левая колонка - основная информация */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-4">Основная информация</h4>

              {/* Название */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название товара *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Введите название товара"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Описание */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Описание товара"
                />
              </div>

              {/* Категория */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Категория *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                )}
              </div>

              {/* Цены */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цена * (₸)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="0"
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цена со скидкой (₸)
                  </label>
                  <input
                    type="number"
                    name="discountPrice"
                    value={formData.discountPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.discountPrice ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="0"
                  />
                  {errors.discountPrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.discountPrice}</p>
                  )}
                </div>
              </div>

              {/* Количество на складе */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Количество на складе *
                </label>
                <input
                  type="number"
                  name="inStock"
                  value={formData.inStock}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.inStock ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="0"
                />
                {errors.inStock && (
                  <p className="text-red-500 text-sm mt-1">{errors.inStock}</p>
                )}
              </div>

              {/* Флаги товара */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Свойства товара
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isNew"
                      checked={formData.isNew}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm">Бюджетный</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isReady"
                      checked={formData.isReady}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm">Готов к продаже</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Правая колонка - изображения */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-4">Изображения товара</h4>

              {/* Загрузка изображений */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Добавить изображения
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImages}
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {uploadingImages
                        ? 'Загрузка...'
                        : 'Нажмите или перетащите файлы сюда'
                      }
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF до 5MB
                    </p>
                  </label>
                </div>
              </div>

              {/* Превью изображений */}
              {images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Загруженные изображения ({images.length})
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={getImageUrl(image)}
                            alt={`Изображение ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCAzMkM0My4zNzI2IDMyIDM4IDI2LjYyNzQgMzggMjBDMzggMTMuMzcyNiA0My4zNzI2IDggNTAgOEM1Ni42Mjc0IDggNjIgMTMuMzcyNiA2MiAyMEM2MiAyNi42Mjc0IDU2LjYyNzQgMzIgNTAgMzJaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yNCA3MkMyNCA1OC43NDUyIDM0Ljc0NTIgNDggNDggNDhDNjEuMjU0OCA0OCA3MiA1OC43NDUyIDcyIDcyVjg4SDI0Vjc4WiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K';
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(image, index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Удалить изображение"
                        >
                          <Trash2 size={14} />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            Главное
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Первое изображение будет использоваться как главное
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEdit ? 'Сохранение...' : 'Создание...'}
                </>
              ) : (
                isEdit ? 'Сохранить изменения' : 'Создать товар'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;