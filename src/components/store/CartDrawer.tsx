import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/contexts/CartContext';
import { useValidateCoupon } from '@/hooks/useStoreCoupons';
import { 
  Minus, Plus, Trash2, ShoppingCart, Package, Ticket, 
  CheckCircle2, XCircle, Loader2, ShoppingBag
} from 'lucide-react';

export function CartDrawer() {
  const { 
    items, 
    isOpen, 
    closeCart, 
    removeItem, 
    updateQuantity, 
    clearCart,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getTotal,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const { validateCoupon, isValidating } = useValidateCoupon();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Digite o código do cupom');
      return;
    }

    const subtotal = getSubtotal();
    
    // Validate coupon for the cart (no specific product/category restriction for cart-level)
    const result = await validateCoupon(couponCode, subtotal);

    if (result.valid && result.coupon) {
      applyCoupon(result.coupon, result.discountAmount || 0);
      setCouponCode('');
      setCouponError('');
    } else {
      setCouponError(result.error || 'Cupom inválido');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    setCouponError('');
  };

  const handleCheckout = () => {
    // Placeholder for checkout logic
    console.log('Checkout:', { items, appliedCoupon, discountAmount, total: getTotal() });
    // TODO: Integrate with payment system
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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 sm:p-6 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrinho
            {items.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {items.reduce((c, i) => c + i.quantity, 0)}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {items.length === 0 
              ? 'Seu carrinho está vazio' 
              : `${items.length} produto${items.length > 1 ? 's' : ''} no carrinho`
            }
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-2">Seu carrinho está vazio</p>
            <p className="text-sm text-muted-foreground/70">
              Adicione produtos para continuar
            </p>
            <Button variant="outline" onClick={closeCart} className="mt-4">
              Continuar comprando
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-4 sm:px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <div 
                    key={item.product.id}
                    className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                  >
                    {/* Image */}
                    <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
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
                      <h4 className="font-medium text-sm text-foreground line-clamp-2">
                        {item.product.name}
                      </h4>
                      <p className="text-sm font-bold text-primary mt-1">
                        R$ {item.product.price}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
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
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= getMaxQuantity(item)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer with Coupon & Summary */}
            <div className="border-t border-border p-4 sm:p-6 space-y-4">
              {/* Coupon Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Ticket className="h-4 w-4 text-primary" />
                  <span className="font-medium">Cupom de desconto</span>
                </div>
                
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      <span className="text-sm font-mono font-medium truncate">{appliedCoupon.code}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        -{appliedCoupon.discount_type === 'percentage' 
                          ? `${appliedCoupon.discount_value}%` 
                          : formatCurrency(appliedCoupon.discount_value)}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleRemoveCoupon}
                      className="h-6 px-2 text-xs shrink-0"
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Código do cupom"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      className="uppercase text-sm h-9"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleApplyCoupon}
                      disabled={isValidating || !couponCode.trim()}
                      className="h-9 px-3"
                    >
                      {isValidating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Aplicar'
                      )}
                    </Button>
                  </div>
                )}
                
                {couponError && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <XCircle className="h-3 w-3" />
                    {couponError}
                  </div>
                )}
              </div>

              <Separator />

              {/* Price Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(getSubtotal())}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(getTotal())}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Finalizar Compra
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-destructive hover:text-destructive" 
                  onClick={clearCart}
                >
                  Limpar carrinho
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
