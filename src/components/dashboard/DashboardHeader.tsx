import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Target, Plus } from 'lucide-react';
import logo from '@/assets/logo-nova-era-elegant.jpg';

interface DashboardHeaderProps {
  onOpenGoals: () => void;
  onOpenNewOperation: () => void;
}

export function DashboardHeader({ onOpenGoals, onOpenNewOperation }: DashboardHeaderProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src={logo} 
            alt="Nova Era" 
            className="h-12 w-auto object-contain"
          />
          <div>
            <h1 className="text-xl font-display font-semibold text-foreground">
              Painel Administrativo
            </h1>
            <p className="text-sm text-muted-foreground">Nova Era</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenGoals}
            className="gap-2"
          >
            <Target className="h-4 w-4" />
            Minhas Metas
          </Button>
          
          <Button
            size="sm"
            onClick={onOpenNewOperation}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Operação
          </Button>

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
    </header>
  );
}
