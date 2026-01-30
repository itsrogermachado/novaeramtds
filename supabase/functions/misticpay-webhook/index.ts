import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  transactionId: number | string;
  transactionType: "DEPOSITO" | "RETIRADA";
  transactionMethod: string;
  clientName: string;
  clientDocument: string;
  status: "PENDENTE" | "COMPLETO" | "FALHA";
  value: number;
  fee: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WebhookPayload = await req.json();
    
    console.log("Webhook received:", JSON.stringify(payload));

    if (!payload.transactionId) {
      throw new Error("transactionId not provided");
    }

    // Update transaction status in database using service role (bypasses RLS)
    const { data, error } = await supabase
      .from("payment_transactions")
      .update({
        status: payload.status,
        fee: payload.fee ? payload.fee / 100 : 0,
        updated_at: new Date().toISOString(),
        metadata: payload,
      })
      .eq("misticpay_transaction_id", String(payload.transactionId))
      .select()
      .single();

    if (error) {
      console.error("Database update error:", error);
      // Don't throw - we still want to return 200 to MisticPay
    } else {
      console.log("Transaction updated:", data?.id);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    
    // Always return 200 to prevent retries
    return new Response(
      JSON.stringify({ success: false, error: "Webhook processing failed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
