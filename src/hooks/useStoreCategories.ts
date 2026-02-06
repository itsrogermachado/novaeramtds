 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 
 export interface StoreCategory {
   id: string;
   name: string;
   slug: string;
   description: string | null;
   icon: string | null;
   status: 'active' | 'inactive';
   display_order: number;
   created_at: string;
   updated_at: string;
 }
 
 export function useStoreCategories(onlyActive = false) {
   const [categories, setCategories] = useState<StoreCategory[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const { isAdmin } = useAuth();
 
   const fetchCategories = async () => {
     setIsLoading(true);
     
     let query = supabase
       .from('store_categories')
       .select('*')
       .order('display_order', { ascending: true });
     
     if (onlyActive) {
       query = query.eq('status', 'active');
     }
     
     const { data, error } = await query;
     
     if (error) {
       console.error('Error fetching categories:', error);
     } else {
       setCategories((data || []) as StoreCategory[]);
     }
     setIsLoading(false);
   };
 
   const createCategory = async (category: Omit<StoreCategory, 'id' | 'created_at' | 'updated_at'>) => {
     if (!isAdmin) {
       toast.error('Apenas administradores podem criar categorias');
       return { error: 'Unauthorized' };
     }
 
     const { data, error } = await supabase
       .from('store_categories')
       .insert(category)
       .select()
       .single();
 
     if (error) {
       toast.error('Erro ao criar categoria');
       return { error };
     }
 
     toast.success('Categoria criada com sucesso!');
     fetchCategories();
     return { data };
   };
 
   const updateCategory = async (id: string, updates: Partial<StoreCategory>) => {
     if (!isAdmin) {
       toast.error('Apenas administradores podem editar categorias');
       return { error: 'Unauthorized' };
     }
 
     const { error } = await supabase
       .from('store_categories')
       .update(updates)
       .eq('id', id);
 
     if (error) {
       toast.error('Erro ao atualizar categoria');
       return { error };
     }
 
     toast.success('Categoria atualizada!');
     fetchCategories();
     return { success: true };
   };
 
   const deleteCategory = async (id: string) => {
     if (!isAdmin) {
       toast.error('Apenas administradores podem remover categorias');
       return { error: 'Unauthorized' };
     }
 
     const { error } = await supabase
       .from('store_categories')
       .delete()
       .eq('id', id);
 
     if (error) {
       toast.error('Erro ao remover categoria');
       return { error };
     }
 
    toast.success('Categoria removida!');
    fetchCategories();
    return { success: true };
  };

  const reorderCategory = async (id: string, direction: 'up' | 'down') => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem reordenar categorias');
      return { error: 'Unauthorized' };
    }

    const currentIndex = categories.findIndex(c => c.id === id);
    if (currentIndex === -1) return { error: 'Not found' };
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return { error: 'Out of bounds' };

    const currentCategory = categories[currentIndex];
    const targetCategory = categories[targetIndex];

    // Swap display_order values
    const updates = [
      supabase.from('store_categories').update({ display_order: targetCategory.display_order }).eq('id', currentCategory.id),
      supabase.from('store_categories').update({ display_order: currentCategory.display_order }).eq('id', targetCategory.id),
    ];

    const results = await Promise.all(updates);
    const hasError = results.some(r => r.error);

    if (hasError) {
      toast.error('Erro ao reordenar categoria');
      return { error: 'Update failed' };
    }

    fetchCategories();
    return { success: true };
  };

  useEffect(() => {
    fetchCategories();
  }, [onlyActive]);

  return {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategory,
    refetch: fetchCategories,
  };
}