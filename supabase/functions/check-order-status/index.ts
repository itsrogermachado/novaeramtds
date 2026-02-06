import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CheckOrderRequest {
  orderId: string;
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

    const body: CheckOrderRequest = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing orderId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate orderId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid orderId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch only the status field - no sensitive data exposed
    const { data: order, error } = await supabase
      .from('store_orders')
      .select('id, status, created_at')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only allow checking orders created within the last 2 hours (security measure)
    const orderCreatedAt = new Date(order.created_at);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    if (orderCreatedAt < twoHoursAgo) {
      return new Response(
        JSON.stringify({ error: 'Order too old for status check' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        status: order.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking order status:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
