import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroBannerProps {
  onExplore: () => void;
}

export function HeroBanner({ onExplore }: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-gold/5 py-16 sm:py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      
      <div className="container relative mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-gold animate-pulse" />
            <span className="text-sm font-medium">Produtos digitais exclusivos</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight">
            Transforme seu{' '}
            <span className="bg-gradient-to-r from-primary via-gold to-primary bg-clip-text text-transparent">
              conhecimento
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Cursos, e-books, mentorias e ferramentas para acelerar seus resultados. 
            Conteúdo exclusivo criado por especialistas.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="btn-premium gap-2 text-lg px-8"
              onClick={onExplore}
            >
              Explorar produtos
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
