import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, Copy, Package, AlertCircle, ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';

interface DeliveredItem {
  product_id: string;
  product_name: string;
  quantity: number;
  delivered_content: string[];
  post_sale_instructions?: string;
}

interface DeliveredProductsViewProps {
  deliveredItems: DeliveredItem[];
  onClose: () => void;
  showOrdersLink?: boolean;
}

export function DeliveredProductsView({ 
  deliveredItems, 
  onClose,
  showOrdersLink = false
}: DeliveredProductsViewProps) {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copiado!');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const copyAllContent = async () => {
    const allContent = deliveredItems
      .flatMap(item => item.delivered_content)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(allContent);
      toast.success('Todo o conteúdo foi copiado!');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Pagamento Confirmado!</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Seus produtos foram entregues automaticamente
        </p>
      </div>

      <Separator />

      {/* Delivered Products */}
      <div className="space-y-4 max-h-[50vh] overflow-y-auto">
        {deliveredItems.map((item, idx) => (
          <div 
            key={idx} 
            className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900"
          >
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="font-medium text-foreground">{item.product_name}</span>
              {item.quantity > 1 && (
                <span className="text-xs text-muted-foreground">(x{item.quantity})</span>
              )}
            </div>

            {/* Delivered Content */}
            {item.delivered_content && item.delivered_content.length > 0 && (
              <div className="space-y-2">
                {item.delivered_content.map((content, contentIdx) => (
                  <div 
                    key={contentIdx}
                    className="flex items-center gap-2 p-3 rounded-lg bg-background border"
                  >
                    <code className="flex-1 text-sm font-mono break-all select-all">
                      {content}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      onClick={() => copyToClipboard(content)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Post Sale Instructions */}
            {item.post_sale_instructions && (
              <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Instruções
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300 whitespace-pre-wrap">
                  {item.post_sale_instructions}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Copy All Button */}
      {deliveredItems.some(i => i.delivered_content?.length > 0) && (
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={copyAllContent}
        >
          <Copy className="h-4 w-4" />
          Copiar todo o conteúdo
        </Button>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {showOrdersLink && (
          <Button variant="outline" className="w-full gap-2" asChild>
            <a href="/meus-pedidos">
              <ExternalLink className="h-4 w-4" />
              Ver meus pedidos
            </a>
          </Button>
        )}
        <Button className="w-full" onClick={onClose}>
          Fechar
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        ⚠️ Salve este conteúdo em um local seguro. Ele também estará disponível em "Meus Pedidos".
      </p>
    </div>
  );
}
