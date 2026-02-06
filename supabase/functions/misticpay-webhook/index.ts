import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-misticpay-signature',
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

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface DeliveredItem {
  product_id: string;
  product_name: string;
  quantity: number;
  delivered_content: string[];
  post_sale_instructions?: string;
}

// Verify webhook signature from MisticPay
async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    console.warn('No signature provided in webhook request');
    return false;
  }

  try {
    // Create HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    // Convert to hex string
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Compare signatures (timing-safe comparison)
    return signature.toLowerCase() === expectedSignature.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('MISTICPAY_WEBHOOK_SECRET');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-misticpay-signature');
    
    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.warn('MISTICPAY_WEBHOOK_SECRET not configured - signature verification disabled');
    }

    const body: MisticPayWebhook = JSON.parse(rawBody);
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

    // IDEMPOTENCY CHECK: If order was already processed, return success
    // This prevents race conditions and duplicate deliveries
    if (order.status === 'paid' || order.status === 'delivered') {
      console.log('Order already processed (idempotency check passed):', order.id);
      return new Response(
        JSON.stringify({ success: true, message: 'Order already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map MisticPay status to our order status
    let orderStatus = order.status;
    if (status === 'COMPLETO') {
      orderStatus = 'paid';
    } else if (status === 'FALHA') {
      orderStatus = 'failed';
    }

    // If payment is complete, process delivery
    const deliveredItems: DeliveredItem[] = [];
    
    if (status === 'COMPLETO') {
      const items = order.items as OrderItem[];
      
      // ATOMIC DELIVERY: Mark as paid first to prevent race condition
      // This ensures subsequent webhook calls see the order as already processed
      const { error: markPaidError } = await supabase
        .from('store_orders')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)
        .eq('status', 'pending'); // Only update if still pending (atomic check)

      if (markPaidError) {
        console.error('Error marking order as paid:', markPaidError);
        // If this fails because status changed, it means another request processed it
        return new Response(
          JSON.stringify({ success: true, message: 'Order already being processed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Re-fetch to confirm we got the lock
      const { data: lockedOrder } = await supabase
        .from('store_orders')
        .select('status')
        .eq('id', order.id)
        .single();

      if (lockedOrder?.status !== 'paid') {
        console.log('Order was processed by another request');
        return new Response(
          JSON.stringify({ success: true, message: 'Order processed by another request' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      for (const item of items) {
        // Get current product stock
        const { data: product, error: productError } = await supabase
          .from('store_products')
          .select('id, name, stock, product_type, post_sale_instructions')
          .eq('id', item.product_id)
          .single();

        if (productError || !product) {
          console.error('Product not found:', item.product_id);
          continue;
        }

        const deliveredContent: string[] = [];
        let newStock = product.stock || '';

        if (product.product_type === 'lines' && product.stock) {
          // Split stock into lines and take the required quantity
          const stockLines = product.stock.split('\n').filter((line: string) => line.trim());
          const linesToDeliver = stockLines.slice(0, item.quantity);
          const remainingLines = stockLines.slice(item.quantity);
          
          deliveredContent.push(...linesToDeliver);
          newStock = remainingLines.join('\n');
          
          console.log(`Delivering ${linesToDeliver.length} lines for product ${product.name}`);
        } else if (product.stock) {
          // For non-line products, deliver the full stock content
          deliveredContent.push(product.stock);
          // Clear stock after delivery if quantity matches
          newStock = '';
        }

        // Update product stock
        const { error: updateStockError } = await supabase
          .from('store_products')
          .update({ 
            stock: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateStockError) {
          console.error('Error updating stock:', updateStockError);
        }

        deliveredItems.push({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          delivered_content: deliveredContent,
          post_sale_instructions: product.post_sale_instructions || undefined,
        });
      }

      orderStatus = 'delivered';
    }

    // Update order status and delivered items
    const updateData: Record<string, unknown> = {
      status: orderStatus,
      updated_at: new Date().toISOString(),
    };

    if (status === 'COMPLETO') {
      updateData.delivered_items = deliveredItems;
    }

    const { error: updateError } = await supabase
      .from('store_orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw updateError;
    }

    console.log(`Order ${order.id} updated to status: ${orderStatus}, delivered ${deliveredItems.length} items`);

    return new Response(
      JSON.stringify({ success: true, message: 'Order processed successfully', deliveredItems: deliveredItems.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
