import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStoreProducts, StoreProductWithCategory } from '@/hooks/useStoreProducts';
import { StoreCategory as StoreCategoryType } from '@/hooks/useStoreCategories';
import { ArrowLeft, Package, ShoppingCart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductDetailModal } from '@/components/store/ProductDetailModal';
import { CartButton } from '@/components/store/CartButton';
import { useCart } from '@/contexts/CartContext';
import logo from '@/assets/logo-nova-era-3d.png';

export default function StoreCategory() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<StoreCategoryType | null>(null);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<StoreProductWithCategory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { addItem } = useCart();

  // Fetch category by slug
  useEffect(() => {
    async function fetchCategory() {
      if (!slug) return;
      setIsLoadingCategory(true);
      
      const { data, error } = await supabase
        .from('store_categories')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();
      
      if (error) {
        console.error('Error fetching category:', error);
        setCategory(null);
      } else {
        setCategory(data as StoreCategoryType);
      }
      setIsLoadingCategory(false);
    }
    
    fetchCategory();
  }, [slug]);

  const { products, isLoading: isLoadingProducts } = useStoreProducts(category?.id, true);

  const handleProductClick = (product: StoreProductWithCategory) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleQuickAdd = (product: StoreProductWithCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.cta_url) {
      window.open(product.cta_url, '_blank', 'noopener,noreferrer');
    } else {
      addItem(product, 1);
    }
  };

  const handleSelectRelatedProduct = (product: StoreProductWithCategory) => {
    setSelectedProduct(product);
  };

  if (isLoadingCategory) {
    return (
      <div className="min-h-screen flex items-center justify-center auth-bg">
        <div className="auth-spotlight" />
        <div className="auth-ambient" />
        <div className="auth-noise" />
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center auth-bg p-4">
        <div className="auth-spotlight" />
        <div className="auth-ambient" />
        <div className="auth-noise" />
        <div className="relative z-10 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h1 className="text-xl font-bold mb-2" style={{ color: 'hsl(220 25% 20%)' }}>
            Categoria não encontrada
          </h1>
          <p className="text-muted-foreground mb-6">
            A categoria que você procura não existe ou foi desativada.
          </p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para a Loja Nova Era
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen auth-bg p-4 sm:p-6">
      <div className="auth-spotlight" />
      <div className="auth-ambient" />
      <div className="auth-noise" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to="/">
            <img src={logo} alt="Nova Era" className="h-12 w-auto" />
          </Link>
          <CartButton variant="outline" size="icon" />
        </div>

        {/* Back Link */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a Loja Nova Era
        </Link>

        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{category.icon || '📦'}</span>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(220 25% 15%)' }}>
              {category.name}
            </h1>
          </div>
          {category.description && (
            <p className="text-muted-foreground max-w-2xl">
              {category.description}
            </p>
          )}
        </div>

        {/* Products */}
        {isLoadingProducts ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 rounded-xl bg-white/40 backdrop-blur-sm border border-white/60 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Ainda não há produtos nesta categoria.
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Volte em breve ou explore outra categoria.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const isOutOfStock = !product.stock || product.stock.trim() === '';
              
              return (
                <div
                  key={product.id}
                  className={`p-5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/70 
                             hover:bg-white/80 hover:shadow-lg transition-all duration-200 cursor-pointer
                             ${isOutOfStock ? 'opacity-70' : ''}`}
                  onClick={() => handleProductClick(product)}
                >
                  {/* Product Image */}
                  {product.image_url && (
                    <div className="w-full h-32 rounded-lg overflow-hidden bg-muted/30 mb-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold mb-2" style={{ color: 'hsl(220 25% 15%)' }}>
                    {product.name}
                  </h3>
                  {product.short_description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.short_description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="font-bold text-lg" style={{ color: 'hsl(220 25% 20%)' }}>
                      R$ {product.price}
                    </span>
                    {isOutOfStock ? (
                      <span className="px-3 py-1.5 text-xs font-medium rounded-md bg-muted text-muted-foreground">
                        Esgotado
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={(e) => handleQuickAdd(product, e)}
                        className="gap-2"
                      >
                        {product.cta_url ? (
                          <>
                            <ExternalLink className="h-4 w-4" />
                            Comprar
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4" />
                            Adicionar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={showModal}
        onOpenChange={setShowModal}
        relatedProducts={products}
        onSelectProduct={handleSelectRelatedProduct}
      />
    </div>
  );
}
