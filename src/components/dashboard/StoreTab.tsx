import { useState } from 'react';
import { useStoreCategories, StoreCategory } from '@/hooks/useStoreCategories';
import { ProductDetailModal } from '@/components/store/ProductDetailModal';
import { CartButton } from '@/components/store/CartButton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { StoreProductWithCategory } from '@/hooks/useStoreProducts';
import { 
  Package, 
  ShoppingCart, 
  Store,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function StoreTab() {
  const { categories, isLoading: categoriesLoading } = useStoreCategories(true);

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<StoreProductWithCategory[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StoreProductWithCategory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCategoryClick = async (category: StoreCategory) => {
    if (expandedCategory === category.id) {
      // Collapse if already expanded
      setExpandedCategory(null);
      setProducts([]);
      return;
    }

    // Expand and fetch products
    setExpandedCategory(category.id);
    setIsLoadingProducts(true);

    const { data, error } = await supabase
      .from('store_products')
      .select('*, store_categories(name, slug)')
      .eq('category_id', category.id)
      .eq('status', 'active')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } else {
      setProducts((data || []) as StoreProductWithCategory[]);
    }
    setIsLoadingProducts(false);
  };

  const handleProductClick = (product: StoreProductWithCategory) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleQuickBuy = (product: StoreProductWithCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleSelectRelatedProduct = (product: StoreProductWithCategory) => {
    setSelectedProduct(product);
  };

  if (categoriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
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
              Explore produtos e serviços digitais que impulsionam sua operação.
            </p>
          </div>
        </div>
        <CartButton showLabel className="gap-2" />
      </div>

      {/* Categories */}
      {categories.length === 0 ? (
        <div className="p-8 rounded-xl bg-card border border-border text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Nenhuma categoria disponível ainda.
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Assim que categorias forem criadas, elas aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const isExpanded = expandedCategory === category.id;
            
            return (
              <div key={category.id} className="w-full">
                {/* Category Button */}
                <button
                  onClick={() => handleCategoryClick(category)}
                  className={`w-full group p-5 rounded-xl bg-card border border-border
                             hover:bg-accent/50 hover:shadow-lg
                             transition-all duration-200 ease-out text-left
                             ${isExpanded ? 'bg-accent/50 shadow-md rounded-b-none border-b-0' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{category.icon || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                    )}
                  </div>
                </button>

                {/* Expanded Products Panel */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-4 bg-card/80 border border-border border-t-0 rounded-b-xl">
                    {isLoadingProducts ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-4">
                        <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          Nenhum produto disponível nesta categoria.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {products.map((product) => {
                          const isOutOfStock = !product.stock || product.stock.trim() === '';
                          const stockLines = product.stock?.split('\n').filter(line => line.trim()) || [];
                          const availableStock = product.product_type === 'lines' ? stockLines.length : (product.stock ? 1 : 0);
                          
                          return (
                            <div
                              key={product.id}
                              className={`p-4 rounded-lg bg-background border border-border 
                                         hover:bg-accent/30 transition-colors cursor-pointer ${isOutOfStock ? 'opacity-70' : ''}`}
                              onClick={() => handleProductClick(product)}
                            >
                              <div className="flex items-start gap-3">
                                {/* Product Image */}
                                {product.image_url && (
                                  <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted/30">
                                    <img
                                      src={product.image_url}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm text-foreground">
                                    {product.name}
                                  </h4>
                                  {product.short_description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {product.short_description}
                                    </p>
                                  )}
                                  {/* Stock indicator */}
                                  <p className="text-xs mt-1.5">
                                    {isOutOfStock ? (
                                      <span className="text-muted-foreground">Sem estoque</span>
                                    ) : (
                                      <span className="text-primary font-medium">
                                        {availableStock} em estoque
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  <span className="font-bold text-sm text-primary">
                                    {product.price}
                                  </span>
                                  {isOutOfStock ? (
                                    <span className="px-3 py-1.5 text-xs font-medium rounded-md bg-muted text-muted-foreground">
                                      Esgotado
                                    </span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={(e) => handleQuickBuy(product, e)}
                                      className="gap-1.5 h-7 text-xs"
                                    >
                                      <ShoppingCart className="h-3 w-3" />
                                      Comprar
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
        relatedProducts={products}
        onSelectProduct={handleSelectRelatedProduct}
      />
    </div>
  );
}
