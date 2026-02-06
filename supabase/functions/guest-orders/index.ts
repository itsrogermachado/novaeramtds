import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GuestOrdersRequest {
  customer_email: string;
}

const isValidEmail = (email: string) => {
  const value = email.trim();
  if (value.length < 5) return false;
  return value.includes('@') && value.includes('.') && !value.includes(' ');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Backend credentials not configured');
    }

    const body: GuestOrdersRequest = await req.json();
    const customerEmail = body.customer_email?.toLowerCase().trim();

    if (!customerEmail || !isValidEmail(customerEmail)) {
      return new Response(
        JSON.stringify({ error: 'E-mail inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email belongs to a registered user
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();

    if (profile) {
      // Email belongs to a registered user - they should login instead
      return new Response(
        JSON.stringify({ 
          registered: true, 
          message: 'Este e-mail pertence a uma conta registrada. Faça login para acessar seus pedidos.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch orders for guest
    const { data: orders, error } = await supabase
      .from('store_orders')
      .select('id, customer_email, status, subtotal, discount_amount, total, coupon_code, payment_method, items, delivered_items, created_at, paid_at')
      .eq('customer_email', customerEmail)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Erro ao buscar pedidos');
    }

    return new Response(
      JSON.stringify({ 
        registered: false,
        orders: orders || [] 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in guest-orders:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
