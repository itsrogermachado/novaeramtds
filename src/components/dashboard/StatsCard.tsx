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
  return (
    <div className={cn(
      "bg-card border border-border rounded-lg p-3 md:p-5 shadow-elegant transition-shadow hover:shadow-elegant-md",
      className
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 md:space-y-1 min-w-0 flex-1">
          <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className={cn(
            "text-base md:text-2xl font-semibold truncate",
            trend === 'up' && "text-success",
            trend === 'down' && "text-destructive",
            !trend && "text-foreground"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-1.5 md:p-2 bg-muted rounded-lg shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
