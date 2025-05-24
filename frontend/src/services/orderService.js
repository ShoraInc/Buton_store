// services/orderService.js
import api from './api';

class OrderService {
  // Получить все заказы пользователя
  async getUserOrders() {
    try {
      console.log('📋 Загрузка заказов через api.js...');
      
      const response = await api.get('/orders');
      
      console.log('✅ Заказы успешно загружены:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка получения заказов:', error);
      
      // api.js уже обрабатывает 401 ошибки в интерцепторе
      throw error;
    }
  }

  // Получить конкретный заказ по ID
  async getOrderById(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения заказа:', error);
      throw error;
    }
  }

  // Создать новый заказ
  async createOrder(orderData) {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      throw error;
    }
  }

  // Повторить заказ
  async reorderOrder(orderId) {
    try {
      const response = await api.post(`/orders/${orderId}/reorder`);
      return response.data;
    } catch (error) {
      console.error('Ошибка повторения заказа:', error);
      throw error;
    }
  }

  // Отменить заказ
  async cancelOrder(orderId) {
    try {
      const response = await api.put(`/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Ошибка отмены заказа:', error);
      throw error;
    }
  }

  // Получить все заказы (алиас для getUserOrders)
  async getOrders() {
    return this.getUserOrders();
  }

  // Получить заказ (алиас для getOrderById)
  async getOrder(orderId) {
    return this.getOrderById(orderId);
  }

  // Обновить статус заказа
  async updateOrderStatus(orderId, status) {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      throw error;
    }
  }

  // Получить статистику заказов пользователя
  async getOrderStats() {
    try {
      const response = await api.get('/orders/stats');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      throw error;
    }
  }

  // Поиск заказов по номеру или статусу
  async searchOrders(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (query) {
        params.append('search', query);
      }
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }

      const response = await api.get(`/orders/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка поиска заказов:', error);
      throw error;
    }
  }

  // Обновить адрес доставки
  async updateDeliveryAddress(orderId, newAddress) {
    try {
      const response = await api.put(`/orders/${orderId}/delivery-address`, {
        deliveryAddress: newAddress
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления адреса:', error);
      throw error;
    }
  }

  // Оставить отзыв о заказе
  async addOrderReview(orderId, reviewData) {
    try {
      const response = await api.post(`/orders/${orderId}/review`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Ошибка добавления отзыва:', error);
      throw error;
    }
  }

  // Получить историю изменений статуса заказа
  async getOrderHistory(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}/history`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения истории заказа:', error);
      throw error;
    }
  }

  // Запросить возврат заказа
  async requestReturn(orderId, reason, items = []) {
    try {
      const response = await api.post(`/orders/${orderId}/return`, {
        reason,
        items
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка запроса возврата:', error);
      throw error;
    }
  }

  // Скачать чек/инвойс заказа
  async downloadInvoice(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка скачивания чека:', error);
      throw error;
    }
  }

  // Отследить заказ
  async trackOrder(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}/track`);
      return response.data;
    } catch (error) {
      console.error('Ошибка отслеживания заказа:', error);
      throw error;
    }
  }

  // Получить доступные слоты доставки
  async getDeliverySlots(date) {
    try {
      const response = await api.get(`/orders/delivery-slots?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения слотов доставки:', error);
      throw error;
    }
  }

  // Рассчитать стоимость доставки
  async calculateDelivery(address, items) {
    try {
      const response = await api.post('/orders/calculate-delivery', {
        address,
        items
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка расчета доставки:', error);
      throw error;
    }
  }

  // Проверить применимость промокода
  async validatePromoCode(code, items) {
    try {
      const response = await api.post('/orders/validate-promo', {
        promoCode: code,
        items
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка проверки промокода:', error);
      throw error;
    }
  }
}

// ✅ Экспортируем и как default, и как named export для совместимости
const orderService = new OrderService();
export { orderService };
export default orderService;