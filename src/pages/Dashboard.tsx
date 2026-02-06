import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { startOfMonth, endOfMonth, startOfWeek, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useOperations, Operation } from '@/hooks/useOperations';
import { useExpenses, Expense } from '@/hooks/useExpenses';
import { useGoals } from '@/hooks/useGoals';
import { useAllUsers } from '@/hooks/useAllUsers';
import { useNewTutorialsNotification } from '@/hooks/useNewTutorialsNotification';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { MobileNav } from '@/components/dashboard/MobileNav';
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
import { ComparisonTab } from '@/components/dashboard/ComparisonTab';
import { AiAssistant } from '@/components/dashboard/AiAssistant';

// Lazy load heavy/less-used tabs
const AdminIndividualTab = lazy(() => import('@/components/dashboard/AdminIndividualTab').then(m => ({ default: m.AdminIndividualTab })));
const AdminGlobalTab = lazy(() => import('@/components/dashboard/AdminGlobalTab').then(m => ({ default: m.AdminGlobalTab })));
const TutorialsTab = lazy(() => import('@/components/dashboard/TutorialsTab').then(m => ({ default: m.TutorialsTab })));
const SurebetCalculator = lazy(() => import('@/components/dashboard/SurebetCalculator').then(m => ({ default: m.SurebetCalculator })));
const TeamTab = lazy(() => import('@/components/dashboard/TeamTab').then(m => ({ default: m.TeamTab })));
const StoreTab = lazy(() => import('@/components/dashboard/StoreTab').then(m => ({ default: m.StoreTab })));
const StoreCategoriesTab = lazy(() => import('@/components/dashboard/StoreCategoriesTab').then(m => ({ default: m.StoreCategoriesTab })));
const StoreProductsTab = lazy(() => import('@/components/dashboard/StoreProductsTab').then(m => ({ default: m.StoreProductsTab })));
const StoreCouponsTab = lazy(() => import('@/components/dashboard/StoreCouponsTab').then(m => ({ default: m.StoreCouponsTab })));
const StoreSalesTab = lazy(() => import('@/components/dashboard/StoreSalesTab').then(m => ({ default: m.StoreSalesTab })));

import { TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react';

// Tab loading fallback
const TabLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function Dashboard() {
  const { user, isLoading: authLoading, isAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentTab, setCurrentTab] = useState('my-operations');
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  const { operations, methods, isLoading: opsLoading, createOperation, updateOperation, deleteOperation, createMethod, deleteMethod } = useOperations(dateRange);
  const { expenses, effectiveExpenses, upcomingExpenses, categories, isLoading: expLoading, createExpense, updateExpense, deleteExpense } = useExpenses(dateRange);
  const { goals, createGoal, updateGoal, deleteGoal } = useGoals();
  
  
  const { newTutorialsCount, markAsViewed: markTutorialsAsViewed } = useNewTutorialsNotification();


  // Mark tutorials as viewed when tab changes to tutorials
  useEffect(() => {
    if (currentTab === 'tutorials') {
      markTutorialsAsViewed();
    }
  }, [currentTab, markTutorialsAsViewed]);

  // Admin global data - only fetch when needed (tabs fetch internally)

  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Calculate stats - use effectiveExpenses for calculations (only expenses with date <= today)
  const totalInvested = operations.reduce((sum, op) => sum + Number(op.invested_amount), 0);
  const totalReturn = operations.reduce((sum, op) => sum + Number(op.return_amount), 0);
  const profit = totalReturn - totalInvested;
  const totalExpenses = effectiveExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
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

  // Calculate top methods for AI context
  const topMethods = useMemo(() => {
    const profitByMethod: Record<string, { name: string; profit: number }> = {};
    
    operations.forEach(op => {
      const method = methods.find(m => m.id === op.method_id);
      if (method) {
        if (!profitByMethod[method.id]) {
          profitByMethod[method.id] = { name: method.name, profit: 0 };
        }
        profitByMethod[method.id].profit += Number(op.return_amount) - Number(op.invested_amount);
      }
    });
    
    return Object.values(profitByMethod)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 3)
      .map(m => m.name);
  }, [operations, methods]);

  // AI Assistant context
  const aiContext = useMemo(() => ({
    totalProfit: profit,
    totalExpenses,
    netBalance,
    operationsCount: operations.length,
    todayProfit: todayStats.todayProfit,
    weeklyProfit,
    topMethods,
  }), [profit, totalExpenses, netBalance, operations.length, todayStats.todayProfit, weeklyProfit, topMethods]);

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
    <div className="min-h-screen flex flex-col w-full bg-background">
        {/* Subtle background pattern */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/30 via-background to-background pointer-events-none" />
        
        {/* Unified Header - spans full width */}
        <div className="relative z-20">
          <DashboardHeader
            onOpenNewOperation={() => { setEditingOperation(null); setOperationDialogOpen(true); }}
            mobileNav={
              <MobileNav
                currentTab={currentTab}
                onTabChange={setCurrentTab}
                onSignOut={handleSignOut}
                newTutorialsCount={newTutorialsCount}
              />
            }
          />
        </div>

        {/* Main content area with sidebar */}
        <div className="flex flex-1 relative overflow-hidden">
          {/* Desktop Sidebar - hidden on mobile */}
          <div className="hidden md:flex h-[calc(100vh-65px)] relative z-10">
            <DashboardSidebar
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              onSignOut={handleSignOut}
              newTutorialsCount={newTutorialsCount}
            />
          </div>
          
          <div className="flex-1 relative flex flex-col min-w-0 overflow-hidden">

          <main className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 overflow-auto">
            <DateFilter dateRange={dateRange} onDateRangeChange={setDateRange}>
              <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                <AiAssistant context={aiContext} embedded />
              </div>
            </DateFilter>

            {/* Mobile section title */}
            <div className="md:hidden flex items-center gap-2 px-1">
              <span className="text-sm font-medium text-foreground">
                {currentTab === 'my-operations' && 'Minhas Operações'}
                {currentTab === 'my-expenses' && 'Meus Gastos'}
                {currentTab === 'comparison' && 'Comparativo'}
                {currentTab === 'tutorials' && 'Tutoriais'}
                {currentTab === 'surebet' && 'Calculadora Surebet'}
                {currentTab === 'team' && 'Meu Time'}
                {currentTab === 'store' && 'Loja'}
                {currentTab === 'store-categories' && 'Categorias da Loja'}
                {currentTab === 'store-products' && 'Produtos da Loja'}
                {currentTab === 'store-coupons' && 'Cupons de Desconto'}
                {currentTab === 'individual' && 'Usuários Individuais'}
                {currentTab === 'global' && 'Visão Global'}
              </span>
            </div>

            {/* Content based on current tab */}
            {currentTab === 'my-operations' && (
              <div className="space-y-4 md:space-y-6 animate-fade-in">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
                  <div className="lg:col-span-3 space-y-4 md:space-y-6">
                    {!isSingleDayView && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <ProfitEvolutionChart operations={operations} />
                        <ExpensesByCategoryChart expenses={effectiveExpenses} />
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
              </div>
            )}

            {currentTab === 'my-expenses' && (
              <div className="space-y-6 animate-fade-in">
                <ExpensesTable
                  expenses={expenses}
                  isLoading={expLoading}
                  onAdd={() => { setEditingExpense(null); setExpenseDialogOpen(true); }}
                  onEdit={(exp) => { setEditingExpense(exp); setExpenseDialogOpen(true); }}
                  onDelete={handleDeleteExpense}
                />
              </div>
            )}

            {currentTab === 'comparison' && (
              <div className="animate-fade-in">
                <ComparisonTab operations={operations} expenses={effectiveExpenses} />
              </div>
            )}

            {currentTab === 'tutorials' && (
              <Suspense fallback={<TabLoader />}>
                <div className="animate-fade-in">
                  <TutorialsTab />
                </div>
              </Suspense>
            )}

            {currentTab === 'surebet' && (
              <Suspense fallback={<TabLoader />}>
                <div className="animate-fade-in">
                  <SurebetCalculator />
                </div>
              </Suspense>
            )}

            {currentTab === 'team' && (
              <Suspense fallback={<TabLoader />}>
                <div className="animate-fade-in">
                  <TeamTab />
                </div>
              </Suspense>
            )}

            {currentTab === 'store' && (
              <Suspense fallback={<TabLoader />}>
                <div className="animate-fade-in">
                  <StoreTab />
                </div>
              </Suspense>
            )}

            {isAdmin && currentTab === 'store-categories' && (
              <Suspense fallback={<TabLoader />}>
                <div className="animate-fade-in">
                  <StoreCategoriesTab />
                </div>
              </Suspense>
            )}

            {isAdmin && currentTab === 'store-products' && (
              <Suspense fallback={<TabLoader />}>
                <div className="animate-fade-in">
                  <StoreProductsTab />
                </div>
              </Suspense>
            )}

            {isAdmin && currentTab === 'store-coupons' && (
              <Suspense fallback={<TabLoader />}>
                <div className="animate-fade-in">
                  <StoreCouponsTab />
                </div>
              </Suspense>
            )}

            {isAdmin && currentTab === 'store-sales' && (
              <Suspense fallback={<TabLoader />}>
                <div className="animate-fade-in">
                  <StoreSalesTab />
                </div>
              </Suspense>
            )}

            {isAdmin && currentTab === 'individual' && (
              <Suspense fallback={<TabLoader />}>
                <div className="animate-fade-in">
                  <AdminIndividualTab dateRange={dateRange} />
                </div>
              </Suspense>
            )}

            {isAdmin && currentTab === 'global' && (
              <Suspense fallback={<TabLoader />}>
                <div className="animate-fade-in">
                  <AdminGlobalTab dateRange={dateRange} />
                </div>
              </Suspense>
            )}
          </main>
          </div>
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
    </div>
  );
}
