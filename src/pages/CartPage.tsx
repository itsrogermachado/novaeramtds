import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useValidateCoupon } from '@/hooks/useStoreCoupons';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CartButton } from '@/components/store/CartButton';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import logo from '@/assets/logo-nova-era-3d.png';
import { 
  ArrowLeft, Minus, Plus, Trash2, Package, Ticket, 
  CheckCircle2, XCircle, Loader2, ShoppingBag, Zap
} from 'lucide-react';
import { toast } from 'sonner';

export default function CartPage() {
  const navigate = useNavigate();
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getTotal,
    itemCount,
  } = useCart();

  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { validateCoupon, isValidating } = useValidateCoupon();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getMaxQuantity = (item: typeof items[0]) => {
    const stockLines = item.product.stock?.split('\n').filter(line => line.trim()) || [];
    const availableStock = item.product.product_type === 'lines' ? stockLines.length : 1;
    return item.product.max_quantity && item.product.max_quantity > 0 
      ? Math.min(item.product.max_quantity, availableStock) 
      : availableStock;
  };

  const getMinQuantity = (item: typeof items[0]) => {
    return item.product.min_quantity || 1;
  };

  const getAvailableStock = (item: typeof items[0]) => {
    const stockLines = item.product.stock?.split('\n').filter(line => line.trim()) || [];
    return item.product.product_type === 'lines' ? stockLines.length : 1;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Digite o código do cupom');
      return;
    }

    const subtotal = getSubtotal();
    const result = await validateCoupon(couponCode, subtotal);

    if (result.valid && result.coupon) {
      applyCoupon(result.coupon, result.discountAmount || 0);
      setCouponCode('');
      setCouponError('');
      toast.success('Cupom aplicado com sucesso!');
    } else {
      setCouponError(result.error || 'Cupom inválido');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    setCouponError('');
  };

  const handleCheckout = async () => {
    if (!email.trim()) {
      toast.error('Informe seu e-mail');
      return;
    }

    if (email !== confirmEmail) {
      toast.error('Os e-mails não coincidem');
      return;
    }

    if (items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order in database
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: parseFloat(item.product.price.replace(',', '.').replace(/[^\d.]/g, '')),
        total: parseFloat(item.product.price.replace(',', '.').replace(/[^\d.]/g, '')) * item.quantity,
      }));

      const { error } = await supabase
        .from('store_orders')
        .insert({
          customer_email: email,
          payment_method: paymentMethod,
          status: 'pending',
          subtotal: getSubtotal(),
          discount_amount: discountAmount,
          total: getTotal(),
          coupon_code: appliedCoupon?.code || null,
          items: orderItems,
        });

      if (error) throw error;

      toast.success('Pedido criado com sucesso!');
      clearCart();
      navigate('/');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erro ao processar pedido. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Nova Era" className="h-8 sm:h-10 w-auto" />
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-col items-center justify-center py-20 px-4">
          <ShoppingBag className="h-20 w-20 text-muted-foreground/30 mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Carrinho vazio</h1>
          <p className="text-muted-foreground mb-6">Adicione produtos para continuar</p>
          <Button className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar para a loja
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Nova Era" className="h-8 sm:h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CartButton variant="outline" size="icon" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Carrinho de compras</h1>
          <p className="text-muted-foreground mt-1">
            Nesta página, você encontra os produtos adicionados ao seu carrinho.
          </p>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column - Payment Info */}
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-foreground mb-4">Informações de pagamento</h2>
              
              {/* Payment Method */}
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mb-6">
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-muted/30">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="font-medium">Pix</span>
                  </Label>
                </div>
              </RadioGroup>

              {/* Email Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm text-muted-foreground">
                    Informe o seu e-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmEmail" className="text-sm text-muted-foreground">
                    Informe novamente o seu e-mail
                  </Label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    placeholder="seu@email.com"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Coupon Section */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Ticket className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium text-foreground">Cupom de desconto</h3>
                  <p className="text-xs text-muted-foreground">Adicione desconto em seu pedido!</p>
                </div>
              </div>
              
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="font-mono font-medium text-sm">{appliedCoupon.code}</span>
                    <Badge variant="secondary" className="text-xs">
                      -{appliedCoupon.discount_type === 'percentage' 
                        ? `${appliedCoupon.discount_value}%` 
                        : formatCurrency(appliedCoupon.discount_value)}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemoveCoupon}>
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Código do cupom"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      className="uppercase"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={handleApplyCoupon}
                    disabled={isValidating || !couponCode.trim()}
                  >
                    {isValidating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Ticket className="h-4 w-4" />
                        Adicionar
                      </>
                    )}
                  </Button>
                  {couponError && (
                    <div className="flex items-center gap-1.5 text-xs text-destructive">
                      <XCircle className="h-3 w-3" />
                      {couponError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center Column - Products */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-foreground">Produtos no carrinho</h2>
                <Badge variant="secondary">{itemCount} ite{itemCount === 1 ? 'm' : 'ns'}</Badge>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={item.product.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border"
                  >
                    {/* Image */}
                    <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-muted">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-foreground line-clamp-2">
                        {item.product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {item.product.delivery_type === 'automatic' && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Zap className="h-2.5 w-2.5" />
                            Auto
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          disabled={item.quantity <= getMinQuantity(item)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= getMaxQuantity(item)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {getAvailableStock(item)} disponíveis
                      </span>
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground">
                        {formatCurrency(
                          parseFloat(item.product.price.replace(',', '.').replace(/[^\d.]/g, '')) * item.quantity
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-card p-5 sticky top-4">
              <h2 className="font-semibold text-foreground mb-4">Resumo da compra</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(getSubtotal())}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Desconto</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Método</span>
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="font-medium capitalize">{paymentMethod}</span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center mb-6">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(getTotal())}</span>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing || !email || email !== confirmEmail}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  'Gerar pagamento'
                )}
              </Button>

              <Button 
                variant="ghost" 
                className="w-full mt-2 text-destructive hover:text-destructive"
                onClick={clearCart}
              >
                Limpar carrinho
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
