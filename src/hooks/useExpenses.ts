import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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

export function useExpenses(dateRange?: { start: Date; end: Date }, userId?: string, showAll?: boolean) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [upcomingExpenses, setUpcomingExpenses] = useState<Expense[]>([]);
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

    // If showAll is true and user is admin, don't filter (global view)
    if (showAll && isAdmin) {
      // No user_id filter - admin sees all expenses
    } else if (userId && isAdmin) {
      // Admin viewing specific user
      query = query.eq('user_id', userId);
    } else if (user) {
      // Any user (including admin) viewing their own data
      query = query.eq('user_id', user.id);
    }

    if (dateRange) {
      query = query
        .gte('expense_date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('expense_date', format(dateRange.end, 'yyyy-MM-dd'));
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

  const fetchUpcomingExpenses = async () => {
    if (!user) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('expenses')
      .select(`*, category:expense_categories(id, name, color)`)
      .eq('user_id', user.id)
      .gt('expense_date', today)
      .order('expense_date', { ascending: true });

    if (!error && data) {
      setUpcomingExpenses(data);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchUpcomingExpenses();
    }
  }, [user, dateRange, userId, isAdmin, showAll]);

  return {
    expenses,
    upcomingExpenses,
    categories,
    isLoading,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  };
}
