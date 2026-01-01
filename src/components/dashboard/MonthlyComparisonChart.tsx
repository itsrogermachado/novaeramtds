import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { MonthlyData } from '@/hooks/useMonthlyComparison';

interface MonthlyComparisonChartProps {
  data: MonthlyData[];
}

export function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      lucro: d.profit,
      gastos: d.totalExpenses,
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 shadow-elegant">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Lucro vs Gastos por Mês</h3>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado no período</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-elegant">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Lucro vs Gastos por Mês</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="displayMonth" 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'lucro' ? 'Lucro' : 'Gastos'
              ]}
              labelFormatter={(label) => `Mês: ${label}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend 
              formatter={(value) => value === 'lucro' ? 'Lucro' : 'Gastos'}
            />
            <Bar dataKey="lucro" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
