import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarIcon, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Goal } from '@/hooks/useGoals';

interface GoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: Goal[];
  onCreate: (data: {
    title: string;
    target_amount: number;
    current_amount?: number;
    deadline?: string;
  }) => Promise<{ error: Error | null }>;
  onUpdate: (id: string, data: Partial<Goal>) => Promise<{ error: Error | null }>;
  onDelete: (id: string) => Promise<{ error: Error | null }>;
}

export function GoalsDialog({
  open,
  onOpenChange,
  goals,
  onCreate,
  onUpdate,
  onDelete,
}: GoalsDialogProps) {
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowNewGoal(false);
      setTitle('');
      setTargetAmount('');
      setDeadline(undefined);
    }
  }, [open]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await onCreate({
      title: title.trim(),
      target_amount: parseFloat(targetAmount) || 0,
      deadline: deadline ? format(deadline, 'yyyy-MM-dd') : undefined,
    });

    setIsSubmitting(false);

    if (!error) {
      setShowNewGoal(false);
      setTitle('');
      setTargetAmount('');
      setDeadline(undefined);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center justify-between">
            Minhas Metas
            {!showNewGoal && (
              <Button size="sm" onClick={() => setShowNewGoal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Meta
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {showNewGoal && (
            <form onSubmit={handleCreateGoal} className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label>Título da Meta</Label>
                <Input
                  placeholder="Ex: Comprar um carro"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Alvo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Data Limite (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewGoal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || !title.trim()}>
                  {isSubmitting ? 'Criando...' : 'Criar Meta'}
                </Button>
              </div>
            </form>
          )}

          {goals.length === 0 && !showNewGoal ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma meta criada ainda.</p>
              <p className="text-sm">Clique em "Nova Meta" para começar!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => {
                const progress = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100);
                
                return (
                  <div key={goal.id} className="p-4 bg-card border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground">{goal.title}</h4>
                        {goal.deadline && (
                          <p className="text-xs text-muted-foreground">
                            Até {format(new Date(goal.deadline), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(Number(goal.current_amount))}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(Number(goal.target_amount))}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">
                        {progress.toFixed(1)}% concluído
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
