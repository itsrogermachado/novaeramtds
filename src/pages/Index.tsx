import { useState, useRef } from 'react';
import { Package } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { StoreHeader } from '@/components/store/StoreHeader';
import { HeroBanner } from '@/components/store/HeroBanner';
import { CategoryFilter } from '@/components/store/CategoryFilter';
import { ProductCard } from '@/components/store/ProductCard';
import { ProductCheckoutDialog } from '@/components/store/ProductCheckoutDialog';
import { useProducts, useProductCategories, DigitalProduct } from '@/hooks/useProducts';

export default function Index() {
  const productsRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<DigitalProduct | null>(null);

  const { data: categories = [] } = useProductCategories();
  const { data: products = [], isLoading } = useProducts(selectedCategory);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBuy = (product: DigitalProduct) => {
    setCheckoutProduct(product);
  };

  return (
    <>
      <Helmet>
        <title>Nova Era - Loja Digital</title>
        <meta name="description" content="Cursos, e-books, mentorias e ferramentas digitais exclusivos. Transforme seu conhecimento com a Nova Era." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <StoreHeader />
        
        {/* Hero Banner */}
        <HeroBanner onExplore={scrollToProducts} />

        {/* Products Section */}
        <section ref={productsRef} className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            {/* Section header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
                Nossos Produtos
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore nossa seleção de produtos digitais exclusivos
              </p>
            </div>

            {/* Category filter */}
            <div className="mb-8">
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>

            {/* Products grid */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground">
                  {selectedCategory
                    ? 'Não há produtos nesta categoria ainda.'
                    : 'Novos produtos em breve!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onBuy={handleBuy}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Nova Era. Todos os direitos reservados.
            </p>
          </div>
        </footer>

        {/* Checkout dialog */}
        <ProductCheckoutDialog
          open={!!checkoutProduct}
          onOpenChange={(open) => !open && setCheckoutProduct(null)}
          product={checkoutProduct}
        />
      </div>
    </>
  );
}
