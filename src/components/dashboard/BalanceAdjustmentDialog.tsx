import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus, Minus, PiggyBank } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BalanceAdjustmentDialogProps {
  onSubmit: (data: { amount: number; description: string; adjustment_date?: string }) => Promise<void>;
  trigger?: React.ReactNode;
}

export function BalanceAdjustmentDialog({ onSubmit, trigger }: BalanceAdjustmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPositive, setIsPositive] = useState(true);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: 'Erro', description: 'Valor inválido', variant: 'destructive' });
      return;
    }

    if (!description.trim()) {
      toast({ title: 'Erro', description: 'Descrição obrigatória', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        amount: isPositive ? numAmount : -numAmount,
        description: description.trim(),
        adjustment_date: format(date, 'yyyy-MM-dd'),
      });
      toast({ title: 'Ajuste salvo com sucesso' });
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setDate(new Date());
    setIsPositive(true);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 shrink-0"
            title="Ajustar Balanço"
          >
            <PiggyBank className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Ajustar Balanço Líquido</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Adicione ou subtraia valores do seu balanço sem alterar operações.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Tipo de Ajuste</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isPositive ? 'default' : 'outline'}
                size="sm"
                className={cn("flex-1 gap-1.5 h-9", isPositive && "bg-success hover:bg-success/90")}
                onClick={() => setIsPositive(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">Adicionar</span>
                <span className="xs:hidden">Add</span>
              </Button>
              <Button
                type="button"
                variant={!isPositive ? 'default' : 'outline'}
                size="sm"
                className={cn("flex-1 gap-1.5 h-9", !isPositive && "bg-destructive hover:bg-destructive/90")}
                onClick={() => setIsPositive(false)}
              >
                <Minus className="h-4 w-4" />
                <span className="hidden xs:inline">Subtrair</span>
                <span className="xs:hidden">Sub</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm">Valor (R$)</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Ex: Correção de valor esquecido"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Data do Ajuste</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal h-10 text-sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-10">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 h-10">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
