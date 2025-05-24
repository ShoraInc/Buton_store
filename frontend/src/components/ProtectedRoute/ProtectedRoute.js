import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Требуется авторизация</h2>
          <p className="text-gray-600 mb-4">
            Для доступа к этой странице необходимо войти в аккаунт
          </p>
          <button className="bg-black text-white px-6 py-2 rounded-lg">
            Войти
          </button>
        </div>
      </div>
    );
  }

  if (adminOnly && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Доступ запрещен</h2>
          <p className="text-gray-600">
            У вас нет прав для доступа к этой странице
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;