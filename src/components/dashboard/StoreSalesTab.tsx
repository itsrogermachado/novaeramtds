import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Package, Eye, CheckCircle, XCircle, Clock, Loader2, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';

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
  updated_at: string;
  paid_at: string | null;
}

export function StoreSalesTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['store-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(order => ({
        ...order,
        items: (order.items as unknown as OrderItem[]) || [],
      })) as Order[];
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
      case 'paid':
        return <Badge variant="default" className="gap-1 bg-success text-success-foreground"><CheckCircle className="h-3 w-3" />Pago</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Cancelado</Badge>;
      case 'delivered':
        return <Badge variant="default" className="gap-1"><Package className="h-3 w-3" />Entregue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('store_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Status atualizado!');
      refetch();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = search === '' || 
      order.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders
    .filter(o => o.status === 'paid' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const totalPending = orders
    .filter(o => o.status === 'pending')
    .reduce((sum, o) => sum + o.total, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-sm text-muted-foreground">Total de Pedidos</p>
          <p className="text-2xl font-bold text-foreground">{orders.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-sm text-muted-foreground">Receita Total</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-bold text-warning">{formatCurrency(totalPending)}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-sm text-muted-foreground">Pagos</p>
          <p className="text-2xl font-bold text-foreground">
            {orders.filter(o => o.status === 'paid' || o.status === 'delivered').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por e-mail ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.customer_email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} itens
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold">
                    {formatCurrency(order.total)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              ID: {selectedOrder?.id.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {/* Customer Info */}
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedOrder.customer_email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Método</p>
                    <p className="font-medium capitalize">{selectedOrder.payment_method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {format(new Date(selectedOrder.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Items */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Produtos</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm p-2 rounded bg-muted/30">
                        <span>
                          {item.quantity}x {item.product_name}
                        </span>
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Desconto ({selectedOrder.coupon_code})</span>
                      <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                <Separator />

                {/* Status Update */}
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Alterar Status</p>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'paid', 'delivered', 'cancelled'].map((status) => (
                      <Button
                        key={status}
                        variant={selectedOrder.status === status ? 'default' : 'outline'}
                        size="sm"
                        disabled={isUpdating || selectedOrder.status === status}
                        onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          status === 'pending' ? 'Pendente' :
                          status === 'paid' ? 'Pago' :
                          status === 'delivered' ? 'Entregue' : 'Cancelado'
                        )}
                      </Button>
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
