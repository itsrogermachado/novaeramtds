import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateTransactionParams {
  amount: number;
  payerName: string;
  payerDocument: string;
  description?: string;
}

interface TransactionResult {
  id: string;
  transactionId: string;
  qrCodeBase64: string;
  qrCodeUrl: string;
  copyPaste: string;
  amount: number;
}

interface CheckResult {
  transactionId: string;
  status: 'PENDENTE' | 'COMPLETO' | 'FALHA';
  transaction?: {
    value: number;
    fee: number;
    createdAt: string;
    updatedAt: string;
  };
}

export function useMisticPay() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createTransaction = async (params: CreateTransactionParams): Promise<TransactionResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Você precisa estar logado');
      }

      const response = await supabase.functions.invoke('misticpay/create', {
        body: {
          amount: params.amount,
          payerName: params.payerName,
          payerDocument: params.payerDocument,
          description: params.description || 'Pagamento Nova Era',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar transação');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao criar transação');
      }

      return response.data.data as TransactionResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const checkTransaction = async (transactionId: string): Promise<CheckResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Você precisa estar logado');
      }

      const response = await supabase.functions.invoke('misticpay/check', {
        body: {
          transactionId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao verificar transação');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao verificar transação');
      }

      return response.data.data as CheckResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getBalance = async (): Promise<{ balance: number } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke('misticpay/balance', {
        method: 'GET',
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao consultar saldo');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao consultar saldo');
      }

      return response.data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createTransaction,
    checkTransaction,
    getBalance,
    isLoading,
    error,
  };
}
