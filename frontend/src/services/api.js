// services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Создаем основной экземпляр axios
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Логирование запросов в режиме разработки
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ответов
api.interceptors.response.use(
  (response) => {
    // Логирование успешных ответов в режиме разработки
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error);

    if (error.response?.status === 401) {
      // Токен недействителен или истек
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('authStateChanged'));

      // Перенаправляем на главную, если не на ней
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

// API для работы с продуктами
export const productsAPI = {
  // Получить все продукты с фильтрами и пагинацией
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Добавляем все параметры в query string
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `/products?${queryString}` : '/products';

    return api.get(url);
  },

  // Получить продукт по ID
  getById: (id) => {
    return api.get(`/products/${id}`);
  },

  // Создать новый продукт
  create: (productData) => {
    // Если данные уже в FormData, отправляем как есть
    if (productData instanceof FormData) {
      return api.post('/products', productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    // Иначе создаем FormData
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      if (productData[key] !== undefined && productData[key] !== null) {
        if (key === 'tags' && Array.isArray(productData[key])) {
          formData.append(key, JSON.stringify(productData[key]));
        } else {
          formData.append(key, productData[key]);
        }
      }
    });

    return api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Обновить продукт
  update: (id, productData) => {
    // Если данные уже в FormData, отправляем как есть
    if (productData instanceof FormData) {
      return api.put(`/products/${id}`, productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    // Иначе создаем FormData
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      if (productData[key] !== undefined && productData[key] !== null) {
        if (key === 'tags' && Array.isArray(productData[key])) {
          formData.append(key, JSON.stringify(productData[key]));
        } else if (key === 'images' && Array.isArray(productData[key])) {
          formData.append(key, JSON.stringify(productData[key]));
        } else {
          formData.append(key, productData[key]);
        }
      }
    });

    return api.put(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Удалить продукт (мягкое удаление)
  delete: (id) => {
    return api.delete(`/products/${id}`);
  },

  // Получить список категорий
  getCategories: () => {
    return api.get('/products/categories');
  },

  // Поиск продуктов
  search: (query, filters = {}) => {
    const params = {
      search: query,
      ...filters
    };
    return api.get('/products', { params });
  }
};

// API для загрузки файлов
export const uploadAPI = {
  // Загрузить изображения
  uploadImages: (files) => {
    const formData = new FormData();

    // Добавляем файлы в FormData
    if (Array.isArray(files)) {
      files.forEach((file) => {
        formData.append('images', file);
      });
    } else {
      formData.append('images', files);
    }

    return api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 секунд для загрузки файлов
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`📤 Upload Progress: ${percentCompleted}%`);
      }
    });
  },

  // Удалить изображение
  deleteImage: (filename) => {
    return api.delete(`/upload/images/${filename}`);
  },

  // Получить URL изображения
  getImageUrl: (filename) => {
    return `${API_BASE_URL}/uploads/products/${filename}`;
  }
};

// API для авторизации
export const authAPI = {
  // Регистрация
  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  // Вход
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  // Получить профиль пользователя
  getProfile: () => {
    return api.get('/auth/profile');
  },

  // Обновить профиль
  updateProfile: (userData) => {
    return api.put('/auth/profile', userData);
  },

  // Изменить пароль
  changePassword: (passwordData) => {
    return api.put('/auth/change-password', passwordData);
  }
};

// API для корзины
export const cartAPI = {
  // Получить корзину пользователя
  getCart: () => {
    return api.get('/cart');
  },

  // Добавить товар в корзину
  addToCart: (productId, quantity = 1) => {
    return api.post('/cart/add', { productId, quantity });
  },

  // Обновить количество товара в корзине
  updateCartItem: (itemId, quantity) => {
    return api.put('/cart/update', { itemId, quantity });
  },

  // Удалить товар из корзины
  removeFromCart: (itemId) => {
    return api.delete(`/cart/remove/${itemId}`);
  },

  // Очистить корзину
  clearCart: () => {
    return api.delete('/cart/clear');
  },

  // Получить количество товаров в корзине
  getCartCount: () => {
    return api.get('/cart/count');
  }
};

// API для избранного
export const favoritesAPI = {
  // Получить избранные товары
  getFavorites: () => {
    return api.get('/favorites');
  },

  // Добавить в избранное
  addToFavorites: (productId) => {
    return api.post('/favorites/add', { productId });
  },

  // Удалить из избранного
  removeFromFavorites: (productId) => {
    return api.delete(`/favorites/remove/${productId}`);
  },

  // Проверить, находится ли товар в избранном
  checkFavorite: (productId) => {
    return api.get(`/favorites/check/${productId}`);
  }
};

// orders API service
export const ordersAPI = {
  // ============ ПОЛЬЗОВАТЕЛЬСКИЕ МЕТОДЫ ============
  // Получить заказы пользователя
  getUserOrders: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/orders?${queryParams}`);
  },

  // Создать новый заказ
  createOrder: (orderData) => {
    return api.post('/orders', orderData);
  },

    // Создать новый заказ
  reorderOrder: (id) => {
    return api.post(`/orders/${id}/reorder`);
  },
  
  // Получить заказ по ID
  getOrder: (orderId) => {
    return api.get(`/orders/${orderId}`);
  },

  // Отменить заказ
  cancelOrder: (orderId) => {
    return api.put(`/orders/${orderId}/cancel`);
  },

  // ============ АДМИНСКИЕ МЕТОДЫ ============
  // Получить все заказы (для админа) с фильтрацией и пагинацией
  getAllOrders: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/admin/orders?${queryParams}`);
  },

  // Получить детали заказа (для админа)
  getAdminOrderById: (orderId) => {
    return api.get(`/admin/orders/${orderId}`);
  },

  // Обновить статус заказа (для админа)
  updateOrderStatus: (orderId, status) => {
    return api.put(`/admin/orders/${orderId}/status`, { status });
  },

  // Получить общую сумму заказов
  getOrdersTotalSum: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/admin/orders/total-sum?${queryParams}`);
  },

  // Получить статистику заказов
  getOrdersStatistics: () => {
    return api.get('/admin/orders/statistics');
  },

  // Получить сумму заказов по периодам
  getOrdersSumByPeriod: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/admin/orders/sum-by-period?${queryParams}`);
  },

  // ============ ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ============
  // Поиск заказов (для админа)
  searchOrders: (searchQuery, filters = {}) => {
    const params = {
      search: searchQuery,
      ...filters
    };
    return ordersAPI.getAllOrders(params);
  },

  // Фильтрация заказов по статусу
  getOrdersByStatus: (status, params = {}) => {
    return ordersAPI.getAllOrders({
      status,
      ...params
    });
  },

  // Получить заказы за период
  getOrdersByDateRange: (startDate, endDate, params = {}) => {
    return ordersAPI.getAllOrders({
      startDate,
      endDate,
      ...params
    });
  }
};

// Утилиты для работы с API
export const apiUtils = {
  // Получить полный URL для изображения
  getImageUrl: (filename) => {
    if (!filename) return null;
    return `${API_BASE_URL}/uploads/products/${filename}`;
  },

  // Обработать ошибку API
  handleError: (error) => {
    if (error.response) {
      // Сервер ответил с кодом ошибки
      const message = error.response.data?.message || 'Произошла ошибка на сервере';
      const status = error.response.status;

      console.error(`API Error ${status}:`, message);
      return { message, status };
    } else if (error.request) {
      // Запрос был отправлен, но ответа не получено
      console.error('Network Error:', error.request);
      return { message: 'Ошибка сети. Проверьте подключение к интернету.', status: 0 };
    } else {
      // Произошла ошибка при настройке запроса
      console.error('Request Error:', error.message);
      return { message: error.message || 'Произошла неизвестная ошибка', status: -1 };
    }
  },

  // Проверить доступность API
  checkHealth: () => {
    return api.get('/health').catch(() => {
      throw new Error('API недоступно');
    });
  }
};

// API для работы с пользователями
// API для работы с пользователями
export const usersAPI = {
  // 📋 Получить всех пользователей с базовой статистикой заказов
  getAll: () => {
    return api.get('/users');
  },

  // 👤 Получить одного пользователя по ID с детальной статистикой
  getById: (id) => {
    return api.get(`/users/${id}`);
  },

  // 🔑 Получить данные текущего авторизованного пользователя
  getCurrentUser: () => {
    return api.get('/users/me');
  },

  // ➕ Создать нового пользователя
  create: (userData) => {
    return api.post('/users', userData);
  },

  // ✏️ Обновить пользователя
  update: (id, userData) => {
    return api.put(`/users/${id}`, userData);
  },

  // 🗑️ Удалить пользователя
  delete: (id) => {
    return api.delete(`/users/${id}`);
  },

  // 🏆 Получить топ покупателей
  getTopBuyers: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/users/top-buyers${queryParams ? `?${queryParams}` : ''}`);
  },

  // 📊 Получить общую статистику по пользователям
  getStatistics: () => {
    return api.get('/users/statistics');
  },

  // 🔄 Изменить роль пользователя
  changeRole: (id, role) => {
    return api.put(`/users/${id}`, { role });
  },

  // 🔐 Изменить статус активности пользователя
  toggleStatus: (id, isActive) => {
    return api.put(`/users/${id}`, { isActive });
  },

  // 🔒 Сменить пароль пользователя
  changePassword: (id, password) => {
    return api.put(`/users/${id}`, { password });
  }
};

// Экспорт главного экземпляра axios
export default api;