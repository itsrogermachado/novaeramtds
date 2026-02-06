import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import logoNovaEra from '@/assets/logo-nova-era-transparent.png';

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
];

const adminNavItems = [
  { id: 'store-categories', label: 'Categorias', icon: Package },
  { id: 'store-products', label: 'Produtos', icon: ShoppingBag },
  { id: 'store-coupons', label: 'Cupons', icon: Ticket },
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
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => {
    const isActive = currentTab === item.id;
    const Icon = item.icon;
    const showBadge = item.hasBadge && newTutorialsCount > 0;

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => onTabChange(item.id)}
          className={cn(
            "w-full justify-start gap-3 h-11 px-3 rounded-lg transition-all duration-200",
            "hover:bg-primary/10 hover:text-primary",
            isActive && "bg-primary/20 text-primary font-medium border-l-2 border-primary"
          )}
        >
          <Icon className={cn(
            "h-5 w-5 shrink-0",
            isActive ? "text-primary" : "text-muted-foreground"
          )} />
          {!isCollapsed && (
            <span className="flex-1 text-left">{item.label}</span>
          )}
          {!isCollapsed && showBadge && (
            <NotificationBadge count={newTutorialsCount} />
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar 
      className={cn(
        "border-r border-border/50 bg-card/50 backdrop-blur-xl",
        isCollapsed ? "w-16" : "w-60"
      )}
      collapsible="icon"
    >
      {/* Header with Logo */}
      <SidebarHeader className="p-4 border-b border-border/30">
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}>
          <img 
            src={logoNovaEra} 
            alt="Nova Era" 
            className={cn(
              "object-contain",
              isCollapsed ? "h-8 w-8" : "h-10"
            )}
          />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm text-primary">Nova Era</span>
              <span className="text-xs text-muted-foreground">Dashboard</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs text-muted-foreground/70 uppercase tracking-wider px-3 mb-2">
              Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation */}
        {isAdmin && (
          <SidebarGroup className="mt-6">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-xs text-muted-foreground/70 uppercase tracking-wider px-3 mb-2">
                Administração
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {adminNavItems.map((item) => (
                  <NavItem key={item.id} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3 border-t border-border/30 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn(
            "w-full justify-center text-muted-foreground hover:text-foreground",
            !isCollapsed && "justify-start gap-2"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Recolher</span>
            </>
          )}
        </Button>
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
      </SidebarFooter>
    </Sidebar>
  );
}
