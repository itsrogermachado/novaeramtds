import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Operation } from '@/hooks/useOperations';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pencil, Trash2, Plus, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

interface OperationsTableProps {
  operations: Operation[];
  onEdit: (operation: Operation) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function OperationsTable({ operations, onEdit, onDelete, onAdd, isLoading }: OperationsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [operationToDelete, setOperationToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(operations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOperations = operations.slice(startIndex, endIndex);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleDeleteClick = (id: string) => {
    setOperationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (operationToDelete) {
      onDelete(operationToDelete);
      setDeleteDialogOpen(false);
      setOperationToDelete(null);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg shadow-elegant">
        <div className="p-4 md:p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-base md:text-lg font-semibold text-foreground">Histórico de Operações</h3>
          <Button size="sm" onClick={onAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Operação</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Investido</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Retorno</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="hidden md:table-cell">Notas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : operations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma operação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOperations.map((operation) => {
                  const profit = Number(operation.return_amount) - Number(operation.invested_amount);
                  return (
                    <TableRow key={operation.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{format(parseDateOnly(operation.operation_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                          <span className="text-xs text-muted-foreground hidden md:block">
                            às {format(new Date(operation.created_at), "HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {operation.method && (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: operation.method.color }}
                            />
                            <span className="text-sm truncate max-w-[80px] md:max-w-none">{operation.method.name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        <span className="text-sm">{formatCurrency(Number(operation.invested_amount))}</span>
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        <span className="text-sm">{formatCurrency(Number(operation.return_amount))}</span>
                      </TableCell>
                      <TableCell className={`text-right font-medium text-sm ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(profit)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {operation.notes ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{operation.notes}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5 md:gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 md:h-8 md:w-8"
                            onClick={() => onEdit(operation)}
                          >
                            <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(operation.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {operations.length > ITEMS_PER_PAGE && (
          <div className="p-3 md:p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs md:text-sm text-muted-foreground order-2 sm:order-1">
              Mostrando {startIndex + 1}-{Math.min(endIndex, operations.length)} de {operations.length}
            </span>
            <div className="flex items-center gap-1 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-2 md:px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Anterior</span>
              </Button>
              
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <span className="sm:hidden text-sm text-muted-foreground px-2">
                {currentPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-2 md:px-3"
              >
                <span className="hidden sm:inline mr-1">Próxima</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Excluir Operação"
        description="Tem certeza que deseja excluir esta operação? Esta ação não pode ser desfeita."
      />
    </>
  );
}
