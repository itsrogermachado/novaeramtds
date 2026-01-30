import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Assistente Nova Era", um especialista em trading esportivo, apostas e gestão financeira. Você ajuda os usuários do dashboard Nova Era MTDs a:

## Suas Capacidades:
1. **Análise de Operações**: Identificar padrões de lucro/prejuízo, analisar performance por método e período
2. **Insights Financeiros**: Oferecer sugestões para melhorar ROI, reduzir riscos e otimizar estratégias
3. **Gestão de Gastos**: Ajudar a categorizar e controlar despesas relacionadas às operações
4. **Metas**: Auxiliar no planejamento e acompanhamento de metas diárias, semanais e mensais
5. **Dutching**: Explicar estratégias de dutching e ajudar nos cálculos
6. **Educação**: Responder dúvidas sobre trading esportivo e apostas de valor

## Diretrizes:
- Seja conciso e direto
- Use formatação markdown quando útil (listas, negrito, etc)
- Sempre considere o contexto do usuário (dados, período, metas)
- Dê respostas práticas e acionáveis
- Se não tiver informação suficiente, peça mais detalhes
- Responda sempre em português brasileiro

## Personalidade:
- Profissional mas amigável
- Focado em resultados
- Incentivador mas realista
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
          ...messages,
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
