import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
 
export interface StoreProduct {
  id: string;
  category_id: string;
  name: string;
  short_description: string | null;
  long_description: string | null;
  price: string;
  comparison_price: string | null;
  slug: string | null;
  video_url: string | null;
  delivery_type: 'manual' | 'automatic';
  product_type: 'text' | 'lines';
  min_quantity: number;
  max_quantity: number;
  stock: string | null;
  post_sale_instructions: string | null;
  auto_open_chat: boolean;
  is_private: boolean;
  is_hidden: boolean;
  hide_sold_count: boolean;
  is_featured: boolean;
  status: 'active' | 'inactive';
  cta_url: string | null;
  image_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  // Added for public view compatibility
  stock_available?: number;
}
 
export interface StoreProductWithCategory extends StoreProduct {
  store_categories?: { name: string; slug: string } | null;
}

// Helper to calculate stock availability from product data
export function getProductStockCount(product: StoreProduct): number {
  // If stock_available is provided (from public view), use it
  if (typeof product.stock_available === 'number') {
    return product.stock_available;
  }
  // Otherwise calculate from stock field (admin view)
  if (!product.stock || product.stock.trim() === '') {
    return 0;
  }
  if (product.product_type === 'lines') {
    return product.stock.split('\n').filter(line => line.trim()).length;
  }
  return 1;
}

export function isProductInStock(product: StoreProduct): boolean {
  return getProductStockCount(product) > 0;
}
 
export function useStoreProducts(categoryId?: string, onlyActive = false) {
  const [products, setProducts] = useState<StoreProductWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, user } = useAuth();

  const fetchProducts = async () => {
    setIsLoading(true);
    
    // Admins fetch from the main table to see stock content
    // Regular users/guests fetch from the secure public view
    if (isAdmin) {
      let query = supabase
        .from('store_products')
        .select('*, store_categories(name, slug)')
        .order('display_order', { ascending: true });
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      if (onlyActive) {
        query = query.eq('status', 'active');
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts((data || []) as StoreProductWithCategory[]);
      }
    } else {
      // For non-admins, use the public view that excludes sensitive stock data
      let query = supabase
        .from('store_products_public')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching products from public view:', error);
        // Fallback: try authenticated table access if user is logged in
        if (user) {
          const fallbackQuery = supabase
            .from('store_products')
            .select('*, store_categories(name, slug)')
            .eq('status', 'active')
            .order('display_order', { ascending: true });
          
          const fallbackResult = categoryId 
            ? await fallbackQuery.eq('category_id', categoryId)
            : await fallbackQuery;
          
          if (!fallbackResult.error) {
            setProducts((fallbackResult.data || []) as StoreProductWithCategory[]);
          }
        }
      } else {
        // Map public view data to product format
        const mappedProducts = (data || []).map(p => ({
          ...p,
          stock: null, // Stock content is not exposed
          post_sale_instructions: null, // Not exposed to public
          product_type: 'lines' as const, // Default, not critical for display
          delivery_type: 'automatic' as const,
          store_categories: null, // View doesn't include join
        })) as StoreProductWithCategory[];
        setProducts(mappedProducts);
      }
    }
    
    setIsLoading(false);
  };
 
   const createProduct = async (product: Omit<StoreProduct, 'id' | 'created_at' | 'updated_at'>) => {
     if (!isAdmin) {
       toast.error('Apenas administradores podem criar produtos');
       return { error: 'Unauthorized' };
     }
 
     const { data, error } = await supabase
       .from('store_products')
       .insert(product)
       .select()
       .single();
 
     if (error) {
       toast.error('Erro ao criar produto');
       return { error };
     }
 
     toast.success('Produto criado com sucesso!');
     fetchProducts();
     return { data };
   };
 
   const updateProduct = async (id: string, updates: Partial<StoreProduct>) => {
     if (!isAdmin) {
       toast.error('Apenas administradores podem editar produtos');
       return { error: 'Unauthorized' };
     }
 
     const { error } = await supabase
       .from('store_products')
       .update(updates)
       .eq('id', id);
 
     if (error) {
       toast.error('Erro ao atualizar produto');
       return { error };
     }
 
     toast.success('Produto atualizado!');
     fetchProducts();
     return { success: true };
   };
 
   const deleteProduct = async (id: string) => {
     if (!isAdmin) {
       toast.error('Apenas administradores podem remover produtos');
       return { error: 'Unauthorized' };
     }
 
     const { error } = await supabase
       .from('store_products')
       .delete()
       .eq('id', id);
 
     if (error) {
       toast.error('Erro ao remover produto');
       return { error };
     }
 
    toast.success('Produto removido!');
    fetchProducts();
    return { success: true };
  };

  const reorderProduct = async (id: string, direction: 'up' | 'down') => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem reordenar produtos');
      return { error: 'Unauthorized' };
    }

    const currentIndex = products.findIndex(p => p.id === id);
    if (currentIndex === -1) return { error: 'Not found' };
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return { error: 'Out of bounds' };

    const currentProduct = products[currentIndex];
    const targetProduct = products[targetIndex];

    // Swap display_order values
    const updates = [
      supabase.from('store_products').update({ display_order: targetProduct.display_order }).eq('id', currentProduct.id),
      supabase.from('store_products').update({ display_order: currentProduct.display_order }).eq('id', targetProduct.id),
    ];

    const results = await Promise.all(updates);
    const hasError = results.some(r => r.error);

    if (hasError) {
      toast.error('Erro ao reordenar produto');
      return { error: 'Update failed' };
    }

    fetchProducts();
    return { success: true };
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryId, onlyActive]);

  return {
    products,
    isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
    reorderProduct,
    refetch: fetchProducts,
  };
}