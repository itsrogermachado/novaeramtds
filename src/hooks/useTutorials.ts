import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TutorialLink {
  id: string;
  tutorial_id: string;
  title: string;
  url: string;
  display_order: number;
  created_at: string;
}

export interface TutorialLinkInput {
  title: string;
  url: string;
  display_order?: number;
}

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
  links?: TutorialLink[];
}

export interface TutorialInput {
  title: string;
  description?: string;
  category: string;
  duration_minutes?: number;
  video_url: string;
  thumbnail_url?: string;
  links?: TutorialLinkInput[];
}

export function useTutorials() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const fetchTutorials = async () => {
    if (!user) return;
    
    setIsLoading(true);

    // Fetch tutorials
    const { data: tutorialsData, error: tutorialsError } = await supabase
      .from('tutorials')
      .select('*')
      .order('created_at', { ascending: false });

    if (tutorialsError || !tutorialsData) {
      setIsLoading(false);
      return;
    }

    // Fetch links for all tutorials
    const { data: linksData } = await supabase
      .from('tutorial_links')
      .select('*')
      .order('display_order', { ascending: true });

    // Map links to tutorials
    const typedTutorials = (tutorialsData as unknown as Tutorial[]).map(tutorial => ({
      ...tutorial,
      links: (linksData as unknown as TutorialLink[] || []).filter(link => link.tutorial_id === tutorial.id)
    }));

    setTutorials(typedTutorials);
    
    // Extract unique categories
    const uniqueCategories = [...new Set(typedTutorials.map(t => t.category))];
    setCategories(uniqueCategories);
    
    setIsLoading(false);
  };

  const createTutorial = async (tutorial: TutorialInput) => {
    if (!user || !isAdmin) return { error: new Error('Sem permissão') };

    const { links, ...tutorialData } = tutorial;

    const { data, error } = await supabase
      .from('tutorials')
      .insert({
        ...tutorialData,
        created_by: user.id,
      } as any)
      .select()
      .single();

    if (error) return { error };

    // Create links if provided
    if (links && links.length > 0 && data) {
      const linksToInsert = links.map((link, index) => ({
        tutorial_id: data.id,
        title: link.title,
        url: link.url,
        display_order: link.display_order ?? index,
      }));

      await supabase
        .from('tutorial_links')
        .insert(linksToInsert as any);
    }

    fetchTutorials();
    return { error: null };
  };

  const updateTutorial = async (id: string, tutorial: Partial<TutorialInput>) => {
    if (!user || !isAdmin) return { error: new Error('Sem permissão') };

    const { links, ...tutorialData } = tutorial;

    // Update tutorial data
    if (Object.keys(tutorialData).length > 0) {
      const { error } = await supabase
        .from('tutorials')
        .update(tutorialData as any)
        .eq('id', id);

      if (error) return { error };
    }

    // Update links if provided
    if (links !== undefined) {
      // Delete existing links
      await supabase
        .from('tutorial_links')
        .delete()
        .eq('tutorial_id', id);

      // Insert new links
      if (links.length > 0) {
        const linksToInsert = links.map((link, index) => ({
          tutorial_id: id,
          title: link.title,
          url: link.url,
          display_order: link.display_order ?? index,
        }));

        await supabase
          .from('tutorial_links')
          .insert(linksToInsert as any);
      }
    }

    fetchTutorials();
    return { error: null };
  };

  const deleteTutorial = async (id: string) => {
    if (!user || !isAdmin) return { error: new Error('Sem permissão') };

    // Links are deleted automatically via ON DELETE CASCADE
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
