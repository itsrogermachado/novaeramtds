import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MethodCategory {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface MethodLink {
  id?: string;
  title: string;
  url: string;
  display_order: number;
}

export interface MethodPost {
  id: string;
  category_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  updated_at: string;
  category?: MethodCategory;
  links?: MethodLink[];
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
      return result as MethodCategory;
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
          category:method_categories(*),
          links:method_links(*)
        `)
        .order('created_at', { ascending: false });
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Sort links by display_order
      return (data as MethodPost[]).map(post => ({
        ...post,
        links: post.links?.sort((a, b) => a.display_order - b.display_order) || []
      }));
    },
  });

  const createPost = useMutation({
    mutationFn: async (data: {
      category_id: string;
      content: string;
      image_url?: string | null;
      video_url?: string | null;
      links?: MethodLink[];
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { links, ...postData } = data;

      const { data: result, error } = await supabase
        .from('method_posts')
        .insert({ ...postData, created_by: user.user.id })
        .select()
        .single();
      
      if (error) throw error;

      // Insert links if provided
      if (links && links.length > 0) {
        const linksToInsert = links.map((link, index) => ({
          method_id: result.id,
          title: link.title,
          url: link.url,
          display_order: index,
        }));

        const { error: linksError } = await supabase
          .from('method_links')
          .insert(linksToInsert);
        
        if (linksError) throw linksError;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['method-posts'] });
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, links, ...data }: {
      id: string;
      category_id: string;
      content: string;
      image_url?: string | null;
      video_url?: string | null;
      links?: MethodLink[];
    }) => {
      const { error } = await supabase
        .from('method_posts')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;

      // Delete existing links and insert new ones
      await supabase
        .from('method_links')
        .delete()
        .eq('method_id', id);

      if (links && links.length > 0) {
        const linksToInsert = links.map((link, index) => ({
          method_id: id,
          title: link.title,
          url: link.url,
          display_order: index,
        }));

        const { error: linksError } = await supabase
          .from('method_links')
          .insert(linksToInsert);
        
        if (linksError) throw linksError;
      }
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

  const uploadFile = async (file: File, type: 'image' | 'video'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('methods')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('methods')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  return {
    posts,
    isLoading,
    createPost: createPost.mutateAsync,
    updatePost: updatePost.mutateAsync,
    deletePost: deletePost.mutateAsync,
    uploadFile,
  };
}
