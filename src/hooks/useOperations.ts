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
}

export function useOperations(dateRange?: { start: Date; end: Date }, userId?: string) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [methods, setMethods] = useState<OperationMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const fetchMethods = async () => {
    const { data, error } = await supabase
      .from('operation_methods')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setMethods(data);
    }
  };

  const fetchOperations = async () => {
    setIsLoading(true);
    
    let query = supabase
      .from('operations')
      .select(`
        *,
        method:operation_methods(id, name, color)
      `)
      .order('operation_date', { ascending: false });

    // If userId is provided and user is admin, filter by that user
    if (userId && isAdmin) {
      query = query.eq('user_id', userId);
    } else if (!isAdmin && user) {
      // Regular users can only see their own operations
      query = query.eq('user_id', user.id);
    }

    if (dateRange) {
      query = query
        .gte('operation_date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('operation_date', format(dateRange.end, 'yyyy-MM-dd'));
    }

    const { data, error } = await query;

    if (!error && data) {
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

  useEffect(() => {
    fetchMethods();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOperations();
    }
  }, [user, dateRange, userId, isAdmin]);

  return {
    operations,
    methods,
    isLoading,
    createOperation,
    updateOperation,
    deleteOperation,
    createMethod,
    refetch: fetchOperations,
  };
}
