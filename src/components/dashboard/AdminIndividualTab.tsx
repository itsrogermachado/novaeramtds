import { UserSelector } from './UserSelector';
import { StatsCard } from './StatsCard';
import { OperationsTable } from './OperationsTable';
import { ExpensesTable } from './ExpensesTable';
import { ProfitByMethodCard } from './ProfitByMethodCard';
import { UserProfile } from '@/hooks/useAllUsers';
import { Operation, OperationMethod } from '@/hooks/useOperations';
import { Expense } from '@/hooks/useExpenses';
import { Receipt, Wallet, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminIndividualTabProps {
  users: UserProfile[];
  selectedUserId: string | null;
  onSelectUser: (userId: string | null) => void;
  operations: Operation[];
  expenses: Expense[];
  methods: OperationMethod[];
  isLoading: boolean;
}

export function AdminIndividualTab({
  users,
  selectedUserId,
  onSelectUser,
  operations,
  expenses,
  methods,
  isLoading,
}: AdminIndividualTabProps) {
  const totalInvested = operations.reduce((sum, op) => sum + Number(op.invested_amount), 0);
  const totalReturn = operations.reduce((sum, op) => sum + Number(op.return_amount), 0);
  const profit = totalReturn - totalInvested;
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const netBalance = profit - totalExpenses;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <UserSelector
          users={users}
          selectedUserId={selectedUserId}
          onSelectUser={onSelectUser}
          isLoading={isLoading}
        />
        {selectedUser && (
          <span className="text-sm text-muted-foreground">
            Visualizando: <strong className="text-foreground">{selectedUser.full_name}</strong>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Operações"
          value={String(operations.length)}
          icon={<Receipt className="h-5 w-5 text-muted-foreground" />}
        />
        <StatsCard
          title="Total Investido"
          value={formatCurrency(totalInvested)}
          icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
        />
        <StatsCard
          title="Lucro"
          value={formatCurrency(profit)}
          trend={profit >= 0 ? 'up' : 'down'}
          icon={<TrendingUp className="h-5 w-5 text-success" />}
        />
        <StatsCard
          title="Total Gastos"
          value={formatCurrency(totalExpenses)}
          icon={<TrendingDown className="h-5 w-5 text-destructive" />}
        />
        <StatsCard
          title="Balanço Líquido"
          value={formatCurrency(netBalance)}
          trend={netBalance >= 0 ? 'up' : 'down'}
          icon={<Scale className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Tabs defaultValue="operations" className="space-y-4">
            <TabsList>
              <TabsTrigger value="operations">Operações</TabsTrigger>
              <TabsTrigger value="expenses">Gastos</TabsTrigger>
            </TabsList>
            <TabsContent value="operations">
              <OperationsTable
                operations={operations}
                isLoading={isLoading}
                onAdd={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </TabsContent>
            <TabsContent value="expenses">
              <ExpensesTable
                expenses={expenses}
                isLoading={isLoading}
                onAdd={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div>
          <ProfitByMethodCard operations={operations} methods={methods} />
        </div>
      </div>
    </div>
  );
}
