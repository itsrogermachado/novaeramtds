import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Expense } from '@/hooks/useExpenses';
import { parseDateOnly } from '@/lib/dateOnly';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

interface ExpensesTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  isLoading?: boolean;
}

export function ExpensesTable({ expenses, onEdit, onDelete, onAdd, isLoading }: ExpensesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(expenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = expenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleDeleteClick = (id: string) => {
    setExpenseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      onDelete(expenseToDelete);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl premium-shadow overflow-hidden animate-slide-up-fade">
        {/* Header with gradient */}
        <div className="relative p-3 md:p-5 border-b border-border flex items-center justify-between overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-muted/30 via-transparent to-muted/30 pointer-events-none" />
          <h3 className="relative text-base md:text-lg font-semibold text-foreground">Meus Gastos</h3>
          <Button size="sm" onClick={onAdd} className="relative gap-1.5 md:gap-2 text-xs md:text-sm h-8 md:h-9 btn-premium text-primary-foreground">
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Novo Gasto</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 bg-muted/30">
                <TableHead className="text-xs md:text-sm font-semibold">Data</TableHead>
                <TableHead className="text-xs md:text-sm font-semibold">Categoria</TableHead>
                <TableHead className="text-xs md:text-sm hidden md:table-cell font-semibold">Descrição</TableHead>
                <TableHead className="text-xs md:text-sm text-right font-semibold">Valor</TableHead>
                <TableHead className="text-xs md:text-sm text-right font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum gasto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedExpenses.map((expense, index) => (
                  <TableRow 
                    key={expense.id}
                    className={cn(
                      "table-row-premium border-b border-border/30",
                      index % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                    )}
                  >
                    <TableCell className="text-xs md:text-sm py-2 md:py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{format(parseDateOnly(expense.expense_date), "dd/MM", { locale: ptBR })}</span>
                        <span className="text-xs text-muted-foreground hidden md:block">
                          às {format(new Date(expense.created_at), "HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm py-2 md:py-4">
                      {expense.category && (
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <div 
                            className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-card"
                            style={{ backgroundColor: expense.category.color, boxShadow: `0 0 8px ${expense.category.color}40` }}
                          />
                          <span className="truncate max-w-[60px] md:max-w-none">{expense.category.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm hidden md:table-cell">{expense.description}</TableCell>
                    <TableCell className="text-right py-2 md:py-4">
                      <span className="text-destructive font-semibold text-xs md:text-sm px-2 py-1 rounded-md bg-destructive/10">
                        -{formatCurrency(Number(expense.amount))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-2 md:py-4">
                      <div className="flex items-center justify-end gap-0.5 md:gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-8 md:w-8 hover:bg-muted"
                          onClick={() => onEdit(expense)}
                        >
                          <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(expense.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 md:p-4 border-t border-border/50 flex items-center justify-between bg-muted/20">
            <span className="text-xs md:text-sm text-muted-foreground">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, expenses.length)} de {expenses.length}
            </span>
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
              <span className="text-xs md:text-sm text-muted-foreground min-w-[60px] text-center">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Excluir Gasto"
        description="Tem certeza que deseja excluir este gasto? Esta ação não pode ser desfeita."
      />
    </>
  );
}
