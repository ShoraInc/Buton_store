import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Простая функция обновления состояния
  const updateAuthState = () => {
    try {
      const currentUser = authService.getCurrentUser();
      const isAuth = authService.isAuthenticated(); // Теперь автоматически проверяет токен
      console.log('Обновление состояния:', { currentUser, isAuth });
      
      if (isAuth && currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Ошибка в updateAuthState:', error);
      setUser(null);
    }
  };

  // ✅ Новая функция для обновления данных пользователя
  const updateUser = (newUserData) => {
    try {
      // Обновляем данные пользователя в localStorage
      authService.updateUser(newUserData);
      
      // Обновляем состояние в компоненте
      setUser(newUserData);
      
      // Уведомляем другие компоненты об изменении
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      
      console.log('Данные пользователя обновлены:', newUserData);
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
    }
  };

  useEffect(() => {
    // ✅ Инициализация при загрузке
    updateAuthState();
    setLoading(false);

    // ✅ Слушаем изменения authState
    const handleAuthChange = () => {
      console.log('Получено событие authStateChanged');
      updateAuthState();
    };
    window.addEventListener('authStateChanged', handleAuthChange);

    // ✅ Слушаем изменения localStorage (для синхронизации вкладок)
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' || e.key === 'user') {
        console.log('Изменение в localStorage:', e.key);
        updateAuthState();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Очистка при размонтировании
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // ✅ Автоматическая проверка токена каждые 3 секунды (для токена на 10 сек)
  useEffect(() => {
    if (!user) return; // Не проверяем если пользователь не авторизован

    const tokenCheckInterval = setInterval(() => {
      console.log('Автоматическая проверка токена...');
      const token = authService.getToken();
      
      if (token && authService.isTokenExpired && authService.isTokenExpired(token)) {
        console.log('Токен истек, разлогиниваем пользователя');
        authService.logout(); // authService автоматически вызовет notifyAuthChange
      }
    }, 3000); // Проверяем каждые 3 секунды

    return () => clearInterval(tokenCheckInterval);
  }, [user]);

  // ✅ Простые методы авторизации
  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      // authService уже вызывает notifyAuthChange(), поэтому updateAuthState сработает автоматически
      return result;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const result = await authService.register(userData);
      // authService уже вызывает notifyAuthChange(), поэтому updateAuthState сработает автоматически
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    // authService уже вызывает notifyAuthChange(), поэтому updateAuthState сработает автоматически
  };

  // ✅ Дополнительная функция для проверки токена (если нужна в компонентах)
  const checkTokenValidity = () => {
    const token = authService.getToken();
    return token && (!authService.isTokenExpired || !authService.isTokenExpired(token));
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser, // ✅ Добавляем функцию updateUser
    checkTokenValidity,
    authLoading: loading // Добавляем алиас для совместимости
  };
};