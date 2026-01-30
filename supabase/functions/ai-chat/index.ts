import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UserContext {
  userName?: string;
  todayStats?: {
    totalInvested: number;
    totalReturn: number;
    profit: number;
    operationsCount: number;
  };
  periodStats?: {
    totalInvested: number;
    totalReturn: number;
    profit: number;
    operationsCount: number;
    totalExpenses: number;
    netBalance: number;
    periodLabel: string;
  };
  goals?: Array<{
    title: string;
    targetAmount: number;
    currentAmount: number;
    goalType: string;
  }>;
  recentOperations?: Array<{
    date: string;
    method: string;
    invested: number;
    returned: number;
    profit: number;
  }>;
  methodsPerformance?: Array<{
    method: string;
    totalProfit: number;
    operationsCount: number;
  }>;
}

function buildSystemPrompt(context?: UserContext): string {
  let basePrompt = `Você é o Assistente Nova Era, um assistente virtual amigável e profissional especializado em ajudar usuários com gestão de operações de trading e apostas esportivas.

Suas capacidades:
- Responder dúvidas sobre o sistema Nova Era
- Explicar conceitos de trading e gestão financeira
- Ajudar com cálculos de dutching e gestão de banca
- **GERAR RELATÓRIOS** baseados nos dados do usuário

REGRAS DE FORMATAÇÃO (MUITO IMPORTANTE):
- Seja CONCISO e DIRETO - máximo de 3-4 parágrafos por resposta
- Use bullet points (•) para listas, nunca parágrafos longos
- Destaque números e valores importantes em **negrito**
- Use emojis relevantes para destacar seções (📊 📈 💰 ✅ ❌ 🎯)
- Para relatórios, organize em seções curtas com títulos
- Evite repetições e explicações desnecessárias
- Prefira dados e fatos ao invés de textos explicativos longos

Diretrizes:
- Responda em português brasileiro
- Nunca dê conselhos financeiros específicos ou garantias de lucro
- Quando pedirem relatórios, USE OS DADOS do contexto de forma organizada

Você faz parte do painel Nova Era, uma plataforma de gestão de operações.`;

  if (context) {
    basePrompt += `\n\n=== DADOS DO USUÁRIO (USE ESTES DADOS PARA RELATÓRIOS) ===`;
    
    if (context.userName) {
      basePrompt += `\n\nNome do usuário: ${context.userName}`;
    }

    if (context.todayStats) {
      const { totalInvested, totalReturn, profit, operationsCount } = context.todayStats;
      basePrompt += `\n\n📊 ESTATÍSTICAS DE HOJE:
- Operações realizadas: ${operationsCount}
- Total investido: R$ ${totalInvested.toFixed(2)}
- Total de retorno: R$ ${totalReturn.toFixed(2)}
- Lucro/Prejuízo: R$ ${profit.toFixed(2)} (${profit >= 0 ? '✅ Positivo' : '❌ Negativo'})`;
    }

    if (context.periodStats) {
      const { totalInvested, totalReturn, profit, operationsCount, totalExpenses, netBalance, periodLabel } = context.periodStats;
      basePrompt += `\n\n📈 ESTATÍSTICAS DO PERÍODO (${periodLabel}):
- Operações realizadas: ${operationsCount}
- Total investido: R$ ${totalInvested.toFixed(2)}
- Total de retorno: R$ ${totalReturn.toFixed(2)}
- Lucro bruto: R$ ${profit.toFixed(2)}
- Total de gastos: R$ ${totalExpenses.toFixed(2)}
- Balanço líquido: R$ ${netBalance.toFixed(2)} (${netBalance >= 0 ? '✅ Positivo' : '❌ Negativo'})`;
    }

    if (context.goals && context.goals.length > 0) {
      basePrompt += `\n\n🎯 METAS DO USUÁRIO:`;
      context.goals.forEach((goal, i) => {
        const progress = goal.targetAmount > 0 ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1) : 0;
        basePrompt += `\n${i + 1}. ${goal.title} (${goal.goalType}): R$ ${goal.currentAmount.toFixed(2)} / R$ ${goal.targetAmount.toFixed(2)} (${progress}% concluído)`;
      });
    }

    if (context.methodsPerformance && context.methodsPerformance.length > 0) {
      basePrompt += `\n\n📋 PERFORMANCE POR MÉTODO:`;
      context.methodsPerformance.forEach((m, i) => {
        basePrompt += `\n${i + 1}. ${m.method}: R$ ${m.totalProfit.toFixed(2)} lucro (${m.operationsCount} operações)`;
      });
    }

    if (context.recentOperations && context.recentOperations.length > 0) {
      basePrompt += `\n\n📝 ÚLTIMAS ${context.recentOperations.length} OPERAÇÕES:`;
      context.recentOperations.forEach((op, i) => {
        basePrompt += `\n${i + 1}. ${op.date} - ${op.method}: Investido R$ ${op.invested.toFixed(2)}, Retorno R$ ${op.returned.toFixed(2)}, Lucro R$ ${op.profit.toFixed(2)}`;
      });
    }

    basePrompt += `\n\n=== FIM DOS DADOS ===
    
Quando o usuário pedir um relatório, análise ou resumo, utilize os dados acima para fornecer informações precisas e personalizadas.`;
  }

  return basePrompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt(userContext as UserContext | undefined);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua mensagem. Tente novamente." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});