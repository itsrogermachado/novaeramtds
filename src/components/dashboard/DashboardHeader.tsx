import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LogOut, Plus } from 'lucide-react';
import logo from '@/assets/logo-nova-era-elegant.jpg';

interface DashboardHeaderProps {
  onOpenNewOperation: () => void;
}

export function DashboardHeader({ onOpenNewOperation }: DashboardHeaderProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Logo and title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <img 
              src={logo} 
              alt="Nova Era" 
              className="h-8 md:h-12 w-auto object-contain"
            />
            <div>
              <h1 className="text-lg md:text-xl font-display font-semibold text-foreground">
                Nova Era
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Painel Administrativo
              </p>
            </div>
          </div>

          {/* Mobile-only controls */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            size="sm"
            onClick={onOpenNewOperation}
            className="flex-1 md:flex-none gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="md:inline">Nova Operação</span>
          </Button>

          {/* Desktop-only controls */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
