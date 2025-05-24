// pages/MyFavorites/MyFavorites.js - Обновленная версия
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext'; // Используем Context
import { cartService } from '../../services/cartService';

const MyFavorites = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, authLoading } = useAuth();
  const { favorites, loading: favoritesLoading, removeFromFavorites } = useFavorites(); // Из Context
  const [searchQuery, setSearchQuery] = useState('');

  const handleRemoveFromFavorites = async (productId) => {
    try {
      await removeFromFavorites(productId);
    } catch (error) {
      console.error('Ошибка удаления из избранного:', error);
      alert(error.message || 'Ошибка при удалении из избранного');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await cartService.addToCart(product.id, 1);
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
      alert(error.message);
    }
  };

  const getImageUrl = (imageName) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const image = Array.isArray(imageName) ? imageName[0] : imageName;
    return `${baseUrl}/uploads/products/${image}`;
  };

  // Показываем загрузку пока useAuth инициализируется
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Если не авторизован - перенаправляем на главную
  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  return (
    <>
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Заголовок страницы */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Heart className="text-red-500" size={32} />
                Мои избранные
              </h1>
              <p className="text-gray-600">Товары, которые вам понравились</p>
            </div>
          </div>

          {/* Загрузка избранного */}
          {favoritesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка избранного...</p>
            </div>
          ) : (
            /* Список избранных */
            favorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-500">Избранное пусто</p>
                <p className="text-gray-400 mb-6">Добавьте товары, которые вам нравятся</p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Перейти к покупкам
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-gray-600">
                    Всего в избранном: <span className="font-medium">{favorites.length}</span> товаров
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {favorites.map(favorite => (
                    <div key={favorite.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Изображение */}
                      <div className="relative h-48">
                        <img
                          src={getImageUrl(favorite.Product.images)}
                          alt={favorite.Product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/api/placeholder/300/200';
                          }}
                        />
                        <button
                          onClick={() => handleRemoveFromFavorites(favorite.Product.id)}
                          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>

                      {/* Информация о товаре */}
                      <div className="p-4">
                        <h3 className="font-medium mb-1 line-clamp-1">
                          {favorite.Product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {favorite.Product.category}
                        </p>

                        {/* Цена и рейтинг */}
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            {favorite.Product.discountPrice ? (
                              <>
                                <span className="font-bold text-red-600">
                                  {parseFloat(favorite.Product.discountPrice).toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500 line-through">
                                  {parseFloat(favorite.Product.price).toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-600">₸</span>
                              </>
                            ) : (
                              <>
                                <span className="font-bold">
                                  {parseFloat(favorite.Product.price).toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-600">₸</span>
                              </>
                            )}
                          </div>

                          {favorite.Product.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">⭐</span>
                              <span className="text-sm text-gray-600">
                                {parseFloat(favorite.Product.rating).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Кнопка добавления в корзину */}
                        <button
                          onClick={() => handleAddToCart(favorite.Product)}
                          className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                          <ShoppingCart size={16} />
                          В корзину
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default MyFavorites;
