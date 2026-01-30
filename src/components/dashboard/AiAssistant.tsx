import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type AiContext = {
  totalProfit?: number;
  totalExpenses?: number;
  netBalance?: number;
  operationsCount?: number;
  todayProfit?: number;
  weeklyProfit?: number;
  topMethods?: string[];
};

interface AiAssistantProps {
  context?: AiContext;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const QUICK_PROMPTS = [
  { label: '📊 Análise', prompt: 'Analise minha performance atual e dê sugestões de melhoria' },
  { label: '💡 Insights', prompt: 'Quais insights você pode me dar sobre meus resultados?' },
  { label: '🎯 Metas', prompt: 'Me ajude a definir metas realistas baseadas no meu histórico' },
  { label: '📈 Tendências', prompt: 'Identifique tendências nos meus resultados recentes' },
];

export function AiAssistant({ context }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const streamChat = useCallback(async (userMessage: string) => {
    setIsLoading(true);
    const userMsg: Message = { role: 'user', content: userMessage };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    let assistantContent = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: newMessages,
          context 
        }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao conectar com a IA');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: `❌ ${error instanceof Error ? error.message : 'Erro ao processar mensagem'}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, context]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    streamChat(prompt);
  };

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg transition-all duration-300",
          "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
          isOpen && "rotate-180"
        )}
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat window */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col transition-all duration-300",
            isExpanded
              ? "bottom-4 right-4 left-4 top-4 md:left-auto md:w-[600px] md:top-4"
              : "bottom-20 right-4 w-[360px] h-[500px] max-h-[calc(100vh-120px)]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Assistente Nova Era</h3>
                <p className="text-xs text-muted-foreground">Seu parceiro de trading</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Olá! Sou seu assistente</h4>
                  <p className="text-sm text-muted-foreground">
                    Posso analisar suas operações, dar insights e ajudar com estratégias.
                  </p>
                </div>
                
                {/* Quick prompts */}
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                  {QUICK_PROMPTS.map((item) => (
                    <Button
                      key={item.label}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-2 px-3"
                      onClick={() => handleQuickPrompt(item.prompt)}
                      disabled={isLoading}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2",
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      )}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                          <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="min-h-[44px] max-h-32 resize-none rounded-xl"
                rows={1}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 rounded-xl flex-shrink-0"
                disabled={!input.trim() || isLoading}
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
      )}
    </>
  );
}
