
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of a single cart item
export interface CartItem {
  id: string; // Product ID
  name: string;
  price: number;
  image: string;
  quantity: number;
  size: string;
  color: string;
}

// Define the shape of the context
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (uniqueId: string) => void;
  updateQuantity: (uniqueId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
}

// Create the context with a default value
const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper function to create a unique ID for a cart item based on product, size, and color
const getUniqueCartItemId = (item: {id: string; size: string; color: string}) => `${item.id}-${item.size}-${item.color}`;

// Create a provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
        setCartItems([]);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (itemToAdd: CartItem) => {
    setCartItems(prevItems => {
      const uniqueId = getUniqueCartItemId(itemToAdd);
      const existingItem = prevItems.find(item => getUniqueCartItemId(item) === uniqueId);

      if (existingItem) {
        // If item with same id, size, and color exists, update its quantity
        return prevItems.map(item =>
          getUniqueCartItemId(item) === uniqueId
            ? { ...item, quantity: item.quantity + itemToAdd.quantity }
            : item
        );
      } else {
        // Otherwise, add it as a new item
        return [...prevItems, itemToAdd];
      }
    });
  };

  const removeFromCart = (uniqueId: string) => {
    setCartItems(prevItems => prevItems.filter(item => getUniqueCartItemId(item) !== uniqueId));
  };

  const updateQuantity = (uniqueId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(uniqueId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item => (getUniqueCartItemId(item) === uniqueId ? { ...item, quantity } : item))
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
