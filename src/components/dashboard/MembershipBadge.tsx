import { Badge } from '@/components/ui/badge';
import { Crown, User } from 'lucide-react';
import { MembershipTier } from '@/contexts/AuthContext';

interface MembershipBadgeProps {
  tier: MembershipTier;
  size?: 'sm' | 'md';
}

export function MembershipBadge({ tier, size = 'md' }: MembershipBadgeProps) {
  const isVip = tier === 'vip';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  if (isVip) {
    return (
      <Badge 
        variant="outline" 
        className={`${textSize} gap-1 bg-gradient-to-r from-gold/20 to-gold/10 border-gold/50 text-gold`}
      >
        <Crown className={iconSize} />
        Membro VIP
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`${textSize} gap-1 bg-muted/50 border-muted-foreground/30 text-muted-foreground`}
    >
      <User className={iconSize} />
      Membro Free
    </Badge>
  );
}
