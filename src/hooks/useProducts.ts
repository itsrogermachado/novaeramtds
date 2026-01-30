import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  created_at: string;
}

export interface DigitalProduct {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  delivery_type: string;
  delivery_content: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: ProductCategory;
}

export interface ProductPurchase {
  id: string;
  user_id: string;
  product_id: string;
  transaction_id: string | null;
  amount_paid: number;
  status: string;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
  product?: DigitalProduct;
}

export function useProductCategories() {
  return useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as ProductCategory[];
    },
  });
}

export function useProducts(categoryId?: string | null) {
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('digital_products')
        .select(`
          *,
          category:product_categories(*)
        `)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DigitalProduct[];
    },
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_products')
        .select(`
          *,
          category:product_categories(*)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      return data as DigitalProduct[];
    },
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_products')
        .select(`
          *,
          category:product_categories(*)
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as DigitalProduct;
    },
    enabled: !!productId,
  });
}

export function useUserPurchases() {
  return useQuery({
    queryKey: ['user-purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_purchases')
        .select(`
          *,
          product:digital_products(*)
        `)
        .eq('status', 'completed')
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      return data as ProductPurchase[];
    },
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      productId, 
      transactionId, 
      amountPaid 
    }: { 
      productId: string; 
      transactionId: string; 
      amountPaid: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('product_purchases')
        .insert({
          user_id: user.id,
          product_id: productId,
          transaction_id: transactionId,
          amount_paid: amountPaid,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-purchases'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_products')
        .select(`
          *,
          category:product_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DigitalProduct[];
    },
  });
}

export function useManageProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createProduct = useMutation({
    mutationFn: async (product: Omit<DigitalProduct, 'id' | 'created_at' | 'updated_at' | 'category'>) => {
      const { data, error } = await supabase
        .from('digital_products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      toast({ title: 'Produto criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar produto', description: error.message, variant: 'destructive' });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...product }: Partial<DigitalProduct> & { id: string }) => {
      const { data, error } = await supabase
        .from('digital_products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      toast({ title: 'Produto atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar produto', description: error.message, variant: 'destructive' });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('digital_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      toast({ title: 'Produto excluído!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir produto', description: error.message, variant: 'destructive' });
    },
  });

  return { createProduct, updateProduct, deleteProduct };
}
