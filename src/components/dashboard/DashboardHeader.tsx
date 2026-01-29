import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { MembershipBadge } from './MembershipBadge';
import { LogOut, Plus, Sparkles, ExternalLink, Shield } from 'lucide-react';
import logo from '@/assets/logo-nova-era-elegant.jpg';

interface DashboardHeaderProps {
  onOpenNewOperation: () => void;
}

export function DashboardHeader({
  onOpenNewOperation
}: DashboardHeaderProps) {
  const {
    signOut,
    membershipTier
  } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  
  return (
    <header className="relative header-gradient border-b border-border px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative flex flex-col gap-2.5 sm:gap-3 md:flex-row md:items-center md:justify-between">
        {/* Logo and title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4">
            {/* Logo with glow effect */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 to-gold/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img src={logo} alt="Nova Era" className="relative h-8 sm:h-9 md:h-12 w-auto object-contain rounded-lg shadow-elegant" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-lg md:text-xl font-display font-semibold text-foreground">
                  Nova Era
                </h1>
                <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-gold animate-pulse-glow" />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                Painel Administrativo
              </p>
              <div className="hidden md:block">
                <MembershipBadge tier={membershipTier} size="sm" />
              </div>
            </div>
          </div>

          {/* Mobile-only controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:hidden">
            <MembershipBadge tier={membershipTier} size="sm" />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Actions row - reorganized for mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 md:gap-3">
          {/* Primary action - full width on mobile */}
          <Button 
            size="sm" 
            onClick={onOpenNewOperation} 
            className="w-full sm:w-auto gap-2 btn-premium text-primary-foreground h-9 sm:h-8"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Operação</span>
          </Button>

          {/* Secondary actions - side by side on mobile */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild className="flex-1 sm:flex-none gap-1.5 sm:gap-2 h-8 text-xs sm:text-sm px-2.5 sm:px-3">
              <a href="https://novaeramtdsloja.lovable.app/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="truncate">Loja</span>
              </a>
            </Button>

            <Button size="sm" variant="outline" asChild className="flex-1 sm:flex-none gap-1.5 sm:gap-2 h-8 text-xs sm:text-sm px-2.5 sm:px-3">
              <a href="https://check.proxynovaera.shop/" target="_blank" rel="noopener noreferrer">
                <Shield className="h-3.5 w-3.5" />
                <span className="truncate">Proxy</span>
              </a>
            </Button>

            {/* Desktop-only controls */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative bottom line */}
      <div className="absolute bottom-0 left-0 right-0 decorative-line" />
    </header>
  );
}