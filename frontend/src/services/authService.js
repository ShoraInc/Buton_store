class AuthService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    this.token = localStorage.getItem('authToken');
  }

  // ✅ ВАЖНО: Раскомментируем этот метод!
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Ошибка парсинга пользователя:', error);
      localStorage.removeItem('user'); // Удаляем поврежденные данные
      return null;
    }
  }

  // ✅ Метод для уведомления об изменениях
  notifyAuthChange() {
    window.dispatchEvent(new Event('authStateChanged'));
  }

  // ✅ НОВЫЙ: Получение токена
  getToken() {
    return this.token || localStorage.getItem('authToken');
  }

  // ✅ НОВЫЙ: Обновление данных пользователя
  updateUser(userData) {
    try {
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Уведомляем об изменении данных пользователя
      this.notifyAuthChange();
      
      console.log('Данные пользователя обновлены в localStorage:', userData);
    } catch (error) {
      console.error('Ошибка обновления пользователя в localStorage:', error);
    }
  }

  // ✅ НОВЫЙ: Проверка истечения срока действия JWT токена
  isTokenExpired(token) {
    try {
      if (!token) return true;
      
      // Декодируем JWT токен (только payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Проверяем поле exp (expiration time)
      const isExpired = payload.exp < currentTime;
      if (isExpired) {
        console.log(`Токен истек. Время истечения: ${new Date(payload.exp * 1000)}, Текущее время: ${new Date()}`);
      }
      
      return isExpired;
    } catch (error) {
      console.error('Ошибка при проверке срока действия токена:', error);
      return true; // Если не можем проверить, считаем токен недействительным
    }
  }

  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка входа');
    }

    const data = await response.json();
    this.token = data.token;
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // ✅ Уведомляем о изменении
    this.notifyAuthChange();
    return data;
  }

  async register(userData) {
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка регистрации');
    }

    const data = await response.json();
    this.token = data.token;
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // ✅ Уведомляем о изменении
    this.notifyAuthChange();
    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    // ✅ Уведомляем о изменении
    this.notifyAuthChange();
  }

  // ✅ ОБНОВЛЕНО: Проверка аутентификации с проверкой срока действия токена
  isAuthenticated() {
    const currentToken = this.getToken();
    const user = this.getCurrentUser();

    if (!currentToken || !user) return false;

    // Проверяем срок действия токена
    if (this.isTokenExpired(currentToken)) {
      console.log('Токен истек, автоматический выход');
      this.logout(); // Автоматически разлогиниваем при истечении токена
      return false;
    }

    return true;
  }

  // ✅ Дополнительный метод для получения заголовков
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }
}

// ✅ ОБЯЗАТЕЛЬНО: экспортируем экземпляр
export const authService = new AuthService();