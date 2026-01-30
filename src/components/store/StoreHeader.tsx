import { Link } from 'react-router-dom';
import { User, LogIn, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo-nova-era-elegant.jpg';

export function StoreHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 to-gold/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img 
                src={logo} 
                alt="Nova Era" 
                className="relative h-10 w-auto rounded-lg shadow-sm" 
              />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-semibold text-lg">Nova Era</span>
                <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
              </div>
              <span className="text-xs text-muted-foreground">Loja Digital</span>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            
            {user ? (
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link to="/dashboard">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Minha Conta</span>
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="btn-premium gap-2">
                <Link to="/auth">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
