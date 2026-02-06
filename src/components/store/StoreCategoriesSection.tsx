import { useState } from 'react';
import { useStoreCategories, StoreCategory } from '@/hooks/useStoreCategories';
import { Package, ChevronDown, ChevronUp, ShoppingCart, ExternalLink, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StoreProductWithCategory } from '@/hooks/useStoreProducts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface StoreCategoriesSectionProps {
  hideHeader?: boolean;
}

export function StoreCategoriesSection({ hideHeader = false }: StoreCategoriesSectionProps) {
  const { categories, isLoading } = useStoreCategories(true); // Only active
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<StoreProductWithCategory[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StoreProductWithCategory | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  const handleBuy = (product: StoreProductWithCategory) => {
    if (product.cta_url) {
      window.open(product.cta_url, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedProduct(product);
      setShowModal(true);
    }
  };

  if (isLoading) {
    return (
      <section className="w-full animate-auth-field opacity-0" style={{ animationDelay: '0.6s' }}>
        {!hideHeader && (
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold" style={{ color: 'hsl(220 25% 20%)' }}>
              Loja Nova Era
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Carregando categorias...
            </p>
          </div>
        )}
        {hideHeader && (
          <p className="text-sm text-muted-foreground text-center">
            Carregando categorias...
          </p>
        )}
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="w-full animate-auth-field opacity-0" style={{ animationDelay: '0.6s' }}>
        {!hideHeader && (
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Store className="h-5 w-5" style={{ color: 'hsl(220 25% 30%)' }} />
              <h2 className="text-lg font-bold" style={{ color: 'hsl(220 25% 20%)' }}>
                Loja Nova Era
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Explore produtos e serviços digitais para sua operação.
            </p>
          </div>
        )}
        
        <div className="p-6 rounded-xl bg-white/40 backdrop-blur-sm border border-white/60 text-center">
          <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Nenhuma categoria disponível ainda.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Assim que categorias forem criadas, elas aparecerão aqui.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full animate-auth-field opacity-0" style={{ animationDelay: '0.6s' }}>
      {!hideHeader && (
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Store className="h-5 w-5" style={{ color: 'hsl(220 25% 30%)' }} />
            <h2 className="text-lg font-bold" style={{ color: 'hsl(220 25% 20%)' }}>
              Loja Nova Era
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Explore produtos e serviços digitais que impulsionam sua operação.
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        {categories.map((category) => {
          const isExpanded = expandedCategory === category.id;
          
          return (
            <div key={category.id} className="w-full">
              {/* Category Button */}
              <button
                onClick={() => handleCategoryClick(category)}
                className={`w-full group p-5 rounded-xl bg-white/50 backdrop-blur-sm border border-white/60 
                           hover:bg-white/70 hover:shadow-lg
                           transition-all duration-200 ease-out text-left
                           ${isExpanded ? 'bg-white/70 shadow-md rounded-b-none border-b-0' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{category.icon || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="font-semibold text-sm group-hover:text-primary transition-colors"
                      style={{ color: 'hsl(220 25% 20%)' }}
                    >
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
                  isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-4 bg-white/60 backdrop-blur-sm border border-white/60 border-t-0 rounded-b-xl">
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
                        
                        return (
                          <div
                            key={product.id}
                            className={`p-4 rounded-lg bg-white/70 border border-white/80 
                                       hover:bg-white/90 transition-colors ${isOutOfStock ? 'opacity-70' : ''}`}
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
                                <h4 className="font-medium text-sm" style={{ color: 'hsl(220 25% 15%)' }}>
                                  {product.name}
                                </h4>
                                {product.short_description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {product.short_description}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className="font-bold text-sm" style={{ color: 'hsl(220 25% 20%)' }}>
                                  {product.price}
                                </span>
                                {isOutOfStock ? (
                                  <span className="px-3 py-1.5 text-xs font-medium rounded-md bg-muted text-muted-foreground">
                                    Esgotado
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleBuy(product)}
                                    className="gap-1.5 h-7 text-xs"
                                  >
                                    {product.cta_url ? (
                                      <>
                                        <ExternalLink className="h-3 w-3" />
                                        Comprar
                                      </>
                                    ) : (
                                      <>
                                        <ShoppingCart className="h-3 w-3" />
                                        Comprar
                                      </>
                                    )}
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

      {/* Placeholder Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comprar: {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              A integração de pagamento será configurada aqui futuramente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Entre em contato conosco para finalizar sua compra.
            </p>
          </div>
          <Button onClick={() => setShowModal(false)} className="w-full">
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
