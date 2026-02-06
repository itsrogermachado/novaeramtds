import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CartItem {
  productId: string;
  categoryId: string;
  price: number;
  quantity: number;
}

interface ValidateCouponRequest {
  code: string;
  orderValue: number;
  cartItems?: CartItem[];
}

interface StoreCoupon {
  id: string;
  code: string;
  discount_type: string;
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
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const { code, orderValue, cartItems }: ValidateCouponRequest = await req.json();

    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ valid: false, error: 'Código do cupom é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof orderValue !== 'number' || orderValue < 0) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Valor do pedido inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize code input
    const sanitizedCode = code.toUpperCase().trim().slice(0, 50);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query coupon with exact match - using service role to bypass RLS
    const { data: coupon, error } = await supabase
      .from('store_coupons')
      .select('*')
      .eq('code', sanitizedCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ valid: false, error: 'Erro ao validar cupom' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!coupon) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Cupom não encontrado ou inativo' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const typedCoupon = coupon as StoreCoupon;

    // Check usage limit
    if (typedCoupon.max_uses > 0 && typedCoupon.used_count >= typedCoupon.max_uses) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Cupom esgotado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check validity period
    const now = new Date();
    if (typedCoupon.valid_from && new Date(typedCoupon.valid_from) > now) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Cupom ainda não está válido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (typedCoupon.valid_until && new Date(typedCoupon.valid_until) < now) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Cupom expirado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check order value limits
    if (typedCoupon.min_order_value > 0 && orderValue < typedCoupon.min_order_value) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `Valor mínimo do pedido: R$ ${typedCoupon.min_order_value.toFixed(2).replace('.', ',')}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (typedCoupon.max_order_value > 0 && orderValue > typedCoupon.max_order_value) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `Valor máximo do pedido: R$ ${typedCoupon.max_order_value.toFixed(2).replace('.', ',')}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate eligible value based on product/category restrictions
    let eligibleValue = orderValue;
    const hasProductRestriction = typedCoupon.product_ids && typedCoupon.product_ids.length > 0;
    const hasCategoryRestriction = typedCoupon.category_ids && typedCoupon.category_ids.length > 0;

    if ((hasProductRestriction || hasCategoryRestriction) && cartItems && cartItems.length > 0) {
      const eligibleItems = cartItems.filter(item => {
        if (hasProductRestriction && typedCoupon.product_ids.includes(item.productId)) {
          return true;
        }
        if (hasCategoryRestriction && typedCoupon.category_ids.includes(item.categoryId)) {
          return true;
        }
        return false;
      });

      if (eligibleItems.length === 0) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: hasProductRestriction 
              ? 'Cupom não aplicável aos produtos do carrinho' 
              : 'Cupom não aplicável às categorias dos produtos do carrinho'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      eligibleValue = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Calculate discount based on eligible value
    let discountAmount = 0;
    if (typedCoupon.discount_type === 'percentage') {
      discountAmount = eligibleValue * (typedCoupon.discount_value / 100);
    } else {
      discountAmount = typedCoupon.discount_value;
    }

    // Apply max discount limit
    if (typedCoupon.max_discount_amount > 0 && discountAmount > typedCoupon.max_discount_amount) {
      discountAmount = typedCoupon.max_discount_amount;
    }

    // Ensure discount doesn't exceed eligible value
    discountAmount = Math.min(discountAmount, eligibleValue);

    // Return validation result WITHOUT exposing all coupon details
    return new Response(
      JSON.stringify({
        valid: true,
        discountAmount,
        eligibleValue,
        discountType: typedCoupon.discount_type,
        discountValue: typedCoupon.discount_value,
        couponId: typedCoupon.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Erro inesperado ao validar cupom' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
