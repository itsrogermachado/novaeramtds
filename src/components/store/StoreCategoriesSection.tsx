import { Link } from 'react-router-dom';
import { useStoreCategories } from '@/hooks/useStoreCategories';
import { Package, ArrowRight, Store } from 'lucide-react';

interface StoreCategoriesSectionProps {
  hideHeader?: boolean;
}

export function StoreCategoriesSection({ hideHeader = false }: StoreCategoriesSectionProps) {
  const { categories, isLoading } = useStoreCategories(true); // Only active

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
      
      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/loja/${category.slug}`}
            className="group p-5 rounded-xl bg-white/50 backdrop-blur-sm border border-white/60 
                       hover:bg-white/70 hover:shadow-lg hover:-translate-y-0.5
                       transition-all duration-200 ease-out"
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
              <ArrowRight 
                className="h-4 w-4 text-muted-foreground group-hover:text-primary 
                           group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" 
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}