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
      <div className="bg-card border border-border rounded-lg shadow-elegant">
        <div className="p-3 md:p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-base md:text-lg font-semibold text-foreground">Meus Gastos</h3>
          <Button size="sm" onClick={onAdd} className="gap-1.5 md:gap-2 text-xs md:text-sm h-8 md:h-9">
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Novo Gasto</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs md:text-sm">Data</TableHead>
                <TableHead className="text-xs md:text-sm">Categoria</TableHead>
                <TableHead className="text-xs md:text-sm hidden md:table-cell">Descrição</TableHead>
                <TableHead className="text-xs md:text-sm text-right">Valor</TableHead>
                <TableHead className="text-xs md:text-sm text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum gasto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-xs md:text-sm py-2 md:py-4">
                      <div className="flex flex-col">
                        <span>{format(parseDateOnly(expense.expense_date), "dd/MM", { locale: ptBR })}</span>
                        <span className="text-xs text-muted-foreground hidden md:block">
                          às {format(new Date(expense.created_at), "HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm py-2 md:py-4">
                      {expense.category && (
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <div 
                            className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: expense.category.color }}
                          />
                          <span className="truncate max-w-[60px] md:max-w-none">{expense.category.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm hidden md:table-cell">{expense.description}</TableCell>
                    <TableCell className="text-right text-destructive font-medium text-xs md:text-sm py-2 md:py-4">
                      -{formatCurrency(Number(expense.amount))}
                    </TableCell>
                    <TableCell className="text-right py-2 md:py-4">
                      <div className="flex items-center justify-end gap-0.5 md:gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-8 md:w-8"
                          onClick={() => onEdit(expense)}
                        >
                          <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:text-destructive"
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
          <div className="p-3 md:p-4 border-t border-border flex items-center justify-between">
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
