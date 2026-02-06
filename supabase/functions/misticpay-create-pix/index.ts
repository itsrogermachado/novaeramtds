import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CreatePixRequest {
  orderId: string;
  amount: number;
  payerName: string;
  payerDocument: string;
  description: string;
}

interface MisticPayResponse {
  message: string;
  data: {
    transactionId: string;
    payer: {
      name: string;
      document: string;
    };
    transactionFee: number;
    transactionType: string;
    transactionMethod: string;
    transactionAmount: number;
    transactionState: string;
    qrCodeBase64: string;
    qrcodeUrl: string;
    copyPaste: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('MISTICPAY_CLIENT_ID');
    const clientSecret = Deno.env.get('MISTICPAY_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!clientId || !clientSecret) {
      throw new Error('MisticPay credentials not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const body: CreatePixRequest = await req.json();
    const { orderId, amount, payerName, payerDocument, description } = body;

    if (!orderId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use default values if not provided
    const cleanDocument = (payerDocument || '00000000000').replace(/\D/g, '');
    const finalPayerName = payerName?.trim() || 'Cliente Nova Era';

    // Get webhook URL for this function
    const webhookUrl = `${supabaseUrl}/functions/v1/misticpay-webhook`;

    // Create MisticPay transaction
    const misticPayResponse = await fetch('https://api.misticpay.com/api/transactions/create', {
      method: 'POST',
      headers: {
        'ci': clientId,
        'cs': clientSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        payerName: finalPayerName,
        payerDocument: cleanDocument,
        transactionId: orderId,
        description: description || `Pedido ${orderId}`,
        projectWebhook: webhookUrl,
      }),
    });

    if (!misticPayResponse.ok) {
      const errorText = await misticPayResponse.text();
      console.error('MisticPay error:', errorText);
      throw new Error(`MisticPay API error: ${misticPayResponse.status}`);
    }

    const misticPayData: MisticPayResponse = await misticPayResponse.json();

    // Update order with MisticPay transaction ID
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    await supabase
      .from('store_orders')
      .update({
        payment_reference: misticPayData.data.transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: misticPayData.data.transactionId,
        qrCodeBase64: misticPayData.data.qrCodeBase64,
        qrcodeUrl: misticPayData.data.qrcodeUrl,
        copyPaste: misticPayData.data.copyPaste,
        amount: amount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating PIX transaction:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
