import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBadge } from './NotificationBadge';
import {
  Menu,
  TrendingUp,
  Receipt,
  Scale,
  Video,
  Calculator,
  Users,
  Globe,
  ChevronRight,
  LayoutDashboard,
  Shield,
  LogOut,
  UserCircle,
  Package,
  ShoppingBag,
  Ticket,
  DollarSign,
} from 'lucide-react';
import logo from '@/assets/logo-nova-era-elegant.jpg';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

interface MobileNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
  newTutorialsCount?: number;
}

export function MobileNav({ currentTab, onTabChange, onSignOut, newTutorialsCount = 0 }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
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

  const memberItems: NavItem[] = [
    { id: 'overview', label: 'Visão Geral', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'my-operations', label: 'Minhas Operações', icon: <TrendingUp className="h-5 w-5" /> },
    { id: 'cooperation', label: 'Cooperação', icon: <Users className="h-5 w-5" /> },
    { id: 'my-expenses', label: 'Meus Gastos', icon: <Receipt className="h-5 w-5" /> },
    { id: 'comparison', label: 'Comparativo', icon: <Scale className="h-5 w-5" /> },
    { id: 'tutorials', label: 'Tutoriais', icon: <Video className="h-5 w-5" /> },
    { id: 'surebet', label: 'Calculadora Surebet', icon: <Calculator className="h-5 w-5" /> },
    { id: 'team', label: 'Meu Time', icon: <Users className="h-5 w-5" /> },
    { id: 'store', label: 'Loja', icon: <ShoppingBag className="h-5 w-5" /> },
    { id: 'my-orders', label: 'Meus Pedidos', icon: <Package className="h-5 w-5" /> },
  ];

  const adminItems: NavItem[] = [
    { id: 'store-categories', label: 'Categorias da Loja', icon: <Package className="h-5 w-5" />, adminOnly: true },
    { id: 'store-products', label: 'Produtos da Loja', icon: <ShoppingBag className="h-5 w-5" />, adminOnly: true },
    { id: 'store-coupons', label: 'Cupons de Desconto', icon: <Ticket className="h-5 w-5" />, adminOnly: true },
    { id: 'store-sales', label: 'Histórico de Vendas', icon: <DollarSign className="h-5 w-5" />, adminOnly: true },
    { id: 'individual', label: 'Usuários Individuais', icon: <Users className="h-5 w-5" />, adminOnly: true },
    { id: 'global', label: 'Visão Global', icon: <Globe className="h-5 w-5" />, adminOnly: true },
  ];

  const handleSelect = (id: string) => {
    onTabChange(id);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0 border-r-0">
        <div className="flex flex-col h-full bg-card">
          {/* Header */}
          <SheetHeader className="p-4 pb-2 border-b border-border">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Nova Era" className="h-10 w-auto rounded-lg" />
              <SheetTitle className="text-left text-lg">Nova Era</SheetTitle>
            </div>
          </SheetHeader>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            {/* Member Section */}
            <nav className="px-3 space-y-1">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Área do Membro
              </p>
              {memberItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200",
                    "active:scale-[0.98]",
                    currentTab === item.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <span className={cn(
                    "shrink-0 relative",
                    currentTab === item.id ? "text-primary-foreground" : "text-muted-foreground"
                  )}>
                    {item.icon}
                    {item.id === 'tutorials' && <NotificationBadge count={newTutorialsCount} />}
                  </span>
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    currentTab === item.id ? "text-primary-foreground" : "text-muted-foreground"
                  )} />
                </button>
              ))}
            </nav>

            {/* Admin Section - Only for admins */}
            {isAdmin && (
              <nav className="px-3 mt-6 space-y-1">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Administração
                </p>
                {adminItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200",
                      "active:scale-[0.98]",
                      currentTab === item.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <span className={cn(
                      "shrink-0",
                      currentTab === item.id ? "text-primary-foreground" : "text-muted-foreground"
                    )}>
                      {item.icon}
                    </span>
                    <span className="flex-1 font-medium">{item.label}</span>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      currentTab === item.id ? "text-primary-foreground" : "text-muted-foreground"
                    )} />
                  </button>
                ))}
              </nav>
            )}

            {/* External Links */}
            <div className="px-3 mt-6">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Links Externos
              </p>
              <a
                href="https://check.proxynovaera.shop/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all hover:bg-muted"
              >
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 font-medium">Consulte sua proxy</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-3">
            {/* Profile link */}
            <button
              onClick={() => {
                setOpen(false);
                navigate('/profile');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">{profile?.full_name || 'Meu Perfil'}</p>
                <p className="text-xs text-muted-foreground">Editar perfil</p>
              </div>
              <UserCircle className="h-5 w-5 text-muted-foreground" />
            </button>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tema</span>
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              className="w-full gap-2 h-11"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
