import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import { 
  Search, Package, ArrowLeft, Clock, CheckCircle2, 
  XCircle, Truck, Loader2, Copy, AlertCircle, Mail, Lock, LogIn
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logo from '@/assets/logo-nova-era-3d.png';

interface DeliveredItem {
  product_id: string;
  product_name: string;
  quantity: number;
  delivered_content: string[];
  post_sale_instructions?: string;
}

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
  status: string;
  subtotal: number;
  discount_amount: number;
  total: number;
  coupon_code: string | null;
  payment_method: string;
  items: OrderItem[];
  delivered_items: DeliveredItem[];
  created_at: string;
  paid_at: string | null;
}

export default function OrderLookup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);
  const [checkedEmail, setCheckedEmail] = useState('');

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

  const checkIfRegisteredUser = async (emailToCheck: string): Promise<boolean> => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emailToCheck.toLowerCase().trim())
      .maybeSingle();
    
    return !!data;
  };

  const handleSearch = async () => {
    if (!email.trim()) {
      toast.error('Digite seu e-mail');
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();
    setIsLoading(true);

    try {
      // First check if email belongs to a registered user
      const isRegistered = await checkIfRegisteredUser(trimmedEmail);
      
      if (isRegistered) {
        setIsRegisteredUser(true);
        setCheckedEmail(trimmedEmail);
        setIsLoading(false);
        return;
      }

      // Not a registered user, proceed with normal search
      setHasSearched(true);
      
      const { data, error } = await supabase
        .from('store_orders')
        .select('*')
        .eq('customer_email', trimmedEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders((data || []) as unknown as Order[]);
      
      if (data && data.length === 0) {
        toast.info('Nenhum pedido encontrado para este e-mail');
      }
    } catch (error) {
      console.error('Error searching orders:', error);
      toast.error('Erro ao buscar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      toast.error('Digite sua senha');
      return;
    }

    setIsLoggingIn(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: checkedEmail,
        password: password.trim(),
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Senha incorreta');
        } else {
          toast.error('Erro ao fazer login');
        }
        return;
      }

      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Erro ao fazer login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleBackToEmailInput = () => {
    setIsRegisteredUser(false);
    setCheckedEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Nova Era" className="h-8 sm:h-10 w-auto" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a loja
        </Link>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Consultar Pedidos</h1>
            <p className="text-sm text-muted-foreground">
              Digite seu e-mail para ver suas compras
            </p>
          </div>
        </div>

        {/* Search Form or Login Form */}
        {isRegisteredUser ? (
          /* Login Form for Registered Users */
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-primary/10">
                <LogIn className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Usuário identificado!</p>
                <p className="text-sm text-muted-foreground">
                  Este e-mail pertence a uma conta registrada. Faça login para acessar seus pedidos.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">E-mail</Label>
                <div className="flex items-center gap-2 mt-1 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{checkedEmail}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handleBackToEmailInput}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button 
                  className="flex-1 gap-2" 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  Entrar no Dashboard
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Esqueceu a senha? <Link to="/auth" className="text-primary hover:underline">Recuperar acesso</Link>
              </p>
            </div>
          </div>
        ) : (
          /* Normal Email Search Form */
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="email" className="sr-only">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite o e-mail usado na compra"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button onClick={handleSearch} disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Buscar
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {hasSearched && !isLoading && (
          <>
            {orders.length === 0 ? (
              <div className="p-8 rounded-xl bg-card border border-border text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhum pedido encontrado para este e-mail.</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Verifique se digitou o e-mail corretamente.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {orders.length} pedido{orders.length > 1 ? 's' : ''} encontrado{orders.length > 1 ? 's' : ''}
                </p>

                {orders.map((order) => (
                  <div 
                    key={order.id}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    {/* Order Header */}
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="w-full p-4 flex items-start justify-between gap-4 hover:bg-accent/30 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(order.status)}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(order.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {order.items.length} {order.items.length === 1 ? 'produto' : 'produtos'}
                        </p>
                      </div>
                      <p className="font-bold text-primary shrink-0">{formatCurrency(order.total)}</p>
                    </button>

                    {/* Order Details */}
                    {expandedOrder === order.id && (
                      <div className="border-t border-border p-4 space-y-4">
                        {/* Items */}
                        <div>
                          <h4 className="font-medium text-sm mb-2">Produtos</h4>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
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
                            <span>{formatCurrency(order.subtotal)}</span>
                          </div>
                          {order.discount_amount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Desconto</span>
                              <span>-{formatCurrency(order.discount_amount)}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span className="text-primary">{formatCurrency(order.total)}</span>
                          </div>
                        </div>

                        {/* Delivered Content */}
                        {order.status === 'delivered' && order.delivered_items && order.delivered_items.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                                <Truck className="h-4 w-4 text-green-500" />
                                Conteúdo Entregue
                              </h4>
                              
                              {order.delivered_items.map((item, idx) => (
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
                          </>
                        )}

                        {/* Pending message */}
                        {order.status === 'pending' && (
                          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900">
                            <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Aguardando confirmação do pagamento
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
