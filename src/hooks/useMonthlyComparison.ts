import { useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Operation } from './useOperations';
import { Expense } from './useExpenses';

export interface MonthlyData {
  month: string;
  displayMonth: string;
  operationsCount: number;
  totalInvested: number;
  totalReturn: number;
  profit: number;
  totalExpenses: number;
  netBalance: number;
  profitVariation: number | null;
}

export function useMonthlyComparison(
  operations: Operation[],
  expenses: Expense[],
  monthsCount: number = 6
) {
  const monthlyData = useMemo(() => {
    const months: MonthlyData[] = [];
    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthKey = format(monthDate, 'yyyy-MM');
      const displayMonth = format(monthDate, 'MMM/yy', { locale: ptBR });

      const monthOps = operations.filter(op => {
        const opDate = parseISO(op.operation_date);
        return format(opDate, 'yyyy-MM') === monthKey;
      });

      const monthExps = expenses.filter(exp => {
        const expDate = parseISO(exp.expense_date);
        return format(expDate, 'yyyy-MM') === monthKey;
      });

      const totalInvested = monthOps.reduce((sum, op) => sum + Number(op.invested_amount), 0);
      const totalReturn = monthOps.reduce((sum, op) => sum + Number(op.return_amount), 0);
      const profit = totalReturn - totalInvested;
      const totalExpenses = monthExps.reduce((sum, exp) => sum + Number(exp.amount), 0);
      const netBalance = profit - totalExpenses;

      months.push({
        month: monthKey,
        displayMonth,
        operationsCount: monthOps.length,
        totalInvested,
        totalReturn,
        profit,
        totalExpenses,
        netBalance,
        profitVariation: null,
      });
    }

    // Calculate variations
    for (let i = 1; i < months.length; i++) {
      const prevProfit = months[i - 1].profit;
      const currProfit = months[i].profit;
      if (prevProfit !== 0) {
        months[i].profitVariation = ((currProfit - prevProfit) / Math.abs(prevProfit)) * 100;
      } else if (currProfit !== 0) {
        months[i].profitVariation = 100;
      }
    }

    return months;
  }, [operations, expenses, monthsCount]);

  const summary = useMemo(() => {
    if (monthlyData.length === 0) {
      return {
        avgProfit: 0,
        totalProfit: 0,
        bestMonth: null as MonthlyData | null,
        worstMonth: null as MonthlyData | null,
        trend: 'stable' as 'up' | 'down' | 'stable',
      };
    }

    const totalProfit = monthlyData.reduce((sum, m) => sum + m.netBalance, 0);
    const avgProfit = totalProfit / monthlyData.length;

    const sortedByProfit = [...monthlyData].sort((a, b) => b.netBalance - a.netBalance);
    const bestMonth = sortedByProfit[0];
    const worstMonth = sortedByProfit[sortedByProfit.length - 1];

    // Calculate trend using last 3 months
    const recentMonths = monthlyData.slice(-3);
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentMonths.length >= 2) {
      const firstHalf = recentMonths.slice(0, Math.ceil(recentMonths.length / 2));
      const secondHalf = recentMonths.slice(Math.ceil(recentMonths.length / 2));
      const firstAvg = firstHalf.reduce((s, m) => s + m.netBalance, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, m) => s + m.netBalance, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg * 1.1) trend = 'up';
      else if (secondAvg < firstAvg * 0.9) trend = 'down';
    }

    return { avgProfit, totalProfit, bestMonth, worstMonth, trend };
  }, [monthlyData]);

  return { monthlyData, summary };
}
