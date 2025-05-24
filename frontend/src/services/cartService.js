class CartService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  }

  // Получить заголовки
  getHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Получить корзину
  async getCart() {
    const response = await fetch(`${this.baseUrl}/api/cart`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Ошибка получения корзины');
    }

    return response.json();
  }

  // Добавить в корзину
  async addToCart(productId, quantity = 1) {
    const response = await fetch(`${this.baseUrl}/api/cart/add`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ productId, quantity })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка добавления в корзину');
    }

    return response.json();
  }

  // Обновить количество в корзине
  async updateCartItem(itemId, quantity) {
    const response = await fetch(`${this.baseUrl}/api/cart/item/${itemId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ quantity })
    });

    if (!response.ok) {
      throw new Error('Ошибка обновления корзины');
    }

    return response.json();
  }

  // Удалить из корзины
  async removeFromCart(itemId) {
    const response = await fetch(`${this.baseUrl}/api/cart/item/${itemId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Ошибка удаления из корзины');
    }

    return response.json();
  }

  // Очистить корзину
  async clearCart() {
    const response = await fetch(`${this.baseUrl}/api/cart/clear`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Ошибка очистки корзины');
    }

    return response.json();
  }
}

export const cartService = new CartService();