import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiService } from '../api/apiService.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

function getProductIconClass(category = '') {
  const c = String(category).toLowerCase();
  if (c.includes('fruit')) return 'fas fa-apple-alt';
  if (c.includes('vegetable')) return 'fas fa-carrot';
  if (c.includes('dairy')) return 'fas fa-cheese';
  if (c.includes('beverage')) return 'fas fa-mug-hot';
  if (c.includes('meat')) return 'fas fa-drumstick-bite';
  return 'fas fa-box';
}

export function CartProvider({ children }) {
  const { showAlert } = useAuth();
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  });

  const saveCart = (nextCart) => {
    localStorage.setItem('cart', JSON.stringify(nextCart));
    setCart(nextCart);
  };

  const syncFromBackend = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await apiService.get('/cart');
      if (response.status === 'success' && response.cart) {
        const mapped = (response.cart.items || []).map((item) => ({
          id: item.product_id?._id || item.product_id,
          name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          iconClass: getProductIconClass(item.product_id?.category)
        }));
        saveCart(mapped);
      }
    } catch (error) {
      showAlert(error.message || 'Failed to load cart from server.', 'error', 'Cart sync failed');
    }
  };

  useEffect(() => {
    syncFromBackend().catch(() => {});
  }, []);

  const addToCart = async (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    const nextCart = existingItem
      ? cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      : [...cart, { ...product, quantity: 1 }];

    const previousCart = cart;
    saveCart(nextCart);

    try {
      const token = localStorage.getItem('token');
      if (token && String(product.id).length >= 12) {
        await apiService.post('/cart/add', {
          product_id: product.id,
          quantity: 1
        });
      }
      showAlert(`${product.name} added to cart.`, 'success', 'Cart updated');
    } catch (error) {
      saveCart(previousCart);
      showAlert(error.message || 'Failed to add item to cart.', 'error', 'Cart error');
    }
  };

  const removeFromCart = async (productId) => {
    const item = cart.find((entry) => entry.id === productId);
    if (!item) {
      showAlert('That item is not in your cart.', 'error', 'Cart item missing');
      return;
    }

    const nextCart = cart.filter((entry) => entry.id !== productId);
    const previousCart = cart;
    saveCart(nextCart);

    try {
      const token = localStorage.getItem('token');
      if (token) {
        await apiService.post('/cart/remove', { product_id: productId });
      }
      showAlert(`${item.name} removed from cart.`, 'success', 'Cart updated');
    } catch (error) {
      saveCart(previousCart);
      showAlert(error.message || 'Failed to remove item from cart.', 'error', 'Cart error');
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) {
      showAlert('Quantity cannot be less than 1. Use Remove to delete the item.', 'error', 'Invalid quantity');
      return;
    }

    const item = cart.find((entry) => entry.id === productId);
    if (!item) {
      showAlert('That item is not in your cart.', 'error', 'Cart item missing');
      return;
    }

    const nextCart = cart.map((entry) =>
      entry.id === productId ? { ...entry, quantity } : entry
    );
    const previousCart = cart;
    saveCart(nextCart);

    try {
      const token = localStorage.getItem('token');
      if (token) {
        await apiService.put('/cart/update', {
          product_id: productId,
          quantity
        });
      }
      showAlert(`${item.name} quantity updated.`, 'success', 'Cart updated');
    } catch (error) {
      saveCart(previousCart);
      showAlert(error.message || 'Failed to update item quantity.', 'error', 'Cart error');
    }
  };

  const clearCart = async () => {
    if (cart.length === 0) {
      showAlert('Your cart is already empty.', 'info', 'Nothing to clear');
      return;
    }

    const previousCart = cart;
    saveCart([]);

    try {
      const token = localStorage.getItem('token');
      if (token) {
        await apiService.delete('/cart/clear');
      }
      showAlert('Cart cleared successfully.', 'success', 'Cart updated');
    } catch (error) {
      saveCart(previousCart);
      showAlert(error.message || 'Failed to clear cart.', 'error', 'Cart error');
    }
  };

  const getCartTotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const value = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getProductIconClass
  }), [cart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
