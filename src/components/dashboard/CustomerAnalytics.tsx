import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Search, 
  Eye, 
  ShoppingBag, 
  Tag,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Order {
  id: string;
  customer_email: string;
  payment_method: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  total: number;
  coupon_code: string | null;
  items: OrderItem[];
  created_at: string;
  paid_at: string | null;
}

interface CustomerStats {
  email: string;
  totalSpent: number;
  totalOrders: number;
  paidOrders: number;
  uniqueProducts: Set<string>;
  couponsUsed: Set<string>;
  lastOrderDate: string;
  orders: Order[];
}

interface CustomerAnalyticsProps {
  orders: Order[];
}

export function CustomerAnalytics({ orders }: CustomerAnalyticsProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'spent' | 'orders' | 'recent'>('spent');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerStats | null>(null);

  const customerStats = useMemo(() => {
    const statsMap = new Map<string, CustomerStats>();

    for (const order of orders) {
      const email = order.customer_email.toLowerCase();
      
      if (!statsMap.has(email)) {
        statsMap.set(email, {
          email: order.customer_email,
          totalSpent: 0,
          totalOrders: 0,
          paidOrders: 0,
          uniqueProducts: new Set(),
          couponsUsed: new Set(),
          lastOrderDate: order.created_at,
          orders: [],
        });
      }

      const stats = statsMap.get(email)!;
      stats.totalOrders += 1;
      stats.orders.push(order);

      if (order.status === 'paid' || order.status === 'delivered') {
        stats.totalSpent += order.total;
        stats.paidOrders += 1;
      }

      for (const item of order.items) {
        stats.uniqueProducts.add(item.product_name);
      }

      if (order.coupon_code) {
        stats.couponsUsed.add(order.coupon_code);
      }

      if (new Date(order.created_at) > new Date(stats.lastOrderDate)) {
        stats.lastOrderDate = order.created_at;
      }
    }

    return Array.from(statsMap.values());
  }, [orders]);

  const filteredAndSorted = useMemo(() => {
    let result = customerStats;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.email.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'spent') {
        cmp = b.totalSpent - a.totalSpent;
      } else if (sortBy === 'orders') {
        cmp = b.totalOrders - a.totalOrders;
      } else {
        cmp = new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      }
      return sortAsc ? -cmp : cmp;
    });

    return result;
  }, [customerStats, search, sortBy, sortAsc]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const toggleSort = (field: 'spent' | 'orders' | 'recent') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ field }: { field: 'spent' | 'orders' | 'recent' }) => {
    if (sortBy !== field) return null;
    return sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Clientes</h3>
          <p className="text-xs text-muted-foreground">
            {customerStats.length} clientes únicos
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Sort buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={sortBy === 'spent' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => toggleSort('spent')}
          className="gap-1"
        >
          <TrendingUp className="h-3 w-3" />
          Total Gasto
          <SortIcon field="spent" />
        </Button>
        <Button 
          variant={sortBy === 'orders' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => toggleSort('orders')}
          className="gap-1"
        >
          <ShoppingBag className="h-3 w-3" />
          Pedidos
          <SortIcon field="orders" />
        </Button>
        <Button 
          variant={sortBy === 'recent' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => toggleSort('recent')}
          className="gap-1"
        >
          Recente
          <SortIcon field="recent" />
        </Button>
      </div>

      {/* Customer List */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {filteredAndSorted.map((customer) => (
            <div
              key={customer.email}
              className="p-3 rounded-lg bg-card border border-border hover:bg-accent/30 transition-colors cursor-pointer"
              onClick={() => setSelectedCustomer(customer)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{customer.email}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{customer.paidOrders}/{customer.totalOrders} pedidos</span>
                    {customer.couponsUsed.size > 0 && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {customer.couponsUsed.size} cupom
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-primary">{formatCurrency(customer.totalSpent)}</p>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
                    <Eye className="h-3 w-3" />
                    Ver
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Details Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Detalhes do Cliente
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Total Gasto</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(selectedCustomer.totalSpent)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Pedidos Pagos</p>
                    <p className="text-lg font-bold">
                      {selectedCustomer.paidOrders}/{selectedCustomer.totalOrders}
                    </p>
                  </div>
                </div>

                {/* Products bought */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Produtos Comprados</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(selectedCustomer.uniqueProducts).map((product) => (
                      <Badge key={product} variant="secondary" className="text-xs">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Coupons used */}
                {selectedCustomer.couponsUsed.size > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Cupons Utilizados</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(selectedCustomer.couponsUsed).map((coupon) => (
                        <Badge key={coupon} variant="outline" className="text-xs gap-1">
                          <Tag className="h-3 w-3" />
                          {coupon}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Order history */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Histórico de Pedidos</p>
                  <div className="space-y-2">
                    {selectedCustomer.orders
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((order) => (
                        <div 
                          key={order.id} 
                          className="p-3 rounded-lg bg-muted/30 text-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                              <p className="text-xs mt-1">
                                {order.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={
                                  order.status === 'delivered' || order.status === 'paid' 
                                    ? 'default' 
                                    : order.status === 'pending' 
                                      ? 'secondary' 
                                      : 'destructive'
                                }
                                className="text-xs"
                              >
                                {order.status === 'pending' ? 'Pendente' :
                                 order.status === 'paid' ? 'Pago' :
                                 order.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                              </Badge>
                              <p className="font-bold mt-1">{formatCurrency(order.total)}</p>
                              {order.coupon_code && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                                  <Tag className="h-3 w-3" />
                                  {order.coupon_code}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
