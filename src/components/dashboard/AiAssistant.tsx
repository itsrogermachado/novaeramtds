import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Send, Loader2, Sparkles, Bot, User, X, Trash2, ImagePlus, X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

type MessageContent = 
  | string 
  | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;

type Message = {
  role: 'user' | 'assistant';
  content: MessageContent;
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
  embedded?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const QUICK_PROMPTS = [
  { label: '📊 Análise', prompt: 'Analise minha performance atual de forma breve' },
  { label: '💡 Insights', prompt: 'Dê 2-3 insights rápidos sobre meus resultados' },
  { label: '🎯 Metas', prompt: 'Sugira uma meta realista para esta semana' },
  { label: '📈 Tendências', prompt: 'Qual a tendência dos meus resultados?' },
];

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB limit
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Helper to extract text content from a message
const getTextContent = (content: MessageContent): string => {
  if (typeof content === 'string') return content;
  const textPart = content.find(part => part.type === 'text');
  return textPart && 'text' in textPart ? textPart.text : '';
};

// Helper to extract images from a message
const getImageUrls = (content: MessageContent): string[] => {
  if (typeof content === 'string') return [];
  return content
    .filter((part): part is { type: 'image_url'; image_url: { url: string } } => part.type === 'image_url')
    .map(part => part.image_url.url);
};

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Memoized chat content to prevent re-renders
interface ChatContentProps {
  messages: Message[];
  isLoading: boolean;
  input: string;
  pendingImages: string[];
  onInputChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onQuickPrompt: (prompt: string) => void;
  onImageAdd: (files: FileList | null) => void;
  onImageRemove: (index: number) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  scrollRef: React.RefObject<HTMLDivElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const ChatContent = memo(function ChatContent({
  messages,
  isLoading,
  input,
  pendingImages,
  onInputChange,
  onSubmit,
  onKeyDown,
  onQuickPrompt,
  onImageAdd,
  onImageRemove,
  onPaste,
  textareaRef,
  scrollRef,
  fileInputRef,
}: ChatContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4 py-8">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Olá! Sou seu assistente</h4>
              <p className="text-sm text-muted-foreground">
                Posso analisar suas operações, imagens e dar insights rápidos.
              </p>
            </div>
            
            {/* Quick prompts - horizontal scroll on mobile */}
            <div className="w-full mt-2 overflow-x-auto pb-2">
              <div className="flex gap-2 min-w-max md:grid md:grid-cols-2 md:min-w-0">
                {QUICK_PROMPTS.map((item) => (
                  <Button
                    key={item.label}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2 px-3 whitespace-nowrap"
                    onClick={() => onQuickPrompt(item.prompt)}
                    disabled={isLoading}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => {
              const textContent = getTextContent(msg.content);
              const imageUrls = getImageUrls(msg.content);
              
              return (
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
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    )}
                  >
                    {/* Display images if any */}
                    {imageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {imageUrls.map((url, imgIdx) => (
                          <img
                            key={imgIdx}
                            src={url}
                            alt={`Uploaded ${imgIdx + 1}`}
                            className="max-w-[200px] max-h-[150px] rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}
                    
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                        <ReactMarkdown>{textContent || '...'}</ReactMarkdown>
                      </div>
                    ) : (
                      textContent && <p>{textContent}</p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
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
      <form onSubmit={onSubmit} className="p-4 border-t border-border bg-background/50">
        {/* Pending images preview */}
        {pendingImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {pendingImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img}
                  alt={`Preview ${idx + 1}`}
                  className="w-16 h-16 rounded-lg object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={() => onImageRemove(idx)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onImageAdd(e.target.files)}
          />
          
          {/* Image upload button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="Anexar imagem"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder="Digite ou cole uma imagem..."
            className="min-h-[44px] max-h-32 resize-none rounded-xl"
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 rounded-xl flex-shrink-0"
            disabled={(!input.trim() && pendingImages.length === 0) || isLoading}
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
  );
});

export function AiAssistant({ context, embedded = false }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  // Store context in ref to avoid re-creating streamChat on every context change
  const contextRef = useRef(context);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleImageAdd = useCallback(async (files: FileList | null) => {
    if (!files) return;
    
    const validImages: string[] = [];
    
    for (const file of Array.from(files)) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`Tipo de arquivo não suportado: ${file.type}`);
        continue;
      }
      
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`Imagem muito grande (máx 4MB): ${file.name}`);
        continue;
      }
      
      try {
        const base64 = await fileToBase64(file);
        validImages.push(base64);
      } catch {
        toast.error(`Erro ao processar: ${file.name}`);
      }
    }
    
    if (validImages.length > 0) {
      setPendingImages(prev => [...prev, ...validImages].slice(0, 4)); // Max 4 images
    }
  }, []);

  const handleImageRemove = useCallback((index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    const imageFiles: File[] = [];
    
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    
    if (imageFiles.length > 0) {
      e.preventDefault(); // Prevent pasting image as text
      const dataTransfer = new DataTransfer();
      imageFiles.forEach(f => dataTransfer.items.add(f));
      handleImageAdd(dataTransfer.files);
    }
  }, [handleImageAdd]);

  const streamChat = useCallback(async (userMessage: string, images: string[] = []) => {
    setIsLoading(true);
    
    // Build message content
    let content: MessageContent;
    if (images.length > 0) {
      content = [
        { type: 'text' as const, text: userMessage || 'Analise esta imagem' },
        ...images.map(img => ({ 
          type: 'image_url' as const, 
          image_url: { url: img } 
        }))
      ];
    } else {
      content = userMessage;
    }
    
    const userMsg: Message = { role: 'user', content };
    
    setMessages(prev => {
      const newMessages = [...prev, userMsg];
      
      // Start the fetch with the new messages
      (async () => {
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
              context: contextRef.current 
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
          setMessages(msgs => [...msgs, { role: 'assistant', content: '' }]);

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
                  setMessages(msgs => {
                    const updated = [...msgs];
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
          setMessages(msgs => [
            ...msgs.slice(0, -1),
            { role: 'assistant', content: `❌ ${error instanceof Error ? error.message : 'Erro ao processar mensagem'}` }
          ]);
        } finally {
          setIsLoading(false);
        }
      })();
      
      return newMessages;
    });
    
    setInput('');
    setPendingImages([]);
  }, []);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && pendingImages.length === 0) || isLoading) return;
    streamChat(input.trim(), pendingImages);
  }, [input, pendingImages, isLoading, streamChat]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleQuickPrompt = useCallback((prompt: string) => {
    if (isLoading) return;
    streamChat(prompt);
  }, [isLoading, streamChat]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setPendingImages([]);
  }, []);

  // Trigger button for embedded mode
  const TriggerButton = () => (
    <Button
      onClick={() => setIsOpen(true)}
      variant="outline"
      size="sm"
      className="gap-2 h-8 px-3 text-xs md:text-sm bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 hover:bg-primary/15 transition-all"
    >
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      <span className="hidden sm:inline">Assistente IA</span>
      <span className="sm:hidden">IA</span>
    </Button>
  );

  // Mobile: Use Sheet (fullscreen drawer)
  if (isMobile) {
    return (
      <>
        {embedded && <TriggerButton />}
        
        {!embedded && (
          <Button
            onClick={() => setIsOpen(true)}
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 z-50 gap-2 h-10 px-4 shadow-lg bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>IA</span>
          </Button>
        )}

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-2xl">
            <SheetHeader className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <SheetTitle className="text-sm font-semibold">Assistente Nova Era</SheetTitle>
                    <p className="text-xs text-muted-foreground">Analisa texto e imagens</p>
                  </div>
                </div>
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={handleClearChat}
                    title="Limpar conversa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </SheetHeader>
            <div className="h-[calc(90vh-73px)]">
              <ChatContent
                messages={messages}
                isLoading={isLoading}
                input={input}
                pendingImages={pendingImages}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                onKeyDown={handleKeyDown}
                onQuickPrompt={handleQuickPrompt}
                onImageAdd={handleImageAdd}
                onImageRemove={handleImageRemove}
                onPaste={handlePaste}
                textareaRef={textareaRef}
                scrollRef={scrollRef}
                fileInputRef={fileInputRef}
              />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Use popover-style panel
  return (
    <>
      {embedded && <TriggerButton />}
      
      {!embedded && (
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "fixed bottom-4 right-4 z-50 rounded-xl px-4 py-3 shadow-lg transition-all duration-300 gap-2",
            "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          )}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          <span className="font-medium">{isOpen ? "Fechar" : "Assistente IA"}</span>
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col transition-all duration-300",
            embedded
              ? "bottom-12 right-0 w-[400px] h-[500px] max-h-[calc(100vh-120px)]"
              : "bottom-20 right-4 w-[380px] h-[520px] max-h-[calc(100vh-120px)]"
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
                <p className="text-xs text-muted-foreground">Analisa texto e imagens</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={handleClearChat}
                  title="Limpar conversa"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ChatContent
            messages={messages}
            isLoading={isLoading}
            input={input}
            pendingImages={pendingImages}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            onQuickPrompt={handleQuickPrompt}
            onImageAdd={handleImageAdd}
            onImageRemove={handleImageRemove}
            onPaste={handlePaste}
            textareaRef={textareaRef}
            scrollRef={scrollRef}
            fileInputRef={fileInputRef}
          />
        </div>
      )}
    </>
  );
}
