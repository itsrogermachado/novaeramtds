import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface CartButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function CartButton({ 
  variant = 'outline', 
  size = 'default',
  className = '',
  showLabel = false,
}: CartButtonProps) {
  const { toggleCart, itemCount } = useCart();

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={toggleCart}
      className={`relative ${className}`}
    >
      <ShoppingCart className="h-4 w-4" />
      {showLabel && <span className="ml-2">Carrinho</span>}
      {itemCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  );
}
