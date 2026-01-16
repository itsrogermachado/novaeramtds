import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { startOfMonth, endOfMonth, startOfWeek, format } from 'date-fns';
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
import { ProfitEvolutionChart } from '@/components/dashboard/ProfitEvolutionChart';
import { ExpensesByCategoryChart } from '@/components/dashboard/ExpensesByCategoryChart';
import { UpcomingExpensesCard } from '@/components/dashboard/UpcomingExpensesCard';
import { GoalsCard } from '@/components/dashboard/GoalsCard';
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

  const { operations, methods, isLoading: opsLoading, createOperation, updateOperation, deleteOperation, createMethod, deleteMethod } = useOperations(dateRange);
  const { expenses, upcomingExpenses, categories, isLoading: expLoading, createExpense, updateExpense, deleteExpense } = useExpenses(dateRange);
  const { goals, createGoal, updateGoal, deleteGoal } = useGoals();
  const { users, isLoading: usersLoading } = useAllUsers();

  // All data for global view (showAll = true for admin)
  const { operations: allOperations } = useOperations(dateRange, undefined, true);
  const { expenses: allExpenses } = useExpenses(dateRange, undefined, true);

  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
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
    
    const todayInvested = todayOps.reduce((sum, op) => sum + Number(op.invested_amount), 0);
    const todayReturn = todayOps.reduce((sum, op) => sum + Number(op.return_amount), 0);
    const todayProfit = todayReturn - todayInvested;

    return {
      todayProfit,
      todayOperations: todayOps.length,
    };
  }, [operations]);

  // Calculate weekly profit
  const weeklyProfit = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const todayStr = format(today, 'yyyy-MM-dd');
    
    const weekOps = operations.filter(op => 
      op.operation_date >= weekStartStr && op.operation_date <= todayStr
    );
    
    const invested = weekOps.reduce((sum, op) => sum + Number(op.invested_amount), 0);
    const returned = weekOps.reduce((sum, op) => sum + Number(op.return_amount), 0);
    
    return returned - invested;
  }, [operations]);

  // Detect if viewing a single day (e.g., "Hoje")
  const isSingleDayView = useMemo(() => {
    const startDate = format(dateRange.start, 'yyyy-MM-dd');
    const endDate = format(dateRange.end, 'yyyy-MM-dd');
    return startDate === endDate;
  }, [dateRange]);

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/30 via-background to-background pointer-events-none" />
      
      <div className="relative">
        <DashboardHeader
          onOpenNewOperation={() => { setEditingOperation(null); setOperationDialogOpen(true); }}
        />

        <main className="p-4 md:p-6 space-y-4 md:space-y-6">
          <DateFilter dateRange={dateRange} onDateRangeChange={setDateRange} />

          <Tabs defaultValue="my-operations" className="space-y-4 md:space-y-6">
            <TabsList className="w-full md:w-auto overflow-x-auto flex-nowrap justify-start">
              <TabsTrigger value="my-operations" className="text-xs md:text-sm whitespace-nowrap">Operações</TabsTrigger>
              <TabsTrigger value="my-expenses" className="text-xs md:text-sm whitespace-nowrap">Gastos</TabsTrigger>
              <TabsTrigger value="comparison" className="text-xs md:text-sm whitespace-nowrap">Comparativo</TabsTrigger>
              {isAdmin && <TabsTrigger value="individual" className="text-xs md:text-sm whitespace-nowrap">Individuais</TabsTrigger>}
              {isAdmin && <TabsTrigger value="global" className="text-xs md:text-sm whitespace-nowrap">Global</TabsTrigger>}
            </TabsList>

            <TabsContent value="my-operations" className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
                <StatsCard 
                  title="Operações" 
                  value={String(operations.length)} 
                  icon={<Receipt className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />} 
                  className="animation-delay-100"
                />
                <StatsCard 
                  title="Investido" 
                  value={formatCurrency(totalInvested)} 
                  icon={<Wallet className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />} 
                  className="animation-delay-200"
                />
                <StatsCard 
                  title="Lucro" 
                  value={formatCurrency(profit)} 
                  trend={profit >= 0 ? 'up' : 'down'} 
                  icon={<TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-success" />} 
                  className="animation-delay-300"
                />
                <StatsCard 
                  title="Gastos" 
                  value={formatCurrency(totalExpenses)} 
                  icon={<TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-destructive" />} 
                  className="animation-delay-400"
                />
                <StatsCard 
                  title="Balanço" 
                  value={formatCurrency(netBalance)} 
                  trend={netBalance >= 0 ? 'up' : 'down'} 
                  icon={<Scale className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />} 
                  className="col-span-2 md:col-span-1 animation-delay-500"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="lg:col-span-3 space-y-4 md:space-y-6">
                  {!isSingleDayView && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <ProfitEvolutionChart operations={operations} />
                      <ExpensesByCategoryChart expenses={expenses} />
                    </div>
                  )}
                  <OperationsTable
                    operations={operations}
                    isLoading={opsLoading}
                    onAdd={() => { setEditingOperation(null); setOperationDialogOpen(true); }}
                    onEdit={(op) => { setEditingOperation(op); setOperationDialogOpen(true); }}
                    onDelete={handleDeleteOperation}
                  />
                </div>
                <div className="space-y-3 md:space-y-4">
                  <GoalsCard
                    goals={goals}
                    todayProfit={todayStats.todayProfit}
                    weeklyProfit={weeklyProfit}
                    netBalance={netBalance}
                    onCreate={createGoal}
                    onUpdate={updateGoal}
                    onDelete={deleteGoal}
                  />
                  <ProfitByMethodCard operations={operations} methods={methods} />
                  <UpcomingExpensesCard expenses={upcomingExpenses} />
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
                  allOperations={allOperations}
                  isLoading={usersLoading}
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
      </div>

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
        onDeleteMethod={deleteMethod}
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
    </div>
  );
}
