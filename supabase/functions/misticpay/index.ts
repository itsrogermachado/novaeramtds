import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MISTICPAY_API_URL = "https://api.misticpay.com/api";

interface CreateTransactionRequest {
  amount: number;
  payerName: string;
  payerDocument: string;
  description: string;
}

interface CheckTransactionRequest {
  transactionId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MISTICPAY_CLIENT_ID = Deno.env.get("MISTICPAY_CLIENT_ID");
    const MISTICPAY_CLIENT_SECRET = Deno.env.get("MISTICPAY_CLIENT_SECRET");

    if (!MISTICPAY_CLIENT_ID) {
      throw new Error("MISTICPAY_CLIENT_ID não configurado");
    }

    if (!MISTICPAY_CLIENT_SECRET) {
      throw new Error("MISTICPAY_CLIENT_SECRET não configurado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Usuário não autenticado");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Token inválido");
    }

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    if (action === "create" && req.method === "POST") {
      // Create a new PIX transaction
      const body: CreateTransactionRequest = await req.json();

      // Validate input
      if (!body.amount || body.amount <= 0) {
        throw new Error("Valor inválido");
      }
      if (!body.payerName || body.payerName.trim().length < 2) {
        throw new Error("Nome do pagador inválido");
      }
      if (!body.payerDocument || !/^\d{11}$/.test(body.payerDocument.replace(/\D/g, ""))) {
        throw new Error("CPF inválido");
      }

      const transactionId = `novaera_${user.id}_${Date.now()}`;

      // Call MisticPay API
      const misticPayResponse = await fetch(`${MISTICPAY_API_URL}/transactions/create`, {
        method: "POST",
        headers: {
          "ci": MISTICPAY_CLIENT_ID,
          "cs": MISTICPAY_CLIENT_SECRET,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: body.amount,
          payerName: body.payerName.trim(),
          payerDocument: body.payerDocument.replace(/\D/g, ""),
          transactionId: transactionId,
          description: body.description || "Pagamento Nova Era",
        }),
      });

      const misticPayData = await misticPayResponse.json();

      if (!misticPayResponse.ok) {
        console.error("MisticPay error:", misticPayData);
        throw new Error(misticPayData.message || "Erro ao criar transação PIX");
      }

      // Save transaction to database
      const { data: savedTransaction, error: saveError } = await supabase
        .from("payment_transactions")
        .insert({
          user_id: user.id,
          misticpay_transaction_id: misticPayData.data.transactionId,
          amount: body.amount,
          fee: misticPayData.data.transactionFee ? misticPayData.data.transactionFee / 100 : 0,
          status: "PENDENTE",
          transaction_type: "DEPOSITO",
          payer_name: body.payerName.trim(),
          payer_document: body.payerDocument.replace(/\D/g, ""),
          description: body.description,
          qr_code_base64: misticPayData.data.qrCodeBase64,
          qr_code_url: misticPayData.data.qrcodeUrl,
          copy_paste: misticPayData.data.copyPaste,
          metadata: misticPayData.data,
        })
        .select()
        .single();

      if (saveError) {
        console.error("Save error:", saveError);
        throw new Error("Erro ao salvar transação");
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: savedTransaction.id,
            transactionId: misticPayData.data.transactionId,
            qrCodeBase64: misticPayData.data.qrCodeBase64,
            qrCodeUrl: misticPayData.data.qrcodeUrl,
            copyPaste: misticPayData.data.copyPaste,
            amount: body.amount,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check" && req.method === "POST") {
      // Check transaction status
      const body: CheckTransactionRequest = await req.json();

      if (!body.transactionId) {
        throw new Error("ID da transação não informado");
      }

      // Call MisticPay API to check status
      const misticPayResponse = await fetch(`${MISTICPAY_API_URL}/transactions/check`, {
        method: "POST",
        headers: {
          "ci": MISTICPAY_CLIENT_ID,
          "cs": MISTICPAY_CLIENT_SECRET,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: body.transactionId,
        }),
      });

      const misticPayData = await misticPayResponse.json();

      if (!misticPayResponse.ok) {
        console.error("MisticPay check error:", misticPayData);
        throw new Error(misticPayData.message || "Erro ao verificar transação");
      }

      // Update transaction status in database
      const newStatus = misticPayData.transaction?.transactionState || "PENDENTE";
      
      const { error: updateError } = await supabase
        .from("payment_transactions")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("misticpay_transaction_id", body.transactionId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Update error:", updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            transactionId: body.transactionId,
            status: newStatus,
            transaction: misticPayData.transaction,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "balance" && req.method === "GET") {
      // Get MisticPay balance (admin only)
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roles) {
        throw new Error("Acesso não autorizado");
      }

      const misticPayResponse = await fetch(`${MISTICPAY_API_URL}/users/balance`, {
        method: "GET",
        headers: {
          "ci": MISTICPAY_CLIENT_ID,
          "cs": MISTICPAY_CLIENT_SECRET,
        },
      });

      const misticPayData = await misticPayResponse.json();

      if (!misticPayResponse.ok) {
        throw new Error(misticPayData.message || "Erro ao consultar saldo");
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: misticPayData.data,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Endpoint não encontrado");

  } catch (error) {
    console.error("MisticPay function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
