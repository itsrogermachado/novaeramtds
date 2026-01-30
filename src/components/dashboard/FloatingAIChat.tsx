import { useState, useRef, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIChat, ChatMessage, UserContext } from '@/hooks/useAIChat';
import { useOperations } from '@/hooks/useOperations';
import { useExpenses, isExpenseEffective } from '@/hooks/useExpenses';
import { useGoals } from '@/hooks/useGoals';
import { useProfile } from '@/hooks/useProfile';
import { Send, Bot, User, Loader2, Trash2, Sparkles, X, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn(
        'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20'
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
      </div>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
        isUser 
          ? 'bg-primary text-primary-foreground rounded-br-sm' 
          : 'bg-card border border-border rounded-bl-sm'
      )}>
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="text-sm leading-relaxed space-y-2 text-foreground/90">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>
                ),
                h1: ({ children }) => (
                  <h4 className="font-semibold text-foreground mb-2 mt-3 first:mt-0">{children}</h4>
                ),
                h2: ({ children }) => (
                  <h4 className="font-semibold text-foreground mb-2 mt-3 first:mt-0">{children}</h4>
                ),
                h3: ({ children }) => (
                  <h4 className="font-semibold text-foreground mb-2 mt-3 first:mt-0">{children}</h4>
                ),
                ul: ({ children }) => (
                  <ul className="mb-2.5 space-y-1.5 ml-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-2.5 space-y-1.5 ml-1 list-decimal list-inside">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="flex gap-2 items-start">
                    <span className="text-primary mt-1.5 text-xs">•</span>
                    <span className="flex-1">{children}</span>
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-muted-foreground">{children}</em>
                ),
                code: ({ children }) => (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary">{children}</code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground my-2">{children}</blockquote>
                ),
                hr: () => <hr className="my-3 border-border/50" />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIChat();

  // Get user data for context
  const { profile } = useProfile();
  const { goals } = useGoals();
  
  // Get today's date range
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayRange = { start: today, end: today };
  
  // Get current month range
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthRange = { start: monthStart, end: monthEnd };
  
  // Fetch operations and expenses
  const { operations: todayOperations } = useOperations(todayRange);
  const { operations: monthOperations } = useOperations(monthRange);
  const { expenses: monthExpenses } = useExpenses(monthRange);

  // Build user context for AI
  const userContext = useMemo<UserContext>(() => {
    // Today stats
    const todayStats = {
      totalInvested: todayOperations.reduce((sum, op) => sum + op.invested_amount, 0),
      totalReturn: todayOperations.reduce((sum, op) => sum + op.return_amount, 0),
      profit: todayOperations.reduce((sum, op) => sum + (op.return_amount - op.invested_amount), 0),
      operationsCount: todayOperations.length,
    };

    // Period (month) stats
    const effectiveExpenses = monthExpenses.filter(isExpenseEffective);
    const monthProfit = monthOperations.reduce((sum, op) => sum + (op.return_amount - op.invested_amount), 0);
    const totalExpenses = effectiveExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const periodStats = {
      totalInvested: monthOperations.reduce((sum, op) => sum + op.invested_amount, 0),
      totalReturn: monthOperations.reduce((sum, op) => sum + op.return_amount, 0),
      profit: monthProfit,
      operationsCount: monthOperations.length,
      totalExpenses,
      netBalance: monthProfit - totalExpenses,
      periodLabel: format(today, 'MMMM yyyy'),
    };

    // Goals
    const goalsData = goals.map(g => ({
      title: g.title,
      targetAmount: g.target_amount,
      currentAmount: g.current_amount,
      goalType: g.goal_type,
    }));

    // Recent operations (last 10)
    const recentOps = monthOperations.slice(0, 10).map(op => ({
      date: format(new Date(op.operation_date), 'dd/MM/yyyy'),
      method: op.method?.name || 'Sem método',
      invested: op.invested_amount,
      returned: op.return_amount,
      profit: op.return_amount - op.invested_amount,
    }));

    // Methods performance
    const methodsMap = new Map<string, { totalProfit: number; count: number }>();
    monthOperations.forEach(op => {
      const methodName = op.method?.name || 'Sem método';
      const current = methodsMap.get(methodName) || { totalProfit: 0, count: 0 };
      current.totalProfit += op.return_amount - op.invested_amount;
      current.count += 1;
      methodsMap.set(methodName, current);
    });
    
    const methodsPerformance = Array.from(methodsMap.entries())
      .map(([method, data]) => ({
        method,
        totalProfit: data.totalProfit,
        operationsCount: data.count,
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit);

    return {
      userName: profile?.full_name || undefined,
      todayStats,
      periodStats,
      goals: goalsData,
      recentOperations: recentOps,
      methodsPerformance,
    };
  }, [profile, goals, todayOperations, monthOperations, monthExpenses]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input, userContext);
      setInput('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion, userContext);
  };

  return (
    <>
      {/* Floating Chat Panel */}
      <div
        className={cn(
          'fixed z-50 transition-all duration-300 ease-in-out',
          // Mobile: full screen with some padding
          'bottom-0 right-0 left-0 sm:left-auto',
          'sm:bottom-20 sm:right-4',
          isOpen 
            ? 'opacity-100 pointer-events-auto translate-y-0' 
            : 'opacity-0 pointer-events-none translate-y-4'
        )}
      >
        <div className={cn(
          'bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col',
          // Mobile: almost full height, Desktop: fixed size
          'h-[85vh] sm:h-[500px] w-full sm:w-[380px]'
        )}>
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Assistente Nova Era</h3>
                <p className="text-xs text-muted-foreground">Tire suas dúvidas</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearMessages}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  title="Limpar conversa"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
            <div className="px-4 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-6">
                  <Bot className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Olá! Como posso ajudar?
                  </p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="grid gap-2">
                      {[
                        '📊 Me passe o relatório de hoje',
                        '📈 Como está minha performance este mês?',
                        '🎯 Analise minhas metas',
                        '💡 Dicas de gestão de banca',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-left px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-foreground/80 hover:text-foreground"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <MessageBubble key={index} message={message} />
                ))
              )}
              
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3.5 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-center py-2">
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 border-t flex-shrink-0 bg-background/80 backdrop-blur-sm">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                className="flex-1 h-10 text-sm"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()} 
                size="icon"
                className="h-10 w-10 rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed z-50 bottom-4 right-4 h-14 w-14 rounded-full shadow-xl',
          'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
          'flex items-center justify-center',
          'transition-all duration-300 ease-in-out',
          'hover:scale-105 hover:shadow-2xl active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          isOpen && 'scale-0 opacity-0'
        )}
        aria-label="Abrir assistente"
      >
        <MessageCircle className="h-6 w-6" />
        
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
      </button>
    </>
  );
}
