import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Operation } from '@/hooks/useOperations';
import { parseDateOnly } from '@/lib/dateOnly';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OperationMobileCardProps {
  operation: Operation;
  onEdit: (operation: Operation) => void;
  onDelete: (id: string) => void;
}

export function OperationMobileCard({ operation, onEdit, onDelete }: OperationMobileCardProps) {
  const profit = Number(operation.return_amount) - Number(operation.invested_amount);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm active:scale-[0.99] transition-transform">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {operation.method && (
              <>
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: operation.method.color }}
                />
                <span className="text-sm font-medium truncate">{operation.method.name}</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {format(parseDateOnly(operation.operation_date), "dd 'de' MMMM", { locale: ptBR })}
            {' às '}
            {format(new Date(operation.created_at), "HH:mm", { locale: ptBR })}
          </p>
        </div>
        
        {/* Profit badge */}
        <div className={cn(
          "px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0",
          profit >= 0 
            ? "text-success bg-success/10" 
            : "text-destructive bg-destructive/10"
        )}>
          {formatCurrency(profit)}
        </div>
      </div>

      {/* Details row */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex-1">
          <span className="text-muted-foreground text-xs block">Investido</span>
          <span className="font-medium">{formatCurrency(Number(operation.invested_amount))}</span>
        </div>
        <div className="flex-1">
          <span className="text-muted-foreground text-xs block">Retorno</span>
          <span className="font-medium">{formatCurrency(Number(operation.return_amount))}</span>
        </div>
      </div>

      {/* Notes (if any) */}
      {operation.notes && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-muted-foreground line-clamp-2">{operation.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 h-9 gap-2"
          onClick={() => onEdit(operation)}
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 h-9 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(operation.id)}
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
      </div>
    </div>
  );
}
