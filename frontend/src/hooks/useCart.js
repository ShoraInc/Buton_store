import { useState, useEffect } from 'react';
import { cartService } from '../services/cartService';

export const useCart = (user) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadCart = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await cartService.getCart();
      setCart(response.cart);
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      await cartService.addToCart(productId, quantity);
      await loadCart();
    } catch (error) {
      throw error;
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      await cartService.updateCartItem(itemId, quantity);
      await loadCart();
    } catch (error) {
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await cartService.removeFromCart(itemId);
      await loadCart();
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      await loadCart();
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    loadCart();
  }, [user]);

  return {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refetch: loadCart
  };
};
