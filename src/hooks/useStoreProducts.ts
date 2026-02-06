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
}
 
 export interface StoreProductWithCategory extends StoreProduct {
   store_categories?: { name: string; slug: string } | null;
 }
 
 export function useStoreProducts(categoryId?: string, onlyActive = false) {
   const [products, setProducts] = useState<StoreProductWithCategory[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const { isAdmin } = useAuth();
 
   const fetchProducts = async () => {
     setIsLoading(true);
     
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
 
   useEffect(() => {
     fetchProducts();
   }, [categoryId, onlyActive]);
 
   return {
     products,
     isLoading,
     createProduct,
     updateProduct,
     deleteProduct,
     refetch: fetchProducts,
   };
 }