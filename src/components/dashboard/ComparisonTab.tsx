import { useState, useMemo } from 'react';
import { subYears, startOfMonth, endOfMonth } from 'date-fns';
import { useOperations } from '@/hooks/useOperations';
import { useExpenses } from '@/hooks/useExpenses';
import { useMonthlyComparison } from '@/hooks/useMonthlyComparison';
import { MonthlyComparisonChart } from './MonthlyComparisonChart';
import { TrendLineChart } from './TrendLineChart';
import { MonthlyStatsTable } from './MonthlyStatsTable';
import { StatsCard } from './StatsCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Calendar, Trophy, BarChart3 } from 'lucide-react';

export function ComparisonTab() {
  const [monthsCount, setMonthsCount] = useState(120);

  // Always fetch full history (10 years) independent of Dashboard date filter
  const fullRange = useMemo(() => ({
    start: startOfMonth(subYears(new Date(), 10)),
    end: endOfMonth(new Date()),
  }), []);

  const { operations } = useOperations(fullRange);
  const { expenses } = useExpenses(fullRange);

  const { monthlyData, summary } = useMonthlyComparison(operations, expenses, monthsCount);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Comparativo de Períodos</h2>
        <Select value={String(monthsCount)} onValueChange={(v) => setMonthsCount(Number(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Últimos 3 meses</SelectItem>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Últimos 12 meses</SelectItem>
            <SelectItem value="24">Últimos 24 meses</SelectItem>
            <SelectItem value="120">Total (10 anos)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Média Mensal"
          value={formatCurrency(summary.avgProfit)}
          icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
          trend={summary.avgProfit >= 0 ? 'up' : 'down'}
        />
        <StatsCard
          title="Total Acumulado"
          value={formatCurrency(summary.totalProfit)}
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          trend={summary.totalProfit >= 0 ? 'up' : 'down'}
        />
        <StatsCard
          title="Melhor Mês"
          value={summary.bestMonth ? formatCurrency(summary.bestMonth.netBalance) : '-'}
          subtitle={summary.bestMonth?.displayMonth}
          icon={<Trophy className="h-5 w-5 text-warning" />}
        />
        <StatsCard
          title="Meses Analisados"
          value={String(monthlyData.length)}
          icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyComparisonChart data={monthlyData} />
        <TrendLineChart data={monthlyData} trend={summary.trend} />
      </div>

      <MonthlyStatsTable data={monthlyData} />
    </div>
  );
}
