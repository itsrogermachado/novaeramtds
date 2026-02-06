import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface MisticPayWebhook {
  transactionId: number | string;
  transactionType: string;
  transactionMethod: string;
  clientName: string;
  clientDocument: string;
  status: string;
  value: number;
  fee: number;
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

    const body: MisticPayWebhook = await req.json();
    console.log('Received webhook:', JSON.stringify(body));

    const { transactionId, status, transactionType } = body;

    // Only process deposit (cash-in) transactions
    if (transactionType !== 'DEPOSITO') {
      console.log('Ignoring non-deposit transaction:', transactionType);
      return new Response(
        JSON.stringify({ success: true, message: 'Ignored non-deposit transaction' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find order by payment reference
    const { data: order, error: findError } = await supabase
      .from('store_orders')
      .select('*')
      .eq('payment_reference', String(transactionId))
      .single();

    if (findError || !order) {
      console.error('Order not found for transaction:', transactionId);
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map MisticPay status to our order status
    let orderStatus = order.status;
    if (status === 'COMPLETO') {
      orderStatus = 'paid';
    } else if (status === 'FALHA') {
      orderStatus = 'failed';
    }

    // Update order status
    const updateData: Record<string, unknown> = {
      status: orderStatus,
      updated_at: new Date().toISOString(),
    };

    if (status === 'COMPLETO') {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('store_orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw updateError;
    }

    console.log(`Order ${order.id} updated to status: ${orderStatus}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Order updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
