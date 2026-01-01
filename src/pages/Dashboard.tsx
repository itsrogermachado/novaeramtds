import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useOperations } from '@/hooks/useOperations';
import { useExpenses } from '@/hooks/useExpenses';
import { useGoals } from '@/hooks/useGoals';
import { useAllUsers } from '@/hooks/useAllUsers';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ProfitByMethodCard } from '@/components/dashboard/ProfitByMethodCard';
import { OperationsTable } from '@/components/dashboard/OperationsTable';
import { ExpensesTable } from '@/components/dashboard/ExpensesTable';
import { OperationDialog } from '@/components/dashboard/OperationDialog';
import { ExpenseDialog } from '@/components/dashboard/ExpenseDialog';
import { GoalsDialog } from '@/components/dashboard/GoalsDialog';
import { DailyStatsCard } from '@/components/dashboard/DailyStatsCard';
import { ProfitEvolutionChart } from '@/components/dashboard/ProfitEvolutionChart';
import { ExpensesByCategoryChart } from '@/components/dashboard/ExpensesByCategoryChart';
import { AdminIndividualTab } from '@/components/dashboard/AdminIndividualTab';
import { AdminGlobalTab } from '@/components/dashboard/AdminGlobalTab';
import { ComparisonTab } from '@/components/dashboard/ComparisonTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Wallet, Receipt, Scale } from 'lucide-react';
import { Operation } from '@/hooks/useOperations';
import { Expense } from '@/hooks/useExpenses';

export default function Dashboard() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { operations, methods, isLoading: opsLoading, createOperation, updateOperation, deleteOperation, createMethod } = useOperations(dateRange);
  const { expenses, categories, isLoading: expLoading, createExpense, updateExpense, deleteExpense } = useExpenses(dateRange);
  const { goals, createGoal, updateGoal, deleteGoal } = useGoals();
  const { users, isLoading: usersLoading } = useAllUsers();

  // Admin data for selected user
  const { operations: adminOperations, methods: adminMethods, isLoading: adminOpsLoading } = useOperations(dateRange, selectedUserId || undefined);
  const { expenses: adminExpenses, isLoading: adminExpLoading } = useExpenses(dateRange, selectedUserId || undefined);

  // All data for global view (no user filter)
  const { operations: allOperations } = useOperations(dateRange, undefined);
  const { expenses: allExpenses } = useExpenses(dateRange, undefined);

  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [goalsDialogOpen, setGoalsDialogOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Calculate stats
  const totalInvested = operations.reduce((sum, op) => sum + Number(op.invested_amount), 0);
  const totalReturn = operations.reduce((sum, op) => sum + Number(op.return_amount), 0);
  const profit = totalReturn - totalInvested;
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const netBalance = profit - totalExpenses;

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayOps = operations.filter(op => op.operation_date === today);
    const todayExps = expenses.filter(exp => exp.expense_date === today);
    
    const todayInvested = todayOps.reduce((sum, op) => sum + Number(op.invested_amount), 0);
    const todayReturn = todayOps.reduce((sum, op) => sum + Number(op.return_amount), 0);
    const todayProfit = todayReturn - todayInvested;
    const todayExpenses = todayExps.reduce((sum, exp) => sum + Number(exp.amount), 0);

    // Calculate monthly average
    const daysInPeriod = Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)));
    const monthlyAvgProfit = profit / daysInPeriod;

    return {
      todayProfit,
      todayOperations: todayOps.length,
      todayExpenses,
      monthlyAvgProfit,
    };
  }, [operations, expenses, profit, dateRange]);

  const dailyGoals = goals.filter(g => g.goal_type === 'daily');

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleDeleteOperation = async (id: string) => {
    const { error } = await deleteOperation(id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else toast({ title: 'Operação excluída' });
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await deleteExpense(id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else toast({ title: 'Gasto excluído' });
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p>Carregando...</p></div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        onOpenGoals={() => setGoalsDialogOpen(true)}
        onOpenNewOperation={() => { setEditingOperation(null); setOperationDialogOpen(true); }}
      />

      <main className="p-6 space-y-6">
        <DateFilter dateRange={dateRange} onDateRangeChange={setDateRange} />

        <Tabs defaultValue="my-operations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-operations">Minhas Operações</TabsTrigger>
            <TabsTrigger value="my-expenses">Meus Gastos</TabsTrigger>
            <TabsTrigger value="comparison">Comparativo</TabsTrigger>
            {isAdmin && <TabsTrigger value="individual">Usuários Individuais</TabsTrigger>}
            {isAdmin && <TabsTrigger value="global">Visão Global</TabsTrigger>}
          </TabsList>

          <TabsContent value="my-operations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatsCard title="Operações" value={String(operations.length)} icon={<Receipt className="h-5 w-5 text-muted-foreground" />} />
              <StatsCard title="Total Investido" value={formatCurrency(totalInvested)} icon={<Wallet className="h-5 w-5 text-muted-foreground" />} />
              <StatsCard title="Meu Lucro" value={formatCurrency(profit)} trend={profit >= 0 ? 'up' : 'down'} icon={<TrendingUp className="h-5 w-5 text-success" />} />
              <StatsCard title="Total Gastos" value={formatCurrency(totalExpenses)} icon={<TrendingDown className="h-5 w-5 text-destructive" />} />
              <StatsCard title="Lucro Operações" value={formatCurrency(profit)} trend={profit >= 0 ? 'up' : 'down'} />
              <StatsCard title="Balanço Líquido" value={formatCurrency(netBalance)} trend={netBalance >= 0 ? 'up' : 'down'} icon={<Scale className="h-5 w-5 text-muted-foreground" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ProfitEvolutionChart operations={operations} />
                  <ExpensesByCategoryChart expenses={expenses} />
                </div>
                <OperationsTable
                  operations={operations}
                  isLoading={opsLoading}
                  onAdd={() => { setEditingOperation(null); setOperationDialogOpen(true); }}
                  onEdit={(op) => { setEditingOperation(op); setOperationDialogOpen(true); }}
                  onDelete={handleDeleteOperation}
                />
              </div>
              <div className="space-y-4">
                <DailyStatsCard
                  todayProfit={todayStats.todayProfit}
                  todayOperations={todayStats.todayOperations}
                  todayExpenses={todayStats.todayExpenses}
                  monthlyAvgProfit={todayStats.monthlyAvgProfit}
                  dailyGoals={dailyGoals}
                />
                <ProfitByMethodCard operations={operations} methods={methods} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="my-expenses" className="space-y-6">
            <ExpensesTable
              expenses={expenses}
              isLoading={expLoading}
              onAdd={() => { setEditingExpense(null); setExpenseDialogOpen(true); }}
              onEdit={(exp) => { setEditingExpense(exp); setExpenseDialogOpen(true); }}
              onDelete={handleDeleteExpense}
            />
          </TabsContent>

          <TabsContent value="comparison">
            <ComparisonTab operations={operations} expenses={expenses} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="individual">
              <AdminIndividualTab
                users={users}
                selectedUserId={selectedUserId}
                onSelectUser={setSelectedUserId}
                operations={selectedUserId ? adminOperations : []}
                expenses={selectedUserId ? adminExpenses : []}
                methods={adminMethods}
                isLoading={adminOpsLoading || adminExpLoading || usersLoading}
              />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="global">
              <AdminGlobalTab
                operations={allOperations}
                expenses={allExpenses}
                users={users}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <OperationDialog
        open={operationDialogOpen}
        onOpenChange={setOperationDialogOpen}
        operation={editingOperation}
        methods={methods}
        onSubmit={async (data) => {
          if (editingOperation) return updateOperation(editingOperation.id, data);
          return createOperation(data);
        }}
        onCreateMethod={createMethod}
      />

      <ExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        expense={editingExpense}
        categories={categories}
        onSubmit={async (data) => {
          if (editingExpense) return updateExpense(editingExpense.id, data);
          return createExpense(data);
        }}
      />

      <GoalsDialog
        open={goalsDialogOpen}
        onOpenChange={setGoalsDialogOpen}
        goals={goals}
        netBalance={netBalance}
        todayProfit={todayStats.todayProfit}
        onCreate={createGoal}
        onUpdate={updateGoal}
        onDelete={deleteGoal}
      />
    </div>
  );
}
