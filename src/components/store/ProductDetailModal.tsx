import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StoreProductWithCategory } from '@/hooks/useStoreProducts';
import { useCart } from '@/contexts/CartContext';
import { Minus, Plus, ShoppingCart, Sparkles, Package, ExternalLink, CreditCard, ShoppingBag } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

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
  const { addItem } = useCart();

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

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= minQty && newQty <= maxQty) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
    onOpenChange(false);
  };

  const handleBuyNow = () => {
    if (product.cta_url) {
      window.open(product.cta_url, '_blank', 'noopener,noreferrer');
    } else {
      addItem(product, quantity);
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
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] p-0 gap-0 bg-background border-border overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>Detalhes do produto {product.name}</DialogDescription>
        </VisuallyHidden>
        
        <ScrollArea className="max-h-[90vh]">
          <div className="p-4 sm:p-6">
            {/* Main Content - Stack on mobile, side by side on desktop */}
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              
              {/* Left Column - Image and Info */}
              <div className="flex-1 space-y-4 sm:space-y-6 order-2 lg:order-1">
                {/* Product Header */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Image */}
                  <div className="shrink-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-xl overflow-hidden bg-muted border border-border mx-auto sm:mx-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                      {product.name}
                    </h2>
                    
                    {/* Price */}
                    <div className="flex flex-wrap items-baseline justify-center sm:justify-start gap-2 mb-3">
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
                      <span className="text-xl sm:text-2xl font-bold text-primary">
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
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Descrição</h3>
                  <div className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {product.long_description || product.short_description || 'Sem descrição disponível.'}
                  </div>
                </div>

                {/* Video */}
                {product.video_url && (
                  <>
                    <Separator />
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">Vídeo</h3>
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

              {/* Right Column - Purchase Panel (shows first on mobile) */}
              <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-3 sm:space-y-4 order-1 lg:order-2">
                {/* Stock Panel */}
                <div className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {isOutOfStock ? 'Estoque indisponível' : 'Estoque disponível'}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-primary">
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
                        className="h-8 w-8 sm:h-9 sm:w-9"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= minQty}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 sm:w-12 text-center font-medium text-base sm:text-lg">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= maxQty}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Total for selected quantity */}
                  {!isOutOfStock && quantity > 1 && (
                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between font-bold text-base sm:text-lg">
                        <span>Total:</span>
                        <span className="text-primary">{formatCurrency(getProductPrice())}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {product.cta_url ? (
                      <Button
                        className="w-full gap-2"
                        size="lg"
                        disabled={isOutOfStock}
                        onClick={handleBuyNow}
                      >
                        {isOutOfStock ? (
                          'Esgotado'
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4" />
                            Comprar agora
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          className="w-full gap-2"
                          size="lg"
                          disabled={isOutOfStock}
                          onClick={handleAddToCart}
                        >
                          {isOutOfStock ? (
                            'Esgotado'
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4" />
                              Adicionar ao carrinho
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Payment Methods */}
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-1.5">Meios de pagamento</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-xs sm:text-sm">À vista</span>
                    </div>
                  </div>
                </div>

                {/* Post-sale instructions preview */}
                {product.post_sale_instructions && (
                  <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                    <p className="text-xs text-muted-foreground mb-1">Após a compra:</p>
                    <p className="text-xs sm:text-sm text-foreground line-clamp-3">
                      {product.post_sale_instructions}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Related Products */}
            {filteredRelated.length > 0 && (
              <>
                <Separator className="my-4 sm:my-6" />
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Produtos Similares</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                    {filteredRelated.map((related) => {
                      const relatedOutOfStock = !related.stock || related.stock.trim() === '';
                      
                      return (
                        <div
                          key={related.id}
                          className={`rounded-lg border border-border bg-card p-2 sm:p-3 cursor-pointer hover:border-primary/50 transition-colors ${relatedOutOfStock ? 'opacity-60' : ''}`}
                          onClick={() => onSelectProduct?.(related)}
                        >
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-1.5 sm:mb-2 relative">
                            {related.image_url ? (
                              <img
                                src={related.image_url}
                                alt={related.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/30" />
                              </div>
                            )}
                            {relatedOutOfStock && (
                              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                                  ESGOTADO
                                </Badge>
                              </div>
                            )}
                          </div>
                          <h4 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 mb-0.5 sm:mb-1">
                            {related.name}
                          </h4>
                          <p className="text-xs sm:text-sm font-bold text-primary">
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
