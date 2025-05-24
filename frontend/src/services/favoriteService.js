class FavoriteService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  }

  getHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Получить избранное
  async getFavorites() {
    const response = await fetch(`${this.baseUrl}/api/favorites`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Ошибка получения избранного');
    }

    return response.json();
  }

  // Переключить избранное
  async toggleFavorite(productId) {
    const response = await fetch(`${this.baseUrl}/api/favorites/toggle`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ productId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка изменения избранного');
    }

    return response.json();
  }

  // Удалить из избранного
  async removeFromFavorites(productId) {
    const response = await fetch(`${this.baseUrl}/api/favorites/${productId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Ошибка удаления из избранного');
    }

    return response.json();
  }
}

export const favoriteService = new FavoriteService();