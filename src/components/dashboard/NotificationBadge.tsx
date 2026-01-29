import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <span
      className={cn(
        "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center",
        "bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full",
        "animate-in zoom-in-50 duration-200",
        className
      )}
    >
      {displayCount}
    </span>
  );
}
