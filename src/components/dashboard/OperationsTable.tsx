import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Operation } from '@/hooks/useOperations';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface OperationsTableProps {
  operations: Operation[];
  onEdit: (operation: Operation) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  isLoading?: boolean;
}

export function OperationsTable({ operations, onEdit, onDelete, onAdd, isLoading }: OperationsTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
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
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : operations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma operação encontrada
                </TableCell>
              </TableRow>
            ) : (
              operations.map((operation) => {
                const profit = Number(operation.return_amount) - Number(operation.invested_amount);
                return (
                  <TableRow key={operation.id}>
                    <TableCell>
                      {format(new Date(operation.operation_date), "dd/MM/yyyy", { locale: ptBR })}
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
                          onClick={() => onDelete(operation.id)}
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
  );
}
