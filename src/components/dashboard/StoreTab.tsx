import { useState } from 'react';
import { useStoreCategories } from '@/hooks/useStoreCategories';
import { useStoreProducts, StoreProductWithCategory } from '@/hooks/useStoreProducts';
import { useCart } from '@/contexts/CartContext';
import { ProductDetailModal } from '@/components/store/ProductDetailModal';
import { CartButton } from '@/components/store/CartButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Package, 
  ShoppingCart, 
  Zap, 
  Search, 
  Store,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function StoreTab() {
  const { categories, isLoading: categoriesLoading } = useStoreCategories();
  const { products, isLoading: productsLoading } = useStoreProducts();
  const { addItem } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<StoreProductWithCategory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const isLoading = categoriesLoading || productsLoading;

  // Filter active categories only
  const activeCategories = categories.filter(c => c.status === 'active');

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.short_description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: StoreProductWithCategory) => {
    addItem(product, product.min_quantity || 1);
    toast.success('Produto adicionado ao carrinho!');
  };

  const handleViewProduct = (product: StoreProductWithCategory) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const getStockStatus = (product: StoreProductWithCategory) => {
    const stockLines = product.stock?.split('\n').filter(line => line.trim()) || [];
    const availableStock = product.product_type === 'lines' ? stockLines.length : (product.stock ? 1 : 0);
    return { available: availableStock > 0, count: availableStock };
  };

  const calculateDiscount = (price: string, comparisonPrice?: string | null) => {
    if (!comparisonPrice || comparisonPrice === '0' || comparisonPrice === '0,00') return null;
    const current = parseFloat(price.replace(',', '.').replace(/[^\d.]/g, ''));
    const comparison = parseFloat(comparisonPrice.replace(',', '.').replace(/[^\d.]/g, ''));
    if (comparison > current && comparison > 0) {
      return Math.round(((comparison - current) / comparison) * 100);
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Loja Nova Era</h2>
            <p className="text-sm text-muted-foreground">
              {products.length} produto{products.length !== 1 ? 's' : ''} disponíve{products.length !== 1 ? 'is' : 'l'}
            </p>
          </div>
        </div>
        <CartButton showLabel className="gap-2" />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Pills */}
      {activeCategories.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="shrink-0"
            >
              Todos
            </Button>
            {activeCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="shrink-0 gap-1.5"
              >
                <span>{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory 
                ? 'Nenhum produto encontrado com esses filtros'
                : 'Nenhum produto disponível no momento'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const stock = getStockStatus(product);
            const discount = calculateDiscount(product.price, product.comparison_price);
            const hasComparisonPrice = product.comparison_price && 
              product.comparison_price !== '0' && 
              product.comparison_price !== '0,00';

            return (
              <Card 
                key={product.id} 
                className={`group overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30 ${!stock.available ? 'opacity-60' : ''}`}
              >
                {/* Image */}
                <div 
                  className="relative aspect-square bg-muted cursor-pointer overflow-hidden"
                  onClick={() => handleViewProduct(product)}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground/20" />
                    </div>
                  )}

                  {/* Badges overlay */}
                  <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      {discount && (
                        <Badge variant="destructive" className="text-xs">
                          -{discount}%
                        </Badge>
                      )}
                      {product.is_featured && (
                        <Badge className="text-xs gap-1 bg-amber-500 hover:bg-amber-600">
                          <Sparkles className="h-3 w-3" />
                          Destaque
                        </Badge>
                      )}
                    </div>
                    {product.delivery_type === 'automatic' && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Zap className="h-3 w-3" />
                        Auto
                      </Badge>
                    )}
                  </div>

                  {/* Out of stock overlay */}
                  {!stock.available && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Badge variant="secondary" className="text-sm">
                        ESGOTADO
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Category */}
                  <p className="text-xs text-muted-foreground">
                    {product.store_categories?.name || 'Sem categoria'}
                  </p>

                  {/* Name */}
                  <h3 
                    className="font-semibold text-foreground line-clamp-2 cursor-pointer hover:text-primary transition-colors min-h-[2.5rem]"
                    onClick={() => handleViewProduct(product)}
                  >
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    {hasComparisonPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        R$ {product.comparison_price}
                      </span>
                    )}
                    <span className="text-lg font-bold text-primary">
                      R$ {product.price}
                    </span>
                  </div>

                  {/* Stock info */}
                  {stock.available && (
                    <p className="text-xs text-muted-foreground">
                      {stock.count} disponíve{stock.count === 1 ? 'l' : 'is'}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewProduct(product)}
                    >
                      Ver detalhes
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5"
                      disabled={!stock.available}
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Comprar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
        relatedProducts={filteredProducts.filter(p => 
          selectedProduct && 
          p.category_id === selectedProduct.category_id && 
          p.id !== selectedProduct.id
        )}
        onSelectProduct={(product) => {
          setSelectedProduct(product);
        }}
      />
    </div>
  );
}
