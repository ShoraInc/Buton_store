// hooks/useTokenValidator.js
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export const useTokenValidator = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Ждем загрузки
    if (loading) return;

    // Список защищенных маршрутов
    const protectedRoutes = [
      '/my-orders',
      '/favorites', 
      '/profile/settings'
    ];

    // Список админских маршрутов  
    const adminRoutes = [
      '/admin',
      '/admin/products',
      '/admin/orders', 
      '/admin/users',
      '/admin/orders',
    ];

    const currentPath = location.pathname;
    const isProtectedRoute = protectedRoutes.includes(currentPath);
    const isAdminRoute = adminRoutes.some(route => currentPath.startsWith(route));

    // Если это защищенный маршрут и пользователь не авторизован
    if ((isProtectedRoute || isAdminRoute) && !isAuthenticated) {
      console.log('Доступ запрещен, редирект на главную');
      navigate('/');
      return;
    }

    // Проверяем админские права
    if (isAdminRoute && user && user.role !== 'admin') {
      console.log('Недостаточно прав для админ панели');
      navigate('/');
      return;
    }
  }, [location.pathname, isAuthenticated, loading, user, navigate]);

  return { user, isAuthenticated, loading };
};