import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DutchingHistoryEntry {
  id: string;
  user_id: string;
  total_invested: number;
  odds: number[];
  stakes: number[];
  guaranteed_return: number;
  profit: number;
  roi: number;
  observation: string | null;
  created_at: string;
}

export interface CreateDutchingEntryData {
  total_invested: number;
  odds: number[];
  stakes: number[];
  guaranteed_return: number;
  profit: number;
  roi: number;
}

export function useDutchingHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<DutchingHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('dutching_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      // Transform data to handle array types
      const transformed = data.map((entry: Record<string, unknown>) => ({
        id: entry.id as string,
        user_id: entry.user_id as string,
        total_invested: Number(entry.total_invested),
        odds: (entry.odds as string[]).map(Number),
        stakes: (entry.stakes as string[]).map(Number),
        guaranteed_return: Number(entry.guaranteed_return),
        profit: Number(entry.profit),
        roi: Number(entry.roi),
        observation: entry.observation as string | null,
        created_at: entry.created_at as string,
      }));
      setHistory(transformed);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const createEntry = async (data: CreateDutchingEntryData) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { error } = await supabase
      .from('dutching_history')
      .insert({
        user_id: user.id,
        total_invested: data.total_invested,
        odds: data.odds,
        stakes: data.stakes,
        guaranteed_return: data.guaranteed_return,
        profit: data.profit,
        roi: data.roi,
      });

    if (!error) {
      await fetchHistory();
    }

    return { error };
  };

  const updateObservation = async (id: string, observation: string) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { error } = await supabase
      .from('dutching_history')
      .update({ observation })
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setHistory(prev =>
        prev.map(entry =>
          entry.id === id ? { ...entry, observation } : entry
        )
      );
    }

    return { error };
  };

  const deleteEntry = async (id: string) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { error } = await supabase
      .from('dutching_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setHistory(prev => prev.filter(entry => entry.id !== id));
    }

    return { error };
  };

  return {
    history,
    isLoading,
    createEntry,
    updateObservation,
    deleteEntry,
    refetch: fetchHistory,
  };
}
