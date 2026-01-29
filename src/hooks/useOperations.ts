import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Operation {
  id: string;
  user_id: string;
  method_id: string | null;
  invested_amount: number;
  return_amount: number;
  operation_date: string;
  notes: string | null;
  created_at: string;
  method?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface OperationMethod {
  id: string;
  name: string;
  color: string;
  created_by?: string | null;
}

export function useOperations(dateRange?: { start: Date; end: Date }, userId?: string, showAll?: boolean) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [methods, setMethods] = useState<OperationMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin, isLoading: authLoading } = useAuth();

  // Backend queries default to a max of 1000 rows. We page results to avoid
  // incorrect totals in Global/Admin views.
  const PAGE_SIZE = 1000;

  const fetchMethods = async () => {
    if (!user) return;
    
    // Filter methods: user's own methods + global methods (created_by is null)
    const { data, error } = await supabase
      .from('operation_methods')
      .select('*')
      .or(`created_by.eq.${user.id},created_by.is.null`)
      .order('name');
    
    if (!error && data) {
      setMethods(data);
    }
  };

  const fetchOperations = async () => {
    if (!user) return;

    // If showAll is requested but auth is still loading, wait.
    // This prevents fetching with incorrect isAdmin state.
    if (showAll && authLoading) return;

    const buildQuery = () => {
      let query = supabase
        .from('operations')
        .select(
          `
          *,
          method:operation_methods(id, name, color)
        `,
        )
        .order('operation_date', { ascending: false });

      if (showAll && isAdmin) {
        // No user_id filter - admin sees all operations via RLS policy
      } else if (userId && isAdmin) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('user_id', user.id);
      }

      if (dateRange) {
        query = query
          .gte('operation_date', format(dateRange.start, 'yyyy-MM-dd'))
          .lte('operation_date', format(dateRange.end, 'yyyy-MM-dd'));
      }

      return query;
    };

    setIsLoading(true);

    const all: Operation[] = [];
    let from = 0;
    let hadError = false;

    while (true) {
      const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
      if (error) {
        hadError = true;
        break;
      }

      const page = (data ?? []) as Operation[];
      all.push(...page);

      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    // If there was an error, keep the previous state to avoid blank UI.
    if (!hadError) setOperations(all);

    setIsLoading(false);
  };

  const createOperation = async (operation: {
    method_id: string;
    invested_amount: number;
    return_amount: number;
    operation_date: string;
    notes?: string;
  }) => {
    if (!user) return { error: new Error('Usuário não autenticado') };

    const { error } = await supabase
      .from('operations')
      .insert({
        ...operation,
        user_id: user.id,
      });

    if (!error) {
      fetchOperations();
    }

    return { error };
  };

  const updateOperation = async (id: string, operation: Partial<Operation>) => {
    const { error } = await supabase
      .from('operations')
      .update(operation)
      .eq('id', id);

    if (!error) {
      fetchOperations();
    }

    return { error };
  };

  const deleteOperation = async (id: string) => {
    const { error } = await supabase
      .from('operations')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchOperations();
    }

    return { error };
  };

  const createMethod = async (method: { name: string; color: string }) => {
    if (!user) return { error: new Error('Usuário não autenticado') };

    const { error } = await supabase
      .from('operation_methods')
      .insert({
        ...method,
        created_by: user.id,
      });

    if (!error) {
      fetchMethods();
    }

    return { error };
  };

  const deleteMethod = async (methodId: string) => {
    if (!user) return { error: new Error('Usuário não autenticado') };

    const { error } = await supabase
      .from('operation_methods')
      .delete()
      .eq('id', methodId)
      .eq('created_by', user.id);

    if (!error) {
      fetchMethods();
    }

    return { error };
  };

  useEffect(() => {
    if (user) {
      fetchMethods();
    }
  }, [user]);

  useEffect(() => {
    if (user && (!showAll || !authLoading)) {
      fetchOperations();
    }
  }, [user, dateRange, userId, isAdmin, showAll, authLoading]);

  return {
    operations,
    methods,
    isLoading,
    createOperation,
    updateOperation,
    deleteOperation,
    createMethod,
    deleteMethod,
    refetch: fetchOperations,
  };
}
