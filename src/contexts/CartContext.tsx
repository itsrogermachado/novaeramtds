import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { StoreProductWithCategory } from '@/hooks/useStoreProducts';
import { StoreCoupon } from '@/hooks/useStoreCoupons';
import { toast } from 'sonner';

export interface CartItem {
  product: StoreProductWithCategory;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  appliedCoupon: StoreCoupon | null;
  discountAmount: number;
  addItem: (product: StoreProductWithCategory, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  applyCoupon: (coupon: StoreCoupon, discount: number) => void;
  removeCoupon: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'nova-era-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<StoreCoupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }, [items]);

  const parsePrice = (price: string): number => {
    return parseFloat(price.replace(',', '.').replace(/[^\d.]/g, '')) || 0;
  };

  const getAvailableStock = (product: StoreProductWithCategory): number => {
    if (!product.stock || product.stock.trim() === '') return 0;
    const stockLines = product.stock.split('\n').filter(line => line.trim());
    return product.product_type === 'lines' ? stockLines.length : 1;
  };

  const addItem = useCallback((product: StoreProductWithCategory, quantity = 1) => {
    const availableStock = getAvailableStock(product);
    if (availableStock === 0) {
      toast.error('Produto esgotado');
      return;
    }

    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const maxQty = product.max_quantity && product.max_quantity > 0 
          ? Math.min(product.max_quantity, availableStock) 
          : availableStock;
        const newQty = Math.min(existing.quantity + quantity, maxQty);
        
        if (newQty === existing.quantity) {
          toast.info('Quantidade máxima atingida');
          return prev;
        }
        
        const updated = [...prev];
        updated[existingIndex] = { ...existing, quantity: newQty };
        toast.success('Quantidade atualizada no carrinho');
        return updated;
      }
      
      const minQty = product.min_quantity || 1;
      const addQty = Math.max(quantity, minQty);
      toast.success('Produto adicionado ao carrinho');
      return [...prev, { product, quantity: addQty }];
    });
    
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
    toast.success('Produto removido do carrinho');
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems(prev => {
      return prev.map(item => {
        if (item.product.id !== productId) return item;
        
        const availableStock = getAvailableStock(item.product);
        const minQty = item.product.min_quantity || 1;
        const maxQty = item.product.max_quantity && item.product.max_quantity > 0 
          ? Math.min(item.product.max_quantity, availableStock) 
          : availableStock;
        
        const newQty = Math.max(minQty, Math.min(quantity, maxQty));
        return { ...item, quantity: newQty };
      });
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    toast.success('Carrinho limpo');
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), []);

  const applyCoupon = useCallback((coupon: StoreCoupon, discount: number) => {
    setAppliedCoupon(coupon);
    setDiscountAmount(discount);
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  }, []);

  const getSubtotal = useCallback(() => {
    return items.reduce((total, item) => {
      return total + parsePrice(item.product.price) * item.quantity;
    }, 0);
  }, [items]);

  const getTotal = useCallback(() => {
    return Math.max(0, getSubtotal() - discountAmount);
  }, [getSubtotal, discountAmount]);

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      isOpen,
      appliedCoupon,
      discountAmount,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
      applyCoupon,
      removeCoupon,
      getSubtotal,
      getTotal,
      itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
