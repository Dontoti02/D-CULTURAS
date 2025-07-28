
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Promotion } from '@/lib/types';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CartItem {
  id: string; // Product ID
  name: string;
  price: number;
  image: string;
  quantity: number;
  size: string;
  color: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (uniqueId: string) => void;
  updateQuantity: (uniqueId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  total: number;
  appliedCoupon: Promotion | null;
  couponDiscount: number;
  couponError: string | null;
  loadingCoupon: boolean;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getUniqueCartItemId = (item: {id: string; size: string; color: string}) => `${item.id}-${item.size}-${item.color}`;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Promotion | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [loadingCoupon, setLoadingCoupon] = useState(false);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
      const storedCoupon = localStorage.getItem('coupon');
      if (storedCoupon) {
        const parsedCoupon = JSON.parse(storedCoupon) as Promotion;
        // Firestore timestamps are not plain objects, need to re-instantiate
        parsedCoupon.startDate = new Timestamp(parsedCoupon.startDate.seconds, parsedCoupon.startDate.nanoseconds);
        parsedCoupon.endDate = new Timestamp(parsedCoupon.endDate.seconds, parsedCoupon.endDate.nanoseconds);
        setAppliedCoupon(parsedCoupon);
      }
    } catch (error) {
        console.error("Failed to parse from localStorage", error);
        setCartItems([]);
        setAppliedCoupon(null);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);
  
  useEffect(() => {
    if (appliedCoupon) {
        localStorage.setItem('coupon', JSON.stringify(appliedCoupon));
    } else {
        localStorage.removeItem('coupon');
    }
  }, [appliedCoupon]);


  const applyCoupon = useCallback(async (code: string) => {
    setLoadingCoupon(true);
    setCouponError(null);
    
    try {
      const q = query(collection(db, "promotions"), where("code", "==", code));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setCouponError("El código del cupón no es válido.");
        setAppliedCoupon(null);
        return;
      }
      
      const promoDoc = querySnapshot.docs[0];
      const promotion = { id: promoDoc.id, ...promoDoc.data() } as Promotion;
      const now = new Date();

      if (promotion.status !== 'active' || promotion.startDate.toDate() > now || promotion.endDate.toDate() < now) {
          setCouponError("Este cupón no está activo o ha expirado.");
          setAppliedCoupon(null);
          return;
      }

      setAppliedCoupon(promotion);
    } catch (error) {
      console.error("Error applying coupon: ", error);
      setCouponError("No se pudo aplicar el cupón. Inténtalo de nuevo.");
      setAppliedCoupon(null);
    } finally {
      setLoadingCoupon(false);
    }
  }, []);

  const removeCoupon = useCallback(() => {
      setAppliedCoupon(null);
      setCouponError(null);
  }, []);

  const addToCart = (itemToAdd: CartItem) => {
    setCartItems(prevItems => {
      const uniqueId = getUniqueCartItemId(itemToAdd);
      const existingItem = prevItems.find(item => getUniqueCartItemId(item) === uniqueId);

      if (existingItem) {
        return prevItems.map(item =>
          getUniqueCartItemId(item) === uniqueId
            ? { ...item, quantity: item.quantity + itemToAdd.quantity }
            : item
        );
      } else {
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
    removeCoupon();
  };

  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
  
  const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.type === 'percentage') {
        return subtotal * (appliedCoupon.value / 100);
    }
    if (appliedCoupon.type === 'fixed') {
        return Math.min(appliedCoupon.value, subtotal); // Discount can't be more than subtotal
    }
    return 0;
  }, [appliedCoupon, subtotal]);

  const total = useMemo(() => {
      const finalTotal = subtotal - couponDiscount;
      return finalTotal > 0 ? finalTotal : 0;
  }, [subtotal, couponDiscount]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        subtotal,
        total,
        appliedCoupon,
        couponDiscount,
        couponError,
        loadingCoupon,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
