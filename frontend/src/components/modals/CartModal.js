// components/modals/CartModal.js - Обновленная версия с CartContext
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext'; // Используем CartContext

const CartModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { 
    cart, 
    loading, 
    updateCartItem, 
    removeFromCart, 
    clearCart,
    cartItems,
    cartTotal,
    hasItems,
    refetch
  } = useCart(); // Из CartContext

  const [error, setError] = useState('');

  // Загрузка корзины при открытии
  useEffect(() => {
    if (isOpen) {
      refetch();
      setError('');
    }
  }, [isOpen, refetch]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      setError('');
      await updateCartItem(itemId, newQuantity);
    } catch (err) {
      console.error('Ошибка обновления количества:', err);
      setError(err.message || 'Ошибка при обновлении количества');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      setError('');
      await removeFromCart(itemId);
    } catch (err) {
      console.error('Ошибка удаления товара:', err);
      setError(err.message || 'Ошибка при удалении товара');
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Очистить корзину?')) {
      try {
        setError('');
        await clearCart();
      } catch (err) {
        console.error('Ошибка очистки корзины:', err);
        setError(err.message || 'Ошибка при очистке корзины');
      }
    }
  };

  const handleCheckout = () => {
    onClose(); // Закрываем модальное окно
    navigate('/checkout'); // Переходим на страницу оформления заказа
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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag size={24} />
            Корзина
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
              <p className="mt-2 text-gray-600">Загрузка корзины...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!loading && !hasItems && (
            <div className="text-center py-8">
              <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-xl text-gray-500">Корзина пуста</p>
              <p className="text-gray-400">Добавьте товары для оформления заказа</p>
            </div>
          )}

          {!loading && hasItems && (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                  {/* Изображение */}
                  <div className="w-16 h-16 flex-shrink-0">
                    <img
                      src={getImageUrl(item.Product.images)}
                      alt={item.Product.name}
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/64/64';
                      }}
                    />
                  </div>

                  {/* Информация о товаре */}
                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-1">{item.Product.name}</h3>
                    <p className="text-sm text-gray-600">
                      {parseFloat(item.priceAtTime).toLocaleString()} ₸ за шт.
                    </p>
                    {item.Product.category && (
                      <p className="text-xs text-gray-500">{item.Product.category}</p>
                    )}
                  </div>

                  {/* Количество */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || loading}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Уменьшить количество"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={loading}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 transition-colors"
                      title="Увеличить количество"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Общая стоимость */}
                  <div className="text-right">
                    <p className="font-bold">
                      {(parseFloat(item.priceAtTime) * item.quantity).toLocaleString()} ₸
                    </p>
                  </div>

                  {/* Удалить */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={loading}
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Удалить товар"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Футер с итогами */}
        {!loading && hasItems && (
          <div className="border-t p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-lg font-medium">
                  Товаров: {cartItems.length} 
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0) !== cartItems.length && 
                    ` (${cartItems.reduce((sum, item) => sum + item.quantity, 0)} шт.)`
                  }
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Итого:</p>
                <span className="text-2xl font-bold">
                  {cartTotal?.toLocaleString()} ₸
                </span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleClearCart}
                disabled={loading}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Очистить корзину
              </button>
              <button
                onClick={handleCheckout}
                disabled={loading || !hasItems}
                className="flex-1 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Оформить заказ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;