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

// Hook for validating coupons on the customer side
export function useValidateCoupon() {
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Validates a coupon against cart items.
   * If the coupon has category_ids or product_ids restrictions:
   * - Only items matching those restrictions will have the discount applied
   * - Returns the discount amount calculated on eligible items only
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
      const { data, error } = await supabase
        .from('store_coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        return { valid: false, error: 'Erro ao validar cupom' };
      }

      if (!data) {
        return { valid: false, error: 'Cupom não encontrado ou inativo' };
      }

      const coupon = data as StoreCoupon;

      // Check usage limit
      if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
        return { valid: false, error: 'Cupom esgotado' };
      }

      // Check validity period
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return { valid: false, error: 'Cupom ainda não está válido' };
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return { valid: false, error: 'Cupom expirado' };
      }

      // Check order value limits
      if (coupon.min_order_value > 0 && orderValue < coupon.min_order_value) {
        return { valid: false, error: `Valor mínimo do pedido: R$ ${coupon.min_order_value.toFixed(2).replace('.', ',')}` };
      }
      if (coupon.max_order_value > 0 && orderValue > coupon.max_order_value) {
        return { valid: false, error: `Valor máximo do pedido: R$ ${coupon.max_order_value.toFixed(2).replace('.', ',')}` };
      }

      // Calculate eligible value based on product/category restrictions
      let eligibleValue = orderValue;
      const hasProductRestriction = coupon.product_ids && coupon.product_ids.length > 0;
      const hasCategoryRestriction = coupon.category_ids && coupon.category_ids.length > 0;

      if ((hasProductRestriction || hasCategoryRestriction) && cartItems && cartItems.length > 0) {
        // Filter items that match the coupon restrictions
        const eligibleItems = cartItems.filter(item => {
          // If coupon has product restrictions, check if item's product is included
          if (hasProductRestriction && coupon.product_ids!.includes(item.productId)) {
            return true;
          }
          // If coupon has category restrictions, check if item's category is included
          if (hasCategoryRestriction && coupon.category_ids!.includes(item.categoryId)) {
            return true;
          }
          // If coupon has both restrictions, item must match at least one
          // If coupon has no restrictions, all items are eligible (handled above)
          return false;
        });

        if (eligibleItems.length === 0) {
          return { 
            valid: false, 
            error: hasProductRestriction 
              ? 'Cupom não aplicável aos produtos do carrinho' 
              : 'Cupom não aplicável às categorias dos produtos do carrinho'
          };
        }

        // Calculate eligible value from matching items only
        eligibleValue = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }

      // Calculate discount based on eligible value
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = eligibleValue * (coupon.discount_value / 100);
      } else {
        discountAmount = coupon.discount_value;
      }

      // Apply max discount limit
      if (coupon.max_discount_amount > 0 && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }

      // Ensure discount doesn't exceed eligible value
      discountAmount = Math.min(discountAmount, eligibleValue);

      return { valid: true, coupon, discountAmount, eligibleValue };
    } catch (err) {
      return { valid: false, error: 'Erro inesperado ao validar cupom' };
    } finally {
      setIsValidating(false);
    }
  };

  return { validateCoupon, isValidating };
}
