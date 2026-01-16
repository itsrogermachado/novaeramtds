import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarClock, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Expense } from '@/hooks/useExpenses';
import { parseDateOnly } from '@/lib/dateOnly';

interface UpcomingExpensesCardProps {
  expenses: Expense[];
}

export function UpcomingExpensesCard({ expenses }: UpcomingExpensesCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          Gastos por Vir
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum gasto agendado
          </p>
        ) : (
          <>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {format(parseDateOnly(expense.expense_date), "dd/MM", { locale: ptBR })}
                        </span>
                        <span className="text-sm truncate">{expense.description}</span>
                      </div>
                      {expense.category && (
                        <Badge
                          variant="outline"
                          className="text-xs mt-1"
                          style={{ 
                            borderColor: expense.category.color,
                            color: expense.category.color 
                          }}
                        >
                          {expense.category.name}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-medium text-destructive whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t pt-3 mt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Total previsto:
              </span>
              <span className="text-sm font-semibold text-destructive">
                {formatCurrency(total)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
