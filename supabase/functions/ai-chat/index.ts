import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Assistente Nova Era", um especialista em trading esportivo, apostas e gestão financeira.

## REGRA CRÍTICA DE FORMATO:
- Suas respostas devem ter NO MÁXIMO 3-4 frases curtas
- Use bullet points apenas quando necessário (máximo 3-4 itens)
- Seja EXTREMAMENTE conciso e direto
- Evite introduções e conclusões longas
- Vá direto ao ponto

## Suas Capacidades:
1. Análise de performance e lucro/prejuízo
2. Insights financeiros e sugestões de melhoria
3. Gestão de gastos e metas
4. Estratégias de dutching
5. Educação sobre trading esportivo

## Diretrizes:
- Responda em português brasileiro
- Use emojis moderadamente (1-2 por resposta)
- Se não tiver informação suficiente, peça detalhes de forma breve
- Nunca prometa ganhos garantidos`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    let systemPrompt = SYSTEM_PROMPT;
    
    if (context) {
      systemPrompt += `\n\n## Contexto Atual do Usuário:`;
      if (context.totalProfit !== undefined) {
        systemPrompt += `\n- Lucro total no período: R$ ${context.totalProfit.toFixed(2)}`;
      }
      if (context.totalExpenses !== undefined) {
        systemPrompt += `\n- Gastos no período: R$ ${context.totalExpenses.toFixed(2)}`;
      }
      if (context.netBalance !== undefined) {
        systemPrompt += `\n- Balanço líquido: R$ ${context.netBalance.toFixed(2)}`;
      }
      if (context.operationsCount !== undefined) {
        systemPrompt += `\n- Total de operações: ${context.operationsCount}`;
      }
      if (context.todayProfit !== undefined) {
        systemPrompt += `\n- Lucro de hoje: R$ ${context.todayProfit.toFixed(2)}`;
      }
      if (context.weeklyProfit !== undefined) {
        systemPrompt += `\n- Lucro da semana: R$ ${context.weeklyProfit.toFixed(2)}`;
      }
      if (context.topMethods && context.topMethods.length > 0) {
        systemPrompt += `\n- Métodos mais lucrativos: ${context.topMethods.join(', ')}`;
      }
    }

    // Format messages to support multimodal content (text + images)
    const formattedMessages = messages.map((msg: { role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }) => {
      // If content is already an array (multimodal), keep it as is
      if (Array.isArray(msg.content)) {
        return msg;
      }
      // Otherwise, it's a simple text message
      return msg;
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          ...formattedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados. Entre em contato com o suporte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao conectar com a IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
