import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Operation } from '@/hooks/useOperations';
import { parseDateOnly } from '@/lib/dateOnly';

interface ProfitEvolutionChartProps {
  operations: Operation[];
}

export function ProfitEvolutionChart({ operations }: ProfitEvolutionChartProps) {
  const chartData = useMemo(() => {
    const sortedOps = [...operations].sort(
      (a, b) => a.operation_date.localeCompare(b.operation_date)
    );

    const dailyData: Record<string, { profit: number; date: string }> = {};

    sortedOps.forEach(op => {
      const date = op.operation_date;
      const profit = Number(op.return_amount) - Number(op.invested_amount);
      
      if (!dailyData[date]) {
        dailyData[date] = { profit: 0, date };
      }
      dailyData[date].profit += profit;
    });

    let cumulative = 0;
    return Object.values(dailyData).map(item => {
      cumulative += item.profit;
      return {
        date: item.date,
        displayDate: format(parseDateOnly(item.date), 'dd/MM', { locale: ptBR }),
        profit: item.profit,
        cumulative,
      };
    });
  }, [operations]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (chartData.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 shadow-elegant">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Evolução do Lucro</h3>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          Nenhuma operação no período
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-elegant">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Evolução do Lucro</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="displayDate" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Lucro Acumulado']}
              labelFormatter={(label) => `Data: ${label}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'hsl(var(--success))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
