// components/FavoritesModal/FavoritesModal.js - Обновленная версия
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, ShoppingCart, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext'; // Используем Context

const FavoritesModal = ({ isOpen, onClose, onAddToCart }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, loading, removeFromFavorites } = useFavorites(); // Из Context

  const handleRemoveFromFavorites = async (productId) => {
    try {
      await removeFromFavorites(productId);
    } catch (err) {
      console.error('Ошибка удаления из избранного:', err);
      alert(err.message || 'Ошибка при удалении из избранного');
    }
  };

  const handleAddToCart = (product) => {
    onAddToCart?.(product);
  };

  const handleViewProduct = (productId) => {
    onClose();
    navigate(`/product/${productId}`);
  };

  const getImageUrl = (imageName) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const image = Array.isArray(imageName) ? imageName[0] : imageName;
    return `${baseUrl}/uploads/products/${image}`;
  };

  // Закрытие модала при клике вне его
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Закрытие модала по Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Heart size={24} className="text-red-500" />
            Избранное
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
              <p className="mt-2 text-gray-600">Загрузка избранного...</p>
            </div>
          )}

          {favorites.length === 0 && !loading && (
            <div className="text-center py-8">
              <Heart size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-xl text-gray-500">Избранное пусто</p>
              <p className="text-gray-400">Добавьте товары, которые вам нравятся</p>
            </div>
          )}

          {favorites.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite) => (
                <div key={favorite.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow group">
                  {/* Изображение */}
                  <div className="relative h-48 cursor-pointer" onClick={() => handleViewProduct(favorite.Product.id)}>
                    <img
                      src={getImageUrl(favorite.Product.images)}
                      alt={favorite.Product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/300/200';
                      }}
                    />
                    
                    {/* Кнопка просмотра */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProduct(favorite.Product.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 bg-white text-black p-2 rounded-full shadow-lg transition-all duration-300 transform scale-90 group-hover:scale-100"
                        title="Посмотреть товар"
                      >
                        <Eye size={16} />
                      </button>
                    </div>

                    {/* Кнопка удаления */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromFavorites(favorite.Product.id);
                      }}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                      title="Удалить из избранного"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>

                    {/* Бейджи скидок */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {favorite.Product.discountPrice && parseFloat(favorite.Product.discountPrice) < parseFloat(favorite.Product.price) && (
                        <span className="bg-red-500 text-white px-2 py-1 text-xs rounded font-medium">
                          Скидка
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Информация */}
                  <div className="p-4">
                    <h3 
                      className="font-medium mb-1 line-clamp-1 cursor-pointer hover:text-gray-600 transition-colors"
                      onClick={() => handleViewProduct(favorite.Product.id)}
                      title={favorite.Product.name}
                    >
                      {favorite.Product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Категория: {favorite.Product.category}
                    </p>

                    {/* Цена и рейтинг */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        {favorite.Product.discountPrice && parseFloat(favorite.Product.discountPrice) < parseFloat(favorite.Product.price) ? (
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(favorite.Product);
                      }}
                      className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={16} />
                      В корзину
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Футер */}
        {favorites.length > 0 && (
          <div className="border-t p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                Всего в избранном: {favorites.length} {favorites.length === 1 ? 'товар' : favorites.length < 5 ? 'товара' : 'товаров'}
              </span>
              <button
                onClick={onClose}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Продолжить покупки
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesModal;