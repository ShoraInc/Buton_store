// contexts/CartContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  // Загрузка корзины
  const loadCart = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setCart(null);
      return;
    }

    setLoading(true);
    try {
      const response = await cartService.getCart();
      setCart(response.cart);
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // Добавление в корзину
  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated || !user) {
      throw new Error('Необходимо войти в аккаунт');
    }

    try {
      await cartService.addToCart(productId, quantity);
      
      // Оптимистичное обновление - увеличиваем счетчик
      if (cart) {
        setCart(prev => ({
          ...prev,
          itemsCount: (prev.itemsCount || 0) + quantity
        }));
      }

      // Асинхронно обновляем полные данные
      setTimeout(() => {
        loadCart();
      }, 100);
    } catch (error) {
      // При ошибке перезагружаем данные
      loadCart();
      throw error;
    }
  };

  // Обновление количества товара
  const updateCartItem = async (itemId, quantity) => {
    if (!isAuthenticated || !user) {
      throw new Error('Необходимо войти в аккаунт');
    }

    try {
      await cartService.updateCartItem(itemId, quantity);
      
      // Перезагружаем корзину для актуальных данных
      await loadCart();
    } catch (error) {
      // При ошибке перезагружаем данные
      loadCart();
      throw error;
    }
  };

  // Удаление товара из корзины
  const removeFromCart = async (itemId) => {
    if (!isAuthenticated || !user) {
      throw new Error('Необходимо войти в аккаунт');
    }

    try {
      await cartService.removeFromCart(itemId);
      
      // Оптимистичное обновление - уменьшаем счетчик
      if (cart && cart.items) {
        const removedItem = cart.items.find(item => item.id === itemId);
        if (removedItem) {
          setCart(prev => ({
            ...prev,
            itemsCount: Math.max(0, (prev.itemsCount || 0) - removedItem.quantity),
            items: prev.items.filter(item => item.id !== itemId)
          }));
        }
      }

      // Асинхронно обновляем полные данные
      setTimeout(() => {
        loadCart();
      }, 100);
    } catch (error) {
      // При ошибке перезагружаем данные
      loadCart();
      throw error;
    }
  };

  // Очистка корзины
  const clearCart = async () => {
    if (!isAuthenticated || !user) {
      throw new Error('Необходимо войти в аккаунт');
    }

    try {
      await cartService.clearCart();
      
      // Оптимистичное обновление - очищаем корзину
      setCart({
        items: [],
        itemsCount: 0,
        totalAmount: 0
      });

      // Асинхронно обновляем данные
      setTimeout(() => {
        loadCart();
      }, 100);
    } catch (error) {
      // При ошибке перезагружаем данные
      loadCart();
      throw error;
    }
  };

  // Получение количества товаров в корзине
  const getCartItemsCount = useCallback(() => {
    return cart?.itemsCount || 0;
  }, [cart]);

  // Получение общей суммы корзины
  const getCartTotal = useCallback(() => {
    return cart?.totalAmount || 0;
  }, [cart]);

  // Проверка, есть ли товар в корзине
  const isInCart = useCallback((productId) => {
    return cart?.items?.some(item => item.Product?.id === productId) || false;
  }, [cart]);

  // Получение товара из корзины
  const getCartItem = useCallback((productId) => {
    return cart?.items?.find(item => item.Product?.id === productId);
  }, [cart]);

  // Очистка корзины при выходе пользователя
  useEffect(() => {
    if (!isAuthenticated) {
      setCart(null);
    } else {
      loadCart();
    }
  }, [isAuthenticated, loadCart]);

  // Принудительное обновление
  const refetch = useCallback(() => {
    loadCart();
  }, [loadCart]);

  const value = {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartItemsCount,
    getCartTotal,
    isInCart,
    getCartItem,
    refetch,
    // Удобные геттеры
    cartItems: cart?.items || [],
    cartItemsCount: cart?.itemsCount || 0,
    cartTotal: cart?.totalAmount || 0,
    hasItems: cart?.items?.length > 0
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Хук для использования контекста корзины
export const useCart = () => {
  const context = useContext(CartContext);
  
  if (!context) {
    throw new Error('useCart должен использоваться внутри CartProvider');
  }
  
  return context;
};