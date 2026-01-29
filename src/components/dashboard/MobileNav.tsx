import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from './ThemeToggle';
import { MembershipBadge } from './MembershipBadge';
import {
  Menu,
  X,
  TrendingUp,
  Receipt,
  Scale,
  Video,
  Calculator,
  MessageSquare,
  Users,
  Globe,
  Lock,
  ChevronRight,
  ExternalLink,
  Shield,
  LogOut,
} from 'lucide-react';
import logo from '@/assets/logo-nova-era-elegant.jpg';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  locked?: boolean;
  adminOnly?: boolean;
}

interface MobileNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
  hasNewMethods?: boolean;
}

export function MobileNav({ currentTab, onTabChange, onSignOut, hasNewMethods }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { isAdmin, isVip, membershipTier } = useAuth();

  const navItems: NavItem[] = [
    { id: 'my-operations', label: 'Minhas Operações', icon: <TrendingUp className="h-5 w-5" /> },
    { id: 'my-expenses', label: 'Meus Gastos', icon: <Receipt className="h-5 w-5" /> },
    { id: 'comparison', label: 'Comparativo', icon: <Scale className="h-5 w-5" /> },
    { id: 'tutorials', label: 'Tutoriais', icon: <Video className="h-5 w-5" />, locked: !isVip && !isAdmin },
    { id: 'methods', label: 'Métodos', icon: <MessageSquare className="h-5 w-5" />, locked: !isVip && !isAdmin },
    { id: 'dutching', label: 'Calculadora Dutching', icon: <Calculator className="h-5 w-5" /> },
    { id: 'individual', label: 'Usuários Individuais', icon: <Users className="h-5 w-5" />, adminOnly: true },
    { id: 'global', label: 'Visão Global', icon: <Globe className="h-5 w-5" />, adminOnly: true },
  ];

  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Nova Era" className="h-10 w-auto rounded-lg" />
                <div>
                  <SheetTitle className="text-left text-lg">Nova Era</SheetTitle>
                  <MembershipBadge tier={membershipTier} size="sm" />
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {filteredItems.map((item) => (
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
                    {item.id === 'methods' && hasNewMethods && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-destructive rounded-full animate-pulse" />
                    )}
                  </span>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.locked && (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    currentTab === item.id ? "text-primary-foreground" : "text-muted-foreground"
                  )} />
                </button>
              ))}
            </nav>

            {/* External Links */}
            <div className="px-3 mt-6">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Links Externos
              </p>
              <a
                href="https://novaeramtdsloja.lovable.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all hover:bg-muted"
              >
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 font-medium">Nossa Loja</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
              <a
                href="https://check.proxynovaera.shop/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all hover:bg-muted"
              >
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 font-medium">Verificar Proxy</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-3">
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
