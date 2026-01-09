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
import { Pencil, Trash2, Plus, MessageSquare } from 'lucide-react';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

interface OperationsTableProps {
  operations: Operation[];
  onEdit: (operation: Operation) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  isLoading?: boolean;
}

export function OperationsTable({ operations, onEdit, onDelete, onAdd, isLoading }: OperationsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [operationToDelete, setOperationToDelete] = useState<string | null>(null);

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

  return (
    <>
      <div className="bg-card border border-border rounded-lg shadow-elegant">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Histórico de Operações</h3>
          <Button size="sm" onClick={onAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Operação
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Investido</TableHead>
                <TableHead className="text-right">Retorno</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead>Notas</TableHead>
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
                operations.map((operation) => {
                  const profit = Number(operation.return_amount) - Number(operation.invested_amount);
                  return (
                    <TableRow key={operation.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(parseDateOnly(operation.operation_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                          <span className="text-xs text-muted-foreground">
                            às {format(new Date(operation.created_at), "HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {operation.method && (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: operation.method.color }}
                            />
                            <span>{operation.method.name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(operation.invested_amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(operation.return_amount))}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(profit)}
                      </TableCell>
                      <TableCell>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(operation)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(operation.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
