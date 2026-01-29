import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MethodCategory {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface MethodPost {
  id: string;
  category_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  link_url: string | null;
  link_text: string | null;
  created_at: string;
  updated_at: string;
  category?: MethodCategory;
}

export function useMethodCategories() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['method-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('method_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as MethodCategory[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: result, error } = await supabase
        .from('method_categories')
        .insert({ ...data, created_by: user.user.id })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['method-categories'] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; color: string }) => {
      const { error } = await supabase
        .from('method_categories')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['method-categories'] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('method_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['method-categories'] });
      queryClient.invalidateQueries({ queryKey: ['method-posts'] });
    },
  });

  return {
    categories,
    isLoading,
    createCategory: createCategory.mutateAsync,
    updateCategory: updateCategory.mutateAsync,
    deleteCategory: deleteCategory.mutateAsync,
  };
}

export function useMethodPosts(categoryId?: string) {
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['method-posts', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('method_posts')
        .select(`
          *,
          category:method_categories(*)
        `)
        .order('created_at', { ascending: false });
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MethodPost[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (data: {
      category_id: string;
      content: string;
      image_url?: string;
      video_url?: string;
      link_url?: string;
      link_text?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: result, error } = await supabase
        .from('method_posts')
        .insert({ ...data, created_by: user.user.id })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['method-posts'] });
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      category_id: string;
      content: string;
      image_url?: string | null;
      video_url?: string | null;
      link_url?: string | null;
      link_text?: string | null;
    }) => {
      const { error } = await supabase
        .from('method_posts')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['method-posts'] });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('method_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['method-posts'] });
    },
  });

  return {
    posts,
    isLoading,
    createPost: createPost.mutateAsync,
    updatePost: updatePost.mutateAsync,
    deletePost: deletePost.mutateAsync,
  };
}
