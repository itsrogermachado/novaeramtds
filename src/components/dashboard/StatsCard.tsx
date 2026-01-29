import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon, trend, className }: StatsCardProps) {
  // Format large numbers to be more readable on mobile
  const formatValue = (val: string) => {
    // If it's a currency, try to make it more compact
    if (val.includes('R$')) {
      const num = parseFloat(val.replace(/[^\d,-]/g, '').replace(',', '.'));
      if (Math.abs(num) >= 10000) {
        const formatted = (num / 1000).toFixed(1).replace('.', ',');
        return `R$ ${formatted}k`;
      }
    }
    return val;
  };

  const displayValue = formatValue(value);
  const isLongValue = value.length > 12;

  return (
    <div className={cn(
      "group relative bg-card border border-border rounded-xl p-3 sm:p-4 md:p-5 transition-all duration-300",
      "hover-3d premium-shadow gradient-border",
      "animate-slide-up-fade",
      className
    )}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-transparent to-muted/30 pointer-events-none" />
      
      <div className="relative flex items-start justify-between gap-2">
        <div className="space-y-1 sm:space-y-1.5 md:space-y-2 min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className={cn(
            "font-semibold truncate transition-all duration-300",
            isLongValue ? "text-sm sm:text-base md:text-2xl" : "text-base sm:text-lg md:text-2xl",
            trend === 'up' && "text-success",
            trend === 'down' && "text-destructive",
            !trend && "text-foreground"
          )}>
            <span className="md:hidden">{displayValue}</span>
            <span className="hidden md:inline">{value}</span>
          </p>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "relative p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl shrink-0 transition-all duration-300",
            "bg-gradient-to-br from-muted to-muted/50",
            "group-hover:scale-110",
            trend === 'up' && "icon-glow"
          )}>
            <div className="animate-float">
              {icon}
            </div>
          </div>
        )}
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
