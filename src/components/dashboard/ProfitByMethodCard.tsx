import { Operation, OperationMethod } from '@/hooks/useOperations';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

interface ProfitByMethodCardProps {
  operations: Operation[];
  methods: OperationMethod[];
}

export function ProfitByMethodCard({ operations, methods }: ProfitByMethodCardProps) {
  const profitByMethod = methods.map(method => {
    const methodOperations = operations.filter(op => op.method_id === method.id);
    const totalInvested = methodOperations.reduce((sum, op) => sum + Number(op.invested_amount), 0);
    const totalReturn = methodOperations.reduce((sum, op) => sum + Number(op.return_amount), 0);
    const profit = totalReturn - totalInvested;
    
    return {
      method,
      profit,
      count: methodOperations.length,
    };
  }).filter(item => item.count > 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3 md:p-5 premium-shadow gradient-border animate-slide-up-fade animation-delay-300">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <div className="p-1.5 rounded-lg bg-success/10">
          <TrendingUp className="h-4 w-4 text-success" />
        </div>
        <h3 className="text-xs md:text-sm font-medium text-muted-foreground">Lucro por Método</h3>
      </div>
      
      {profitByMethod.length === 0 ? (
        <p className="text-xs md:text-sm text-muted-foreground">Nenhuma operação no período</p>
      ) : (
        <div className="space-y-2.5 md:space-y-3">
          {profitByMethod.map(({ method, profit, count }) => (
            <div 
              key={method.id} 
              className="group flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200"
            >
              <div className="flex items-center gap-2 md:gap-2.5 min-w-0 flex-1">
                <div 
                  className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-card transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: method.color, boxShadow: `0 0 10px ${method.color}50` }}
                />
                <span className="text-xs md:text-sm font-medium text-foreground truncate">{method.name}</span>
                <span className="text-xs text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              </div>
              <span className={cn(
                "text-xs md:text-sm font-semibold shrink-0 px-2 py-1 rounded-md",
                profit >= 0 ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
              )}>
                {formatCurrency(profit)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
