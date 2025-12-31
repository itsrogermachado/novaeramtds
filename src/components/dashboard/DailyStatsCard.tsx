import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { Goal } from '@/hooks/useGoals';

interface DailyStatsCardProps {
  todayProfit: number;
  todayOperations: number;
  todayExpenses: number;
  monthlyAvgProfit: number;
  dailyGoals: Goal[];
}

export function DailyStatsCard({
  todayProfit,
  todayOperations,
  todayExpenses,
  monthlyAvgProfit,
  dailyGoals,
}: DailyStatsCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const comparisonPercent = monthlyAvgProfit !== 0 
    ? ((todayProfit - monthlyAvgProfit) / Math.abs(monthlyAvgProfit)) * 100 
    : 0;

  const activeDailyGoal = dailyGoals[0];
  const goalProgress = activeDailyGoal 
    ? Math.min((todayProfit / Number(activeDailyGoal.target_amount)) * 100, 100)
    : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-elegant">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-medium text-muted-foreground">Resumo de Hoje</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Lucro Hoje</span>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-semibold ${todayProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(todayProfit)}
            </span>
            {todayProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Operações</span>
          <span className="text-sm font-medium text-foreground">{todayOperations}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Gastos</span>
          <span className="text-sm font-medium text-destructive">
            -{formatCurrency(todayExpenses)}
          </span>
        </div>

        {monthlyAvgProfit !== 0 && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">vs. Média Diária</span>
              <span className={`text-xs font-medium ${comparisonPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                {comparisonPercent >= 0 ? '+' : ''}{comparisonPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {activeDailyGoal && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Meta Diária</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{activeDailyGoal.title}</span>
                <span className="font-medium text-foreground">{goalProgress.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
