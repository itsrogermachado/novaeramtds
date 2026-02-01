import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BalanceAdjustment {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  adjustment_date: string;
  created_at: string;
}

interface DateRange {
  start: Date;
  end: Date;
}

export function useBalanceAdjustments(dateRange?: DateRange, userId?: string, showAll?: boolean) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Determine which user_id to filter by
  const effectiveUserId = userId || user?.id;

  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ['balance-adjustments', dateRange?.start, dateRange?.end, effectiveUserId, showAll],
    queryFn: async () => {
      let query = supabase
        .from('balance_adjustments')
        .select('*')
        .order('adjustment_date', { ascending: false });

      if (dateRange) {
        const startDate = dateRange.start.toISOString().split('T')[0];
        const endDate = dateRange.end.toISOString().split('T')[0];
        query = query.gte('adjustment_date', startDate).lte('adjustment_date', endDate);
      }

      // Always filter by user unless showAll is explicitly true (admin global view)
      if (!showAll && effectiveUserId) {
        query = query.eq('user_id', effectiveUserId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BalanceAdjustment[];
    },
    enabled: !!user,
  });

  const createAdjustment = useMutation({
    mutationFn: async (data: { amount: number; description: string; adjustment_date?: string }) => {
      const { error } = await supabase.from('balance_adjustments').insert({
        user_id: user!.id,
        amount: data.amount,
        description: data.description,
        adjustment_date: data.adjustment_date || new Date().toISOString().split('T')[0],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance-adjustments'] });
    },
  });

  const deleteAdjustment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('balance_adjustments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance-adjustments'] });
    },
  });

  // Calculate total adjustments for the period
  const totalAdjustments = adjustments.reduce((sum, adj) => sum + Number(adj.amount), 0);

  return {
    adjustments,
    totalAdjustments,
    isLoading,
    createAdjustment: createAdjustment.mutateAsync,
    deleteAdjustment: deleteAdjustment.mutateAsync,
  };
}
