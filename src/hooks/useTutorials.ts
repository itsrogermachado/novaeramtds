import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Tutorial {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration_minutes: number | null;
  video_url: string;
  thumbnail_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TutorialInput {
  title: string;
  description?: string;
  category: string;
  duration_minutes?: number;
  video_url: string;
  thumbnail_url?: string;
}

export function useTutorials() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const fetchTutorials = async () => {
    if (!user) return;
    
    setIsLoading(true);

    const { data, error } = await supabase
      .from('tutorials')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Cast data as Tutorial[] since types may not be updated yet
      const typedData = data as unknown as Tutorial[];
      setTutorials(typedData);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(typedData.map(t => t.category))];
      setCategories(uniqueCategories);
    }
    
    setIsLoading(false);
  };

  const createTutorial = async (tutorial: TutorialInput) => {
    if (!user || !isAdmin) return { error: new Error('Sem permissão') };

    const { error } = await supabase
      .from('tutorials')
      .insert({
        ...tutorial,
        created_by: user.id,
      } as any);

    if (!error) {
      fetchTutorials();
    }

    return { error };
  };

  const updateTutorial = async (id: string, tutorial: Partial<TutorialInput>) => {
    if (!user || !isAdmin) return { error: new Error('Sem permissão') };

    const { error } = await supabase
      .from('tutorials')
      .update(tutorial as any)
      .eq('id', id);

    if (!error) {
      fetchTutorials();
    }

    return { error };
  };

  const deleteTutorial = async (id: string) => {
    if (!user || !isAdmin) return { error: new Error('Sem permissão') };

    const { error } = await supabase
      .from('tutorials')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchTutorials();
    }

    return { error };
  };

  const uploadFile = async (file: File, path: string) => {
    if (!user || !isAdmin) return { error: new Error('Sem permissão'), url: null };

    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('tutorials')
      .upload(fileName, file);

    if (error) return { error, url: null };

    const { data: urlData } = supabase.storage
      .from('tutorials')
      .getPublicUrl(fileName);

    return { error: null, url: urlData.publicUrl };
  };

  const deleteFile = async (url: string) => {
    if (!user || !isAdmin) return { error: new Error('Sem permissão') };

    // Extract path from URL
    const urlParts = url.split('/tutorials/');
    if (urlParts.length < 2) return { error: new Error('URL inválida') };
    
    const path = urlParts[1];

    const { error } = await supabase.storage
      .from('tutorials')
      .remove([path]);

    return { error };
  };

  useEffect(() => {
    if (user) {
      fetchTutorials();
    }
  }, [user]);

  return {
    tutorials,
    categories,
    isLoading,
    createTutorial,
    updateTutorial,
    deleteTutorial,
    uploadFile,
    deleteFile,
    refetch: fetchTutorials,
  };
}
