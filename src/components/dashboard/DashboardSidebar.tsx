import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationBadge } from './NotificationBadge';
import { 
  Receipt, 
  Wallet, 
  BarChart3, 
  Video, 
  Calculator, 
  Users, 
  Package, 
  ShoppingBag,
  Ticket,
  User,
  Globe,
  LogOut,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import { useState } from 'react';

interface DashboardSidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
  newTutorialsCount: number;
}

const mainNavItems = [
  { id: 'my-operations', label: 'Operações', icon: Receipt },
  { id: 'my-expenses', label: 'Gastos', icon: Wallet },
  { id: 'comparison', label: 'Comparativo', icon: BarChart3 },
  { id: 'tutorials', label: 'Tutoriais', icon: Video, hasBadge: true },
  { id: 'surebet', label: 'Surebet', icon: Calculator },
  { id: 'team', label: 'Meu Time', icon: Users },
  { id: 'store', label: 'Loja', icon: ShoppingBag },
  { id: 'my-orders', label: 'Meus Pedidos', icon: Package },
];

const adminNavItems = [
  { id: 'store-categories', label: 'Categorias', icon: Package },
  { id: 'store-products', label: 'Produtos', icon: ShoppingBag },
  { id: 'store-coupons', label: 'Cupons', icon: Ticket },
  { id: 'store-sales', label: 'Vendas', icon: DollarSign },
  { id: 'individual', label: 'Individuais', icon: User },
  { id: 'global', label: 'Global', icon: Globe },
];

export function DashboardSidebar({ 
  currentTab, 
  onTabChange, 
  onSignOut,
  newTutorialsCount 
}: DashboardSidebarProps) {
  const { isAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => {
    const isActive = currentTab === item.id;
    const Icon = item.icon;
    const showBadge = item.hasBadge && newTutorialsCount > 0;

    return (
      <button
        onClick={() => onTabChange(item.id)}
        className={cn(
          "w-full flex items-center gap-3 h-11 px-3 rounded-lg transition-all duration-200",
          "hover:bg-primary/10 hover:text-primary",
          isActive && "bg-primary/20 text-primary font-medium border-l-2 border-primary",
          isCollapsed && "justify-center px-2"
        )}
      >
        <Icon className={cn(
          "h-5 w-5 shrink-0",
          isActive ? "text-primary" : "text-muted-foreground"
        )} />
        {!isCollapsed && (
          <span className="flex-1 text-left text-sm">{item.label}</span>
        )}
        {!isCollapsed && showBadge && (
          <NotificationBadge count={newTutorialsCount} />
        )}
      </button>
    );
  };

  return (
    <aside 
      className={cn(
        "h-full border-r border-border/50 bg-card/50 backdrop-blur-xl flex flex-col relative transition-all duration-300",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Floating Collapse Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "absolute -right-3 top-[200px] z-50 h-6 w-6 rounded-full",
          "bg-background border border-border shadow-md",
          "hover:bg-muted text-muted-foreground hover:text-foreground",
          "transition-all duration-200"
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      <ScrollArea className="flex-1 px-2 pt-4 pb-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="text-xs text-muted-foreground/70 uppercase tracking-wider px-3 mb-2">
              Principal
            </p>
          )}
          {mainNavItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <div className="mt-6 space-y-1">
            {!isCollapsed && (
              <p className="text-xs text-muted-foreground/70 uppercase tracking-wider px-3 mb-2">
                Administração
              </p>
            )}
            {adminNavItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer - Only Sign Out */}
      <div className="p-3 border-t border-border/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className={cn(
            "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            isCollapsed ? "justify-center" : "justify-start gap-2"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
