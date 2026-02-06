import { useMemo } from 'react';
import { StatsCard } from './StatsCard';
import { ProfitEvolutionChart } from './ProfitEvolutionChart';
import { useOperations } from '@/hooks/useOperations';
import { useExpenses } from '@/hooks/useExpenses';
import { useAllUsers } from '@/hooks/useAllUsers';
import { Receipt, Wallet, TrendingUp, Users, Trophy } from 'lucide-react';

interface AdminGlobalTabProps {
  dateRange: { start: Date; end: Date };
}

export function AdminGlobalTab({ dateRange }: AdminGlobalTabProps) {
  // Fetch data internally
  const { operations, isLoading: opsLoading } = useOperations(dateRange, undefined, true);
  const { effectiveExpenses, isLoading: expLoading } = useExpenses(dateRange, undefined, true);
  const { users, isLoading: usersLoading } = useAllUsers();
  
  const isLoading = opsLoading || expLoading || usersLoading;

  const stats = useMemo(() => {
    const totalInvested = operations.reduce((sum, op) => sum + Number(op.invested_amount), 0);
    const totalReturn = operations.reduce((sum, op) => sum + Number(op.return_amount), 0);
    const profit = totalReturn - totalInvested;
    return { totalInvested, totalReturn, profit };
  }, [operations, effectiveExpenses]);

  const userRankings = useMemo(() => {
    const userProfits: Record<string, { userId: string; name: string; profit: number }> = {};

    operations.forEach(op => {
      const userId = op.user_id;
      if (!userProfits[userId]) {
        const user = users.find(u => u.id === userId);
        userProfits[userId] = {
          userId,
          name: user?.full_name || 'Usuário desconhecido',
          profit: 0,
        };
      }
      userProfits[userId].profit += Number(op.return_amount) - Number(op.invested_amount);
    });

    return Object.values(userProfits).sort((a, b) => b.profit - a.profit).slice(0, 5);
  }, [operations, users]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Usuários"
          value={String(users.length)}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
        />
        <StatsCard
          title="Total Operações"
          value={String(operations.length)}
          icon={<Receipt className="h-5 w-5 text-muted-foreground" />}
        />
        <StatsCard
          title="Total Investido"
          value={formatCurrency(stats.totalInvested)}
          icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
        />
        <StatsCard
          title="Lucro Total"
          value={formatCurrency(stats.profit)}
          trend={stats.profit >= 0 ? 'up' : 'down'}
          icon={<TrendingUp className="h-5 w-5 text-success" />}
        />
      </div>

      <ProfitEvolutionChart operations={operations} />

      <div className="bg-card border border-border rounded-lg p-5 shadow-elegant">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-warning" />
          <h3 className="text-sm font-medium text-muted-foreground">Ranking de Usuários</h3>
        </div>
        {userRankings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma operação no período</p>
        ) : (
          <div className="space-y-3">
            {userRankings.map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    index === 0 ? 'bg-warning text-warning-foreground' :
                    index === 1 ? 'bg-muted text-muted-foreground' :
                    index === 2 ? 'bg-orange-200 text-orange-800' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">{user.name}</span>
                </div>
                <span className={`text-sm font-semibold ${user.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(user.profit)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
