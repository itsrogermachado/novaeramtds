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
  return <header className="relative header-gradient border-b border-border px-4 md:px-6 py-3 md:py-4 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Logo and title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Logo with glow effect */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 to-gold/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img src={logo} alt="Nova Era" className="relative h-9 md:h-12 w-auto object-contain rounded-lg shadow-elegant" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-display font-semibold text-foreground">
                  Nova Era
                </h1>
                <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse-glow" />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Painel Administrativo
              </p>
              <div className="hidden md:block">
                <MembershipBadge tier={membershipTier} size="sm" />
              </div>
            </div>
          </div>

          {/* Mobile-only controls */}
          <div className="flex items-center gap-2 md:hidden">
            <MembershipBadge tier={membershipTier} size="sm" />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <Button size="sm" onClick={onOpenNewOperation} className="flex-1 md:flex-none gap-2 btn-premium text-primary-foreground">
            <Plus className="h-4 w-4" />
            <span className="md:inline">Nova Operação</span>
          </Button>

          <Button size="sm" variant="outline" asChild className="flex-1 md:flex-none gap-2">
            <a href="https://novaeramtdsloja.lovable.app/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span>Nossa Loja</span>
            </a>
          </Button>

          <Button size="sm" variant="outline" asChild className="flex-1 md:flex-none gap-2">
            <a href="https://check.proxynovaera.shop/" target="_blank" rel="noopener noreferrer">
              <Shield className="h-4 w-4" />
              <span>Verificar proxy</span>
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

      {/* Decorative bottom line */}
      <div className="absolute bottom-0 left-0 right-0 decorative-line" />
    </header>;
}