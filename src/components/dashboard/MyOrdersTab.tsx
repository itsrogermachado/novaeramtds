import { useState } from 'react';
import { useCustomerOrders, CustomerOrder } from '@/hooks/useCustomerOrders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye,
  Copy,
  Truck,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function MyOrdersTab() {
  // Always show only user's own orders, regardless of admin status
  const { data: orders, isLoading } = useCustomerOrders(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'paid':
        return <Badge className="gap-1 bg-blue-500"><CheckCircle2 className="h-3 w-3" /> Pago</Badge>;
      case 'delivered':
        return <Badge className="gap-1 bg-green-500"><Truck className="h-3 w-3" /> Entregue</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Falhou</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copiado!');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const openDetails = (order: CustomerOrder) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-1" />
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <ShoppingBag className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Meus Pedidos</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe suas compras e acesse os produtos entregues
          </p>
        </div>
      </div>

      {/* Orders List */}
      {!orders || orders.length === 0 ? (
        <div className="p-8 rounded-xl bg-card border border-border text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Você ainda não fez nenhuma compra.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Explore nossa loja e encontre produtos incríveis!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div 
              key={order.id}
              className="p-4 rounded-xl bg-card border border-border hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(order.status)}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} {order.items.length === 1 ? 'produto' : 'produtos'}
                    </p>
                    <p className="text-xs text-muted-foreground/70 truncate">
                      {order.items.map(i => i.product_name).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-primary">{formatCurrency(order.total)}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-1 gap-1"
                    onClick={() => openDetails(order)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver detalhes
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalhes do Pedido
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status & Date */}
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedOrder.status)}
                <span className="text-sm text-muted-foreground">
                  {formatDate(selectedOrder.created_at)}
                </span>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium text-sm mb-3">Produtos</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-sm">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Delivered Content */}
              {selectedOrder.status === 'delivered' && selectedOrder.delivered_items && selectedOrder.delivered_items.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-green-500" />
                      Conteúdo Entregue
                    </h4>
                    
                    {selectedOrder.delivered_items.map((item, idx) => (
                      <div key={idx} className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                        <p className="font-medium text-sm mb-2">{item.product_name}</p>
                        
                        {item.delivered_content && item.delivered_content.length > 0 && (
                          <div className="space-y-2">
                            {item.delivered_content.map((content, contentIdx) => (
                              <div 
                                key={contentIdx}
                                className="flex items-center gap-2 p-2 rounded bg-background border"
                              >
                                <code className="flex-1 text-xs font-mono break-all">
                                  {content}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 h-7 w-7"
                                  onClick={() => copyToClipboard(content)}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {item.post_sale_instructions && (
                          <div className="mt-3 p-3 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Instruções
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-300 whitespace-pre-wrap">
                              {item.post_sale_instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending message */}
              {selectedOrder.status === 'pending' && (
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Aguardando confirmação do pagamento
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
