import { Operation, OperationMethod } from '@/hooks/useOperations';

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
    <div className="bg-card border border-border rounded-lg p-5 shadow-elegant">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Lucro por Método</h3>
      
      {profitByMethod.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma operação no período</p>
      ) : (
        <div className="space-y-3">
          {profitByMethod.map(({ method, profit, count }) => (
            <div key={method.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: method.color }}
                />
                <span className="text-sm font-medium text-foreground">{method.name}</span>
                <span className="text-xs text-muted-foreground">({count})</span>
              </div>
              <span className={`text-sm font-semibold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(profit)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
