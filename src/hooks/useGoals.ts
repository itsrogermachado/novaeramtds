import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type GoalType = 'monthly' | 'daily' | 'weekly';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  deadline: string | null;
  created_at: string;
  goal_type: GoalType;
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchGoals = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGoals(data as Goal[]);
    }
    
    setIsLoading(false);
  };

  const createGoal = async (goal: {
    title: string;
    target_amount: number;
    current_amount?: number;
    deadline?: string;
    goal_type?: GoalType;
  }) => {
    if (!user) return { error: new Error('Usuário não autenticado') };

    const { error } = await supabase
      .from('goals')
      .insert({
        ...goal,
        goal_type: goal.goal_type || 'monthly',
        user_id: user.id,
      });

    if (!error) {
      fetchGoals();
    }

    return { error };
  };

  const updateGoal = async (id: string, goal: Partial<Goal>) => {
    const { error } = await supabase
      .from('goals')
      .update(goal)
      .eq('id', id);

    if (!error) {
      fetchGoals();
    }

    return { error };
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchGoals();
    }

    return { error };
  };

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  return {
    goals,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals,
  };
}
