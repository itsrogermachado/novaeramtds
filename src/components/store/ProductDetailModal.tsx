import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { StoreProductWithCategory } from '@/hooks/useStoreProducts';
import { useValidateCoupon, StoreCoupon } from '@/hooks/useStoreCoupons';
import { Minus, Plus, ShoppingCart, Sparkles, Package, ExternalLink, CreditCard, Ticket, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ProductDetailModalProps {
  product: StoreProductWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatedProducts?: StoreProductWithCategory[];
  onSelectProduct?: (product: StoreProductWithCategory) => void;
}

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
  relatedProducts = [],
  onSelectProduct,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<StoreCoupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const { validateCoupon, isValidating } = useValidateCoupon();

  if (!product) return null;

  const isOutOfStock = !product.stock || product.stock.trim() === '';
  const stockLines = product.stock?.split('\n').filter(line => line.trim()) || [];
  const availableStock = product.product_type === 'lines' ? stockLines.length : (product.stock ? 1 : 0);
  
  const minQty = product.min_quantity || 1;
  const maxQty = product.max_quantity && product.max_quantity > 0 
    ? Math.min(product.max_quantity, availableStock) 
    : availableStock;

  const hasComparisonPrice = product.comparison_price && 
    product.comparison_price !== '0' && 
    product.comparison_price !== '0,00' &&
    product.comparison_price !== product.price;

  const calculateDiscount = () => {
    if (!hasComparisonPrice) return null;
    const current = parseFloat(product.price.replace(',', '.').replace(/[^\d.]/g, ''));
    const comparison = parseFloat(product.comparison_price!.replace(',', '.').replace(/[^\d.]/g, ''));
    if (comparison > current && comparison > 0) {
      return Math.round(((comparison - current) / comparison) * 100);
    }
    return null;
  };

  const discount = calculateDiscount();

  const getProductPrice = () => {
    return parseFloat(product.price.replace(',', '.').replace(/[^\d.]/g, '')) * quantity;
  };

  const getFinalPrice = () => {
    const basePrice = getProductPrice();
    return basePrice - discountAmount;
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= minQty && newQty <= maxQty) {
      setQuantity(newQty);
      // Revalidate coupon with new quantity
      if (appliedCoupon) {
        handleApplyCoupon(true);
      }
    }
  };

  const handleApplyCoupon = async (silent = false) => {
    if (!couponCode.trim() && !appliedCoupon) {
      if (!silent) setCouponError('Digite o código do cupom');
      return;
    }

    const codeToValidate = appliedCoupon ? appliedCoupon.code : couponCode;
    const orderValue = getProductPrice();

    const result = await validateCoupon(
      codeToValidate,
      orderValue,
      product.id,
      product.category_id
    );

    if (result.valid && result.coupon) {
      setAppliedCoupon(result.coupon);
      setDiscountAmount(result.discountAmount || 0);
      setCouponError('');
      if (!silent) setCouponCode('');
    } else {
      if (!silent) {
        setCouponError(result.error || 'Cupom inválido');
        setAppliedCoupon(null);
        setDiscountAmount(0);
      }
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
    setCouponError('');
  };

  const handleBuy = () => {
    if (product.cta_url) {
      window.open(product.cta_url, '_blank', 'noopener,noreferrer');
    } else {
      // Placeholder for purchase logic
      console.log('Purchase:', { product, quantity, appliedCoupon, discountAmount, finalPrice: getFinalPrice() });
    }
  };

  const filteredRelated = relatedProducts
    .filter(p => p.id !== product.id)
    .slice(0, 4);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background">
        <div className="p-6">
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Image and Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Header */}
              <div className="flex gap-6">
                {/* Image */}
                <div className="shrink-0 w-32 h-32 lg:w-40 lg:h-40 rounded-xl overflow-hidden bg-muted border border-border">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {product.name}
                  </h2>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-3">
                    {hasComparisonPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        R$ {product.comparison_price}
                      </span>
                    )}
                    {discount && (
                      <Badge variant="destructive" className="text-xs">
                        -{discount}%
                      </Badge>
                    )}
                    <span className="text-2xl font-bold text-primary">
                      R$ {product.price}
                    </span>
                  </div>

                  {/* Delivery Type Badge */}
                  <Badge 
                    variant="secondary" 
                    className="gap-1.5"
                  >
                    {product.delivery_type === 'automatic' ? (
                      <>
                        <Sparkles className="h-3 w-3" />
                        Entrega Automática
                      </>
                    ) : (
                      <>
                        <Package className="h-3 w-3" />
                        Entrega Manual
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Descrição</h3>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {product.long_description || product.short_description || 'Sem descrição disponível.'}
                </div>
              </div>

              {/* Video */}
              {product.video_url && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Vídeo</h3>
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <iframe
                        src={product.video_url.replace('watch?v=', 'embed/')}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Purchase Panel */}
            <div className="space-y-4">
              {/* Stock Panel */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {isOutOfStock ? 'Estoque indisponível' : 'Estoque disponível'}
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    R$ {product.price}
                  </span>
                </div>

                {!isOutOfStock && (
                  <p className="text-xs text-muted-foreground">
                    {availableStock} disponíve{availableStock === 1 ? 'l' : 'is'}
                  </p>
                )}

                {/* Quantity Selector */}
                {!isOutOfStock && (
                  <div className="flex items-center justify-center gap-3 py-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= minQty}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium text-lg">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= maxQty}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Coupon Section */}
                {!isOutOfStock && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                      <Ticket className="h-4 w-4 text-primary" />
                      <span className="font-medium">Cupom de desconto</span>
                    </div>
                    
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-mono font-medium">{appliedCoupon.code}</span>
                          <Badge variant="secondary" className="text-xs">
                            -{appliedCoupon.discount_type === 'percentage' 
                              ? `${appliedCoupon.discount_value}%` 
                              : formatCurrency(appliedCoupon.discount_value)}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleRemoveCoupon}
                          className="h-6 px-2 text-xs"
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
                          className="uppercase text-sm"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleApplyCoupon(false)}
                          disabled={isValidating || !couponCode.trim()}
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
                )}

                {/* Price Summary */}
                {!isOutOfStock && discountAmount > 0 && (
                  <div className="space-y-1 pt-2 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>{formatCurrency(getProductPrice())}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto:</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-1">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(getFinalPrice())}</span>
                    </div>
                  </div>
                )}

                {/* Buy Button */}
                <Button
                  className="w-full gap-2"
                  size="lg"
                  disabled={isOutOfStock}
                  onClick={handleBuy}
                >
                  {isOutOfStock ? (
                    'Esgotado'
                  ) : product.cta_url ? (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      Comprar agora
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Comprar agora
                    </>
                  )}
                </Button>

                {/* Payment Methods */}
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Meios de pagamento</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-5 w-5" />
                    <span className="text-sm">À vista</span>
                  </div>
                </div>
              </div>

              {/* Post-sale instructions preview */}
              {product.post_sale_instructions && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">Após a compra:</p>
                  <p className="text-sm text-foreground line-clamp-3">
                    {product.post_sale_instructions}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {filteredRelated.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Produtos Similares</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {filteredRelated.map((related) => {
                    const relatedOutOfStock = !related.stock || related.stock.trim() === '';
                    
                    return (
                      <div
                        key={related.id}
                        className={`rounded-lg border border-border bg-card p-3 cursor-pointer hover:border-primary/50 transition-colors ${relatedOutOfStock ? 'opacity-60' : ''}`}
                        onClick={() => onSelectProduct?.(related)}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2 relative">
                          {related.image_url ? (
                            <img
                              src={related.image_url}
                              alt={related.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                          )}
                          {relatedOutOfStock && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                              <Badge variant="secondary" className="text-xs">
                                ESGOTADO
                              </Badge>
                            </div>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                          {related.name}
                        </h4>
                        <p className="text-sm font-bold text-primary">
                          R$ {related.price}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
