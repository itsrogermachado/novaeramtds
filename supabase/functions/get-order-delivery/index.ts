import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GetOrderDeliveryRequest {
  orderId: string;
}

const isUuid = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
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

    const body: GetOrderDeliveryRequest = await req.json();
    const { orderId } = body;

    if (!orderId || !isUuid(orderId)) {
      return new Response(
        JSON.stringify({ error: 'ID do pedido inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order - only return delivery info for recent orders (security)
    const { data: order, error } = await supabase
      .from('store_orders')
      .select('id, status, delivered_items, created_at')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only allow fetching delivery info for orders created within the last 24 hours
    const orderCreatedAt = new Date(order.created_at);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    if (orderCreatedAt < twentyFourHoursAgo) {
      return new Response(
        JSON.stringify({ error: 'Acesso expirado. Consulte seus pedidos na página de consulta.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        status: order.status,
        delivered_items: order.delivered_items || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-order-delivery:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
