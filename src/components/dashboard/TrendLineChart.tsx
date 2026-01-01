import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { MonthlyData } from '@/hooks/useMonthlyComparison';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendLineChartProps {
  data: MonthlyData[];
  trend: 'up' | 'down' | 'stable';
}

export function TrendLineChart({ data, trend }: TrendLineChartProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const chartData = useMemo(() => {
    if (data.length < 2) return data;

    // Calculate simple moving average for trend line
    return data.map((d, i) => {
      const windowSize = Math.min(3, i + 1);
      const window = data.slice(Math.max(0, i - windowSize + 1), i + 1);
      const avg = window.reduce((s, m) => s + m.netBalance, 0) / window.length;
      
      return {
        ...d,
        tendencia: Math.round(avg),
      };
    });
  }, [data]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
  const trendLabel = trend === 'up' ? 'Tendência de alta' : trend === 'down' ? 'Tendência de queda' : 'Tendência estável';

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 shadow-elegant">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Evolução do Balanço</h3>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado no período</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-elegant">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Evolução do Balanço</h3>
        <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="h-4 w-4" />
          <span>{trendLabel}</span>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
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
                name === 'netBalance' ? 'Balanço' : 'Tendência'
              ]}
              labelFormatter={(label) => `Mês: ${label}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="netBalance"
              stroke="hsl(var(--primary))"
              fill="url(#balanceGradient)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="tendencia"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
