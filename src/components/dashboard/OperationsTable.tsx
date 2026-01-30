import { useState, memo, useCallback } from 'react';
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
import { OperationMobileCard } from './OperationMobileCard';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface OperationsTableProps {
  operations: Operation[];
  onEdit: (operation: Operation) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 10;

function OperationsTableComponent({ operations, onEdit, onDelete, onAdd, isLoading }: OperationsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [operationToDelete, setOperationToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();

  const ITEMS_PER_PAGE_MOBILE = 5;
  const itemsPerPage = isMobile ? ITEMS_PER_PAGE_MOBILE : ITEMS_PER_PAGE;
  
  const totalPages = Math.ceil(operations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOperations = operations.slice(startIndex, endIndex);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleDeleteClick = useCallback((id: string) => {
    setOperationToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (operationToDelete) {
      onDelete(operationToDelete);
      setDeleteDialogOpen(false);
      setOperationToDelete(null);
    }
  }, [operationToDelete, onDelete]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  return (
    <>
      <div className="bg-card border border-border rounded-xl premium-shadow overflow-hidden animate-slide-up-fade">
        {/* Header with gradient */}
        <div className="relative p-3 sm:p-4 md:p-5 border-b border-border flex items-center justify-between overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-muted/30 via-transparent to-muted/30 pointer-events-none" />
          <h3 className="relative text-sm sm:text-base md:text-lg font-semibold text-foreground">Histórico</h3>
          <Button size="sm" onClick={onAdd} className="relative gap-2 btn-premium text-primary-foreground h-9">
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline">Nova Operação</span>
            <span className="xs:hidden">Nova</span>
          </Button>
        </div>

        {/* Mobile card view */}
        {isMobile ? (
          <div className="p-3 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : operations.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">
                Nenhuma operação encontrada
              </p>
            ) : (
              paginatedOperations.map((operation) => (
                <OperationMobileCard
                  key={operation.id}
                  operation={operation}
                  onEdit={onEdit}
                  onDelete={handleDeleteClick}
                />
              ))
            )}
          </div>
        ) : (
          /* Desktop table view */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 bg-muted/30">
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold">Método</TableHead>
                  <TableHead className="text-right font-semibold">Investido</TableHead>
                  <TableHead className="text-right font-semibold">Retorno</TableHead>
                  <TableHead className="text-right font-semibold">Lucro</TableHead>
                  <TableHead className="font-semibold">Notas</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Carregando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : operations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma operação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                paginatedOperations.map((operation, index) => {
                  const profit = Number(operation.return_amount) - Number(operation.invested_amount);
                  return (
                    <TableRow 
                      key={operation.id} 
                      className={cn(
                        "table-row-premium border-b border-border/30",
                        index % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                      )}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{format(parseDateOnly(operation.operation_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                          <span className="text-xs text-muted-foreground hidden md:block">
                            às {format(new Date(operation.created_at), "HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {operation.method && (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-offset-card"
                              style={{ backgroundColor: operation.method.color, boxShadow: `0 0 8px ${operation.method.color}40` }}
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
                      <TableCell className="text-right">
                        <span className={cn(
                          "text-sm font-semibold px-2 py-1 rounded-md",
                          profit >= 0 
                            ? "text-success bg-success/10" 
                            : "text-destructive bg-destructive/10"
                        )}>
                          {formatCurrency(profit)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {operation.notes ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="glass-card">
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
                            className="h-7 w-7 md:h-8 md:w-8 hover:bg-muted"
                            onClick={() => onEdit(operation)}
                          >
                            <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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
        )}

        {/* Pagination */}
        {operations.length > itemsPerPage && (
          <div className="p-3 md:p-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2 bg-muted/20">
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
                      className={cn(
                        "h-8 w-8 p-0",
                        currentPage === pageNum && "btn-premium text-primary-foreground"
                      )}
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

// Memoize the component to prevent unnecessary re-renders
export const OperationsTable = memo(OperationsTableComponent);
