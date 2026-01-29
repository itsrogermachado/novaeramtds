import { Crown, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UpgradePromptProps {
  feature?: string;
  variant?: 'card' | 'inline' | 'overlay';
}

export function UpgradePrompt({ feature = 'Este recurso', variant = 'card' }: UpgradePromptProps) {
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>{feature} é exclusivo para membros VIP.</span>
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
        <div className="text-center p-6 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <Crown className="h-6 w-6 text-gold" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Conteúdo VIP</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {feature} é exclusivo para membros VIP. Faça upgrade para desbloquear.
          </p>
          <Button className="gap-2 btn-premium">
            <Crown className="h-4 w-4" />
            Fazer Upgrade
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-dashed border-2 border-muted-foreground/20">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
          <Crown className="h-8 w-8 text-gold" />
        </div>
        <h3 className="font-semibold text-xl mb-2">Recurso Exclusivo VIP</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {feature} é exclusivo para membros VIP. Faça upgrade para desbloquear todas as funcionalidades avançadas.
        </p>
        <Button size="lg" className="gap-2 btn-premium">
          <Crown className="h-5 w-5" />
          Fazer Upgrade para VIP
        </Button>
      </CardContent>
    </Card>
  );
}
