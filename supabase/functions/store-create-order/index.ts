import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface OrderItemInput {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface CreateOrderRequest {
  customer_email: string;
  payment_method?: string;
  subtotal?: number;
  discount_amount?: number;
  total?: number;
  coupon_code?: string | null;
  items: OrderItemInput[];
}

const isValidEmail = (email: string) => {
  const value = email.trim();
  if (value.length < 5) return false;
  // Simple and safe email check (avoid heavy regex)
  return value.includes('@') && value.includes('.') && !value.includes(' ');
};

const isUuid = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Backend credentials not configured');
    }

    const body: CreateOrderRequest = await req.json();

    const customerEmail = body.customer_email?.trim();
    if (!customerEmail || !isValidEmail(customerEmail)) {
      return new Response(
        JSON.stringify({ error: 'E-mail inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentMethod = (body.payment_method || 'pix').toLowerCase();
    if (paymentMethod !== 'pix') {
      return new Response(
        JSON.stringify({ error: 'Método de pagamento inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Carrinho vazio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    for (const item of items) {
      if (!item || typeof item !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Itens inválidos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!item.product_id || typeof item.product_id !== 'string' || !isUuid(item.product_id)) {
        return new Response(
          JSON.stringify({ error: 'Produto inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!item.product_name || typeof item.product_name !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Produto inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) {
        return new Response(
          JSON.stringify({ error: 'Quantidade inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (typeof item.unit_price !== 'number' || !Number.isFinite(item.unit_price) || item.unit_price < 0) {
        return new Response(
          JSON.stringify({ error: 'Preço inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (typeof item.total !== 'number' || !Number.isFinite(item.total) || item.total < 0) {
        return new Response(
          JSON.stringify({ error: 'Total inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const subtotal = typeof body.subtotal === 'number' && Number.isFinite(body.subtotal) ? body.subtotal : 0;
    const discountAmount = typeof body.discount_amount === 'number' && Number.isFinite(body.discount_amount) ? body.discount_amount : 0;
    const total = typeof body.total === 'number' && Number.isFinite(body.total) ? body.total : Math.max(0, subtotal - discountAmount);

    if (subtotal < 0 || discountAmount < 0 || total < 0) {
      return new Response(
        JSON.stringify({ error: 'Valores inválidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error } = await supabase
      .from('store_orders')
      .insert({
        customer_email: customerEmail,
        payment_method: 'pix',
        status: 'pending',
        subtotal,
        discount_amount: discountAmount,
        total,
        coupon_code: body.coupon_code ?? null,
        items,
      })
      .select('id')
      .single();

    if (error || !order) {
      console.error('Error inserting store order:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar pedido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, orderId: order.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
