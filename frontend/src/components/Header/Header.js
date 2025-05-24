// components/Header/Header.js - Обновленная версия с CartContext
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User, LogOut, Settings, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useCart } from '../../contexts/CartContext'; // Используем CartContext
import AuthModal from '../modals/AuthModal';
import CartModal from '../modals/CartModal';
import FavoritesModal from '../modals/FavoritesModal';

const Header = ({ searchQuery, setSearchQuery, onAddToCart }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { favorites, favoritesCount } = useFavorites();
  const { addToCart, cartItemsCount } = useCart(); // Из CartContext

  // Состояния модальных окон
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Получаем количество избранных и товаров в корзине из Context
  const currentFavoritesCount = favoritesCount || favorites.length;
  const currentCartCount = cartItemsCount;

  const handleAuthSuccess = (userData) => {
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const handleAddToCartWrapper = async (product) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      await addToCart(product.id, 1);
      onAddToCart?.(product);
      // Уведомление теперь может показываться здесь или в компоненте
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
      alert(error.message);
    }
  };

  const handleCartClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsCartModalOpen(true);
  };

  const handleFavoritesClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsFavoritesModalOpen(true);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Обработчики навигации
  const handleMyOrdersClick = () => {
    setIsUserMenuOpen(false);
    navigate('/my-orders');
  };

  const handleFavoritesPageClick = () => {
    setIsUserMenuOpen(false);
    navigate('/favorites');
  };

  const handleProfileSettingsClick = () => {
    setIsUserMenuOpen(false);
    navigate('/profile/settings');
  };

  const handleAdminPanelClick = () => {
    setIsUserMenuOpen(false);
    navigate('/admin');
  };

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <>
      <header className="bg-black text-white sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Логотип и слоган */}
            <div className="flex items-center gap-4">
              <h1 
                onClick={() => navigate('/')}
                className="text-2xl font-bold cursor-pointer hover:text-gray-300 transition-colors"
              >
                BUTON
              </h1>
              <p className="text-sm text-gray-300 hidden md:block">
                Лучшие цветы в городе Семей
              </p>
            </div>

            {/* Поиск */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-white text-black rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                />
              </div>
            </div>

            {/* Навигация */}
            <div className="flex items-center gap-4">
              {/* Админская кнопка - видна только админам */}
              {isAuthenticated && user?.role === 'admin' && (
                <button 
                  onClick={handleAdminPanelClick}
                  className="flex items-center gap-1 text-sm hover:text-gray-300 transition-colors bg-red-600 bg-opacity-80 px-3 py-1 rounded-full hover:bg-opacity-100"
                  title="Админская панель"
                >
                  <Shield size={18} />
                  <span className="hidden md:inline">Админка</span>
                </button>
              )}

              {/* Избранное */}
              <button 
                onClick={handleFavoritesClick}
                className="flex items-center gap-1 text-sm hover:text-gray-300 transition-colors relative group"
                title={isAuthenticated ? 'Избранное' : 'Войдите для просмотра избранного'}
              >
                <Heart size={18} className="group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">Избранное</span>
                {isAuthenticated && currentFavoritesCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-1 animate-pulse">
                    {currentFavoritesCount > 99 ? '99+' : currentFavoritesCount}
                  </span>
                )}
              </button>

              {/* Корзина */}
              <button 
                onClick={handleCartClick}
                className="flex items-center gap-1 text-sm hover:text-gray-300 transition-colors relative group"
                title={isAuthenticated ? 'Корзина' : 'Войдите для просмотра корзины'}
              >
                <ShoppingCart size={18} className="group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">Корзина</span>
                {isAuthenticated && currentCartCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-1 animate-pulse">
                    {currentCartCount > 99 ? '99+' : currentCartCount}
                  </span>
                )}
              </button>

              {/* Пользователь */}
              {isAuthenticated && user ? (
                <div className="relative user-menu-container">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1 text-sm hover:text-gray-300 transition-colors"
                  >
                    <User size={18} />
                    <span className="hidden md:inline">{user.firstName}</span>
                    <ChevronDown size={14} className={`transform transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Выпадающее меню пользователя */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-white text-black rounded-lg shadow-lg py-2 min-w-48 z-50">
                      <div className="px-4 py-2 border-b">
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.role === 'admin' && (
                          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mt-1">
                            Администратор
                          </span>
                        )}
                      </div>
                      
                      {/* Админская кнопка в меню */}
                      {user.role === 'admin' && (
                        <>
                          <button 
                            onClick={handleAdminPanelClick}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600 font-medium"
                          >
                            <Shield size={16} />
                            Админская панель
                          </button>
                          <hr className="my-2" />
                        </>
                      )}
                      
                      <button 
                        onClick={handleProfileSettingsClick}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Settings size={16} />
                        Настройки профиля
                      </button>
                      
                      <button 
                        onClick={handleMyOrdersClick}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <ShoppingCart size={16} />
                        Мои заказы
                      </button>
                      
                      <button 
                        onClick={handleFavoritesPageClick}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Heart size={16} />
                        Избранное
                        {currentFavoritesCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-auto">
                            {currentFavoritesCount}
                          </span>
                        )}
                      </button>
                      
                      <hr className="my-2" />
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600"
                      >
                        <LogOut size={16} />
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1 text-sm hover:text-gray-300 transition-colors bg-white bg-opacity-10 px-3 py-1 rounded-full hover:bg-opacity-20"
                >
                  <User size={18} />
                  Войти
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Мобильное меню */}
        <div className="md:hidden border-t border-gray-700">
          <div className="container mx-auto px-4 py-2">
            <div className="flex justify-around">
              {/* Админская кнопка для мобильных */}
              {isAuthenticated && user?.role === 'admin' && (
                <button 
                  onClick={handleAdminPanelClick} 
                  className="flex flex-col items-center gap-1 text-xs text-red-400"
                >
                  <Shield size={16} />
                  <span>Админка</span>
                </button>
              )}
              
              <button 
                onClick={handleFavoritesClick} 
                className="flex flex-col items-center gap-1 text-xs relative"
              >
                <Heart size={16} />
                <span>Избранное</span>
                {isAuthenticated && currentFavoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                    {currentFavoritesCount > 9 ? '9+' : currentFavoritesCount}
                  </span>
                )}
              </button>
              
              <button 
                onClick={handleCartClick} 
                className="flex flex-col items-center gap-1 text-xs relative"
              >
                <ShoppingCart size={16} />
                <span>Корзина</span>
                {isAuthenticated && currentCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                    {currentCartCount > 9 ? '9+' : currentCartCount}
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => user ? setIsUserMenuOpen(true) : setIsAuthModalOpen(true)} 
                className="flex flex-col items-center gap-1 text-xs"
              >
                <User size={16} />
                <span>{user ? user.firstName : 'Войти'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Модальные окна */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
      />

      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        onAddToCart={handleAddToCartWrapper}
      />
    </>
  );
};

export default Header;