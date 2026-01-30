import { useState } from 'react';
import { ShoppingCart, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DigitalProduct } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: DigitalProduct;
  onBuy: (product: DigitalProduct) => void;
}

export function ProductCard({ product, onBuy }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 border-border/50",
        "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30",
        isHovered && "scale-[1.02]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Featured badge */}
      {product.is_featured && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-gradient-to-r from-gold to-amber-500 text-white border-0 gap-1">
            <Sparkles className="h-3 w-3" />
            Destaque
          </Badge>
        </div>
      )}

      {/* Discount badge */}
      {hasDiscount && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="destructive" className="font-bold">
            -{discountPercent}%
          </Badge>
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <ShoppingCart className="h-12 w-12 text-primary/50" />
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "flex items-end justify-center pb-4"
        )}>
          <Button 
            onClick={() => onBuy(product)}
            className="btn-premium gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Comprar agora
          </Button>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Category */}
        {product.category && (
          <Badge variant="secondary" className="text-xs">
            {product.category.name}
          </Badge>
        )}

        {/* Title */}
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Short description */}
        {product.short_description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.short_description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 pt-2">
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(product.original_price!)}
            </span>
          )}
        </div>

        {/* Mobile buy button */}
        <Button 
          onClick={() => onBuy(product)}
          className="w-full md:hidden btn-premium gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Comprar
        </Button>
      </CardContent>
    </Card>
  );
}
