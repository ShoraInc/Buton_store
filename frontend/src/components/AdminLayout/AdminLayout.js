// components/AdminLayout/AdminLayout.js - Общий layout для админки
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Package, ShoppingCart, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AdminLayout = ({ children, title, currentPage }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Проверка прав доступа
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield size={64} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Доступ запрещен</h2>
          <p className="text-gray-600 mb-4">У вас нет прав администратора</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-black text-white px-6 py-2 rounded-lg"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Панель управления', icon: BarChart3, path: '/admin' },
    { id: 'products', label: 'Товары', icon: Package, path: '/admin/products' },
    { id: 'orders', label: 'Заказы', icon: ShoppingCart, path: '/admin/orders' },
    { id: 'users', label: 'Пользователи', icon: Users, path: '/admin/users' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header админки */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="p-2 hover:bg-red-700 rounded-full transition-colors"
                title="Вернуться в магазин"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <Shield size={28} />
                <div>
                  <h1 className="text-xl font-bold">Админская панель</h1>
                  <p className="text-sm text-red-200">BUTON - Управление магазином</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-red-200">Администратор</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Боковая навигация */}
        <aside className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                      currentPage === item.id
                        ? 'bg-red-100 text-red-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Основной контент */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
