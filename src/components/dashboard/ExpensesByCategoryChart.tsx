import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Expense } from '@/hooks/useExpenses';
interface ExpensesByCategoryChartProps {
  expenses: Expense[];
}
export function ExpensesByCategoryChart({
  expenses
}: ExpensesByCategoryChartProps) {
  const chartData = useMemo(() => {
    const categoryTotals: Record<string, {
      name: string;
      value: number;
      color: string;
    }> = {};
    expenses.forEach(expense => {
      const categoryId = expense.category_id || 'uncategorized';
      const categoryName = expense.category?.name || 'Sem categoria';
      const categoryColor = expense.category?.color || '#6B7280';
      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = {
          name: categoryName,
          value: 0,
          color: categoryColor
        };
      }
      categoryTotals[categoryId].value += Number(expense.amount);
    });
    return Object.values(categoryTotals);
  }, [expenses]);
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
  if (chartData.length === 0) {
    return <div className="bg-card border border-border rounded-lg p-5 shadow-elegant">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Gastos por Categoria</h3>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          Nenhum gasto no período
        </div>
      </div>;
  }
  return;
}