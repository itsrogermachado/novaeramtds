import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, MembershipTier } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserMembership {
  id: string;
  user_id: string;
  tier: MembershipTier;
  created_at: string;
  updated_at: string;
}

export function useUserMemberships() {
  const [memberships, setMemberships] = useState<Map<string, MembershipTier>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchMemberships = async () => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_memberships')
      .select('user_id, tier');

    if (error) {
      console.error('Error fetching memberships:', error);
      setIsLoading(false);
      return;
    }

    const membershipMap = new Map<string, MembershipTier>();
    (data ?? []).forEach((m) => {
      membershipMap.set(m.user_id, m.tier as MembershipTier);
    });
    setMemberships(membershipMap);
    setIsLoading(false);
  };

  const updateMembership = async (userId: string, tier: MembershipTier) => {
    if (!isAdmin) return { error: new Error('Unauthorized') };

    // Check if membership exists
    const { data: existing } = await supabase
      .from('user_memberships')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let error;

    if (existing) {
      // Update existing
      const result = await supabase
        .from('user_memberships')
        .update({ tier })
        .eq('user_id', userId);
      error = result.error;
    } else {
      // Insert new
      const result = await supabase
        .from('user_memberships')
        .insert({ user_id: userId, tier });
      error = result.error;
    }

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o plano do usuário.',
        variant: 'destructive',
      });
      return { error };
    }

    // Update local state
    setMemberships((prev) => {
      const newMap = new Map(prev);
      newMap.set(userId, tier);
      return newMap;
    });

    toast({
      title: 'Plano atualizado',
      description: `Usuário agora é ${tier === 'vip' ? 'Membro VIP' : 'Membro Free'}.`,
    });

    return { error: null };
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMemberships();
    }
  }, [isAdmin]);

  return {
    memberships,
    isLoading,
    updateMembership,
    refetch: fetchMemberships,
  };
}
