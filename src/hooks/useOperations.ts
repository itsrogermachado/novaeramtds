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
  const { user, isAdmin } = useAuth();

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
    
    setIsLoading(true);
    
    let query = supabase
      .from('operations')
      .select(`
        *,
        method:operation_methods(id, name, color)
      `)
      .order('operation_date', { ascending: false });

    // If showAll is true and user is admin, don't filter (global view)
    // We check isAdmin at the time of the query
    if (showAll && isAdmin) {
      // No user_id filter - admin sees all operations via RLS policy
      console.log('[useOperations] Admin global view - fetching all operations');
    } else if (userId && isAdmin) {
      // Admin viewing specific user
      query = query.eq('user_id', userId);
      console.log('[useOperations] Admin viewing specific user:', userId);
    } else {
      // Any user (including admin) viewing their own data
      query = query.eq('user_id', user.id);
      console.log('[useOperations] User viewing own data:', user.id);
    }

    if (dateRange) {
      query = query
        .gte('operation_date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('operation_date', format(dateRange.end, 'yyyy-MM-dd'));
    }

    const { data, error } = await query;

    if (error) {
      console.error('[useOperations] Error fetching operations:', error);
    } else if (data) {
      console.log('[useOperations] Fetched operations count:', data.length);
      setOperations(data);
    }
    
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
    if (user) {
      fetchOperations();
    }
  }, [user, dateRange, userId, isAdmin, showAll]);

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
