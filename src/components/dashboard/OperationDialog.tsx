import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Operation, OperationMethod } from '@/hooks/useOperations';

interface OperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation?: Operation | null;
  methods: OperationMethod[];
  onSubmit: (data: {
    method_id: string;
    invested_amount: number;
    return_amount: number;
    operation_date: string;
    notes?: string;
  }) => Promise<{ error: Error | null }>;
  onCreateMethod: (data: { name: string; color: string }) => Promise<{ error: Error | null }>;
}

export function OperationDialog({
  open,
  onOpenChange,
  operation,
  methods,
  onSubmit,
  onCreateMethod,
}: OperationDialogProps) {
  const [methodId, setMethodId] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewMethod, setShowNewMethod] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodColor, setNewMethodColor] = useState('#3B82F6');

  useEffect(() => {
    if (operation) {
      setMethodId(operation.method_id || '');
      setInvestedAmount(String(operation.invested_amount));
      setReturnAmount(String(operation.return_amount));
      setDate(new Date(operation.operation_date));
      setNotes(operation.notes || '');
    } else {
      setMethodId('');
      setInvestedAmount('');
      setReturnAmount('');
      setDate(new Date());
      setNotes('');
    }
  }, [operation, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await onSubmit({
      method_id: methodId,
      invested_amount: parseFloat(investedAmount) || 0,
      return_amount: parseFloat(returnAmount) || 0,
      operation_date: format(date, 'yyyy-MM-dd'),
      notes: notes || undefined,
    });

    setIsSubmitting(false);

    if (!error) {
      onOpenChange(false);
    }
  };

  const handleCreateMethod = async () => {
    if (!newMethodName.trim()) return;

    const { error } = await onCreateMethod({
      name: newMethodName.trim(),
      color: newMethodColor,
    });

    if (!error) {
      setShowNewMethod(false);
      setNewMethodName('');
      setNewMethodColor('#3B82F6');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display">
            {operation ? 'Editar Operação' : 'Nova Operação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Método</Label>
            {showNewMethod ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do método"
                    value={newMethodName}
                    onChange={(e) => setNewMethodName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="color"
                    value={newMethodColor}
                    onChange={(e) => setNewMethodColor(e.target.value)}
                    className="w-12 p-1 h-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateMethod}
                  >
                    Criar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewMethod(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select value={methodId} onValueChange={setMethodId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um método" />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: method.color }}
                          />
                          {method.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setShowNewMethod(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Investido (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Retorno (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={returnAmount}
                onChange={(e) => setReturnAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              placeholder="Notas sobre a operação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !methodId}>
              {isSubmitting ? 'Salvando...' : operation ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
