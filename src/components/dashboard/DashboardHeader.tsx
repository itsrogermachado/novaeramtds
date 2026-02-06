import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Plus, Sparkles, ExternalLink, Shield, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo-nova-era-elegant.jpg';

interface DashboardHeaderProps {
  onOpenNewOperation: () => void;
  mobileNav?: React.ReactNode;
}

export function DashboardHeader({
  onOpenNewOperation,
  mobileNav,
}: DashboardHeaderProps) {
  const { signOut, isAdmin, session, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleBackupExport = async () => {
    if (!session?.access_token) {
      toast({ title: 'Erro', description: 'Você precisa estar logado', variant: 'destructive' });
      return;
    }

    setIsExporting(true);
    try {
      const response = await supabase.functions.invoke('backup-export', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao exportar');
      }

      // Create download
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-novaera-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ 
        title: 'Backup exportado!', 
        description: `${response.data.counts?.profiles || 0} usuários, ${response.data.counts?.operations || 0} operações exportadas.` 
      });
    } catch (error) {
      console.error('Backup error:', error);
      toast({ 
        title: 'Erro ao exportar', 
        description: error instanceof Error ? error.message : 'Tente novamente', 
        variant: 'destructive' 
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <header className="relative header-gradient border-b border-border px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative flex flex-col gap-2.5 sm:gap-3 md:flex-row md:items-center md:justify-between">
        {/* Logo and title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4">
            {/* Mobile nav trigger */}
            {mobileNav}
            
            {/* Logo with glow effect */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 to-gold/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img src={logo} alt="Nova Era" className="relative h-8 sm:h-9 md:h-12 w-auto object-contain rounded-lg shadow-elegant" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-lg md:text-xl font-display font-semibold text-foreground">
                  Nova Era
                </h1>
                <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-gold animate-pulse-glow" />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                Painel Administrativo
              </p>
            </div>
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
              <a href="https://check.proxynovaera.shop/" target="_blank" rel="noopener noreferrer">
                <Shield className="h-3.5 w-3.5" />
                <span className="truncate">Consulte sua proxy</span>
              </a>
            </Button>

            {/* Admin backup button */}
            {isAdmin && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleBackupExport}
                disabled={isExporting}
                className="gap-1.5 h-8 text-xs sm:text-sm px-2.5 sm:px-3"
              >
                {isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span className="truncate">Backup</span>
              </Button>
            )}

            {/* Desktop-only controls */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              
              {/* Profile Avatar */}
              <button
                onClick={() => navigate('/profile')}
                className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full transition-transform hover:scale-105"
                title="Meu Perfil"
              >
                <Avatar className="h-8 w-8 border-2 border-border hover:border-primary transition-colors">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </button>

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