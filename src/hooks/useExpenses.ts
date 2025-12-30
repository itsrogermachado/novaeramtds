import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  expense_date: string;
  created_at: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

export function useExpenses(dateRange?: { start: Date; end: Date }, userId?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchExpenses = async () => {
    setIsLoading(true);
    
    let query = supabase
      .from('expenses')
      .select(`
        *,
        category:expense_categories(id, name, color)
      `)
      .order('expense_date', { ascending: false });

    if (userId && isAdmin) {
      query = query.eq('user_id', userId);
    } else if (!isAdmin && user) {
      query = query.eq('user_id', user.id);
    }

    if (dateRange) {
      query = query
        .gte('expense_date', dateRange.start.toISOString().split('T')[0])
        .lte('expense_date', dateRange.end.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (!error && data) {
      setExpenses(data);
    }
    
    setIsLoading(false);
  };

  const createExpense = async (expense: {
    category_id: string;
    description: string;
    amount: number;
    expense_date: string;
  }) => {
    if (!user) return { error: new Error('Usuário não autenticado') };

    const { error } = await supabase
      .from('expenses')
      .insert({
        ...expense,
        user_id: user.id,
      });

    if (!error) {
      fetchExpenses();
    }

    return { error };
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    const { error } = await supabase
      .from('expenses')
      .update(expense)
      .eq('id', id);

    if (!error) {
      fetchExpenses();
    }

    return { error };
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchExpenses();
    }

    return { error };
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user, dateRange, userId, isAdmin]);

  return {
    expenses,
    categories,
    isLoading,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  };
}
