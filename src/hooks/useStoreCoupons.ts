import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StoreCoupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number;
  used_count: number;
  min_order_value: number;
  max_order_value: number;
  max_discount_amount: number;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  category_ids: string[];
  product_ids: string[];
  created_at: string;
  updated_at: string;
}

export type CreateCouponInput = Omit<StoreCoupon, 'id' | 'used_count' | 'created_at' | 'updated_at'>;
export type UpdateCouponInput = Partial<CreateCouponInput>;

export function useStoreCoupons() {
  const [coupons, setCoupons] = useState<StoreCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('store_coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: 'Erro ao carregar cupons',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setCoupons(data as StoreCoupon[] || []);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const createCoupon = async (input: CreateCouponInput) => {
    const { error } = await supabase
      .from('store_coupons')
      .insert({
        code: input.code.toUpperCase(),
        discount_type: input.discount_type,
        discount_value: input.discount_value,
        max_uses: input.max_uses,
        min_order_value: input.min_order_value,
        max_order_value: input.max_order_value,
        max_discount_amount: input.max_discount_amount,
        is_active: input.is_active,
        valid_from: input.valid_from,
        valid_until: input.valid_until,
        category_ids: input.category_ids,
        product_ids: input.product_ids,
      });

    if (error) {
      toast({
        title: 'Erro ao criar cupom',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    toast({ title: 'Cupom criado com sucesso!' });
    fetchCoupons();
    return { error: null };
  };

  const updateCoupon = async (id: string, input: UpdateCouponInput) => {
    const updateData: Record<string, unknown> = { ...input };
    if (input.code) {
      updateData.code = input.code.toUpperCase();
    }

    const { error } = await supabase
      .from('store_coupons')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao atualizar cupom',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    toast({ title: 'Cupom atualizado com sucesso!' });
    fetchCoupons();
    return { error: null };
  };

  const deleteCoupon = async (id: string) => {
    const { error } = await supabase
      .from('store_coupons')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao excluir cupom',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    toast({ title: 'Cupom excluído com sucesso!' });
    fetchCoupons();
    return { error: null };
  };

  const toggleCouponStatus = async (id: string, isActive: boolean) => {
    return updateCoupon(id, { is_active: isActive });
  };

  return {
    coupons,
    isLoading,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    refetch: fetchCoupons,
  };
}

// Item interface for cart validation
interface CartItem {
  productId: string;
  categoryId: string;
  price: number;
  quantity: number;
}

// Hook for validating coupons on the customer side via secure edge function
export function useValidateCoupon() {
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Validates a coupon against cart items using secure edge function.
   * The edge function validates server-side without exposing coupon data.
   * 
   * @param code - Coupon code
   * @param orderValue - Total order value (used for min/max order validation)
   * @param cartItems - Optional array of cart items for product/category filtering
   */
  const validateCoupon = async (
    code: string,
    orderValue: number,
    cartItems?: CartItem[]
  ): Promise<{ 
    valid: boolean; 
    coupon?: StoreCoupon; 
    discountAmount?: number; 
    eligibleValue?: number;
    error?: string 
  }> => {
    setIsValidating(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: {
          code,
          orderValue,
          cartItems,
        },
      });

      if (error) {
        console.error('Coupon validation error:', error);
        return { valid: false, error: 'Erro ao validar cupom' };
      }

      if (!data.valid) {
        return { valid: false, error: data.error || 'Cupom inválido' };
      }

      // Return validation result - coupon details are minimal (only what's needed)
      return { 
        valid: true, 
        discountAmount: data.discountAmount,
        eligibleValue: data.eligibleValue,
        coupon: {
          id: data.couponId,
          code: code.toUpperCase(),
          discount_type: data.discountType,
          discount_value: data.discountValue,
          // Other fields are not exposed by the edge function for security
        } as StoreCoupon,
      };
    } catch (err) {
      console.error('Unexpected validation error:', err);
      return { valid: false, error: 'Erro inesperado ao validar cupom' };
    } finally {
      setIsValidating(false);
    }
  };

  return { validateCoupon, isValidating };
}
