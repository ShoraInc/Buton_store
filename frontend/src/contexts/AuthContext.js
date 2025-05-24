// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Список защищенных пользовательских маршрутов
  const protectedRoutes = [
    '/my-orders',
    '/orders', // для /orders/:orderId
    '/checkout',
    '/order-success', // для /order-success/:orderId
    '/favorites',
    '/my-favorites', 
    '/profile',
    '/profile/settings'
  ];

  // Список админских маршрутов  
  const adminRoutes = [
    '/admin',
    '/admin/products',
    '/admin/orders', 
    '/admin/users'
  ];

  // ✅ Функция обновления состояния
  const updateAuthState = () => {
    try {
      const currentUser = authService.getCurrentUser();
      const isAuth = authService.isAuthenticated();
      console.log('Обновление состояния авторизации:', { currentUser, isAuth });
      
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

  // ✅ Проверка доступа к текущему маршруту
  const checkRouteAccess = () => {
    const currentPath = location.pathname;
    const isProtectedRoute = protectedRoutes.includes(currentPath);
    const isAdminRoute = adminRoutes.some(route => currentPath.startsWith(route));

    // Если это защищенный маршрут
    if (isProtectedRoute || isAdminRoute) {
      if (!user) {
        console.log('Доступ запрещен, редирект на главную');
        navigate('/');
        return false;
      }

      // Проверяем админские права
      if (isAdminRoute && user.role !== 'admin') {
        console.log('Недостаточно прав для админ панели');
        navigate('/');
        return false;
      }
    }

    return true;
  };

  // ✅ Инициализация при загрузке
  useEffect(() => {
    updateAuthState();
    setLoading(false);

    // Слушаем изменения authState
    const handleAuthChange = () => {
      console.log('Получено событие authStateChanged');
      updateAuthState();
    };

    window.addEventListener('authStateChanged', handleAuthChange);

    // Слушаем изменения localStorage (для синхронизации вкладок)
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' || e.key === 'user') {
        console.log('Изменение в localStorage:', e.key);
        updateAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // ✅ Автоматическая проверка токена каждые 3 секунды
  useEffect(() => {
    if (!user) return;

    const tokenCheckInterval = setInterval(() => {
      console.log('Автоматическая проверка токена...');
      const token = authService.getToken();
      
      if (token && authService.isTokenExpired(token)) {
        console.log('Токен истек, разлогиниваем пользователя');
        authService.logout();
      }
    }, 3000);

    return () => clearInterval(tokenCheckInterval);
  }, [user]);

  // ✅ Проверка доступа при изменении маршрута
  useEffect(() => {
    if (!loading) {
      checkRouteAccess();
    }
  }, [location.pathname, user, loading]);

  // ✅ Методы авторизации
  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const result = await authService.register(userData);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
  };

  const checkTokenValidity = () => {
    const token = authService.getToken();
    return token && !authService.isTokenExpired(token);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkTokenValidity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Простой хук для использования контекста
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};