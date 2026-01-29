import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
    setIsLoading(false);
  };

  const updateProfile = async (updates: { full_name?: string }) => {
    if (!user) return { error: new Error('Not authenticated') };

    setIsUpdating(true);
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive',
      });
      setIsUpdating(false);
      return { error };
    }

    setProfile((prev) => prev ? { ...prev, ...updates } : null);
    toast({
      title: 'Perfil atualizado',
      description: 'Suas informações foram salvas com sucesso.',
    });
    setIsUpdating(false);
    return { error: null };
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: new Error('Not authenticated'), url: null };

    setIsUpdating(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Delete old avatar if exists
    if (profile?.avatar_url) {
      const oldPath = profile.avatar_url.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
    }

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer upload da imagem.',
        variant: 'destructive',
      });
      setIsUpdating(false);
      return { error: uploadError, url: null };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a imagem no perfil.',
        variant: 'destructive',
      });
      setIsUpdating(false);
      return { error: updateError, url: null };
    }

    setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : null);
    toast({
      title: 'Avatar atualizado',
      description: 'Sua foto de perfil foi alterada com sucesso.',
    });
    setIsUpdating(false);
    return { error: null, url: avatarUrl };
  };

  const removeAvatar = async () => {
    if (!user || !profile?.avatar_url) return { error: null };

    setIsUpdating(true);

    const oldPath = profile.avatar_url.split('/avatars/')[1];
    if (oldPath) {
      await supabase.storage.from('avatars').remove([oldPath]);
    }

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o avatar.',
        variant: 'destructive',
      });
      setIsUpdating(false);
      return { error };
    }

    setProfile((prev) => prev ? { ...prev, avatar_url: null } : null);
    toast({
      title: 'Avatar removido',
      description: 'Sua foto de perfil foi removida.',
    });
    setIsUpdating(false);
    return { error: null };
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    isLoading,
    isUpdating,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    refetch: fetchProfile,
  };
}
