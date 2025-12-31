import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
import { CalendarIcon, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Goal, GoalType } from '@/hooks/useGoals';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

interface GoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: Goal[];
  netBalance: number;
  todayProfit: number;
  onCreate: (data: {
    title: string;
    target_amount: number;
    current_amount?: number;
    deadline?: string;
    goal_type?: GoalType;
  }) => Promise<{ error: Error | null }>;
  onUpdate: (id: string, data: Partial<Goal>) => Promise<{ error: Error | null }>;
  onDelete: (id: string) => Promise<{ error: Error | null }>;
}

export function GoalsDialog({
  open,
  onOpenChange,
  goals,
  netBalance,
  todayProfit,
  onCreate,
  onUpdate,
  onDelete,
}: GoalsDialogProps) {
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [goalType, setGoalType] = useState<GoalType>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setShowNewGoal(false);
      setTitle('');
      setTargetAmount('');
      setDeadline(undefined);
      setGoalType('monthly');
    }
  }, [open]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await onCreate({
      title: title.trim(),
      target_amount: parseFloat(targetAmount) || 0,
      deadline: deadline ? format(deadline, 'yyyy-MM-dd') : undefined,
      goal_type: goalType,
    });

    setIsSubmitting(false);

    if (!error) {
      setShowNewGoal(false);
      setTitle('');
      setTargetAmount('');
      setDeadline(undefined);
      setGoalType('monthly');
    }
  };

  const handleDeleteClick = (id: string) => {
    setGoalToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (goalToDelete) {
      await onDelete(goalToDelete);
      setDeleteDialogOpen(false);
      setGoalToDelete(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getProgressValue = (goal: Goal) => {
    const currentValue = goal.goal_type === 'daily' ? todayProfit : netBalance;
    return Math.min((currentValue / Number(goal.target_amount)) * 100, 100);
  };

  const getCurrentAmount = (goal: Goal) => {
    return goal.goal_type === 'daily' ? todayProfit : netBalance;
  };

  return (
    <>
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
                  <Label>Tipo de Meta</Label>
                  <Select value={goalType} onValueChange={(v) => setGoalType(v as GoalType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="daily">Diária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Título da Meta</Label>
                  <Input
                    placeholder={goalType === 'daily' ? "Ex: Meta diária de lucro" : "Ex: Comprar um carro"}
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

                {goalType === 'monthly' && (
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
                )}

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
                  const progress = getProgressValue(goal);
                  const currentAmount = getCurrentAmount(goal);
                  
                  return (
                    <div key={goal.id} className="p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground">{goal.title}</h4>
                            <Badge variant={goal.goal_type === 'daily' ? 'default' : 'secondary'}>
                              {goal.goal_type === 'daily' ? 'Diária' : 'Mensal'}
                            </Badge>
                          </div>
                          {goal.deadline && goal.goal_type === 'monthly' && (
                            <p className="text-xs text-muted-foreground">
                              Até {format(new Date(goal.deadline), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {formatCurrency(Math.max(0, currentAmount))}
                          </span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(Number(goal.target_amount))}
                          </span>
                        </div>
                        <Progress value={Math.max(0, progress)} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">
                          {Math.max(0, progress).toFixed(1)}% concluído
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

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Excluir Meta"
        description="Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita."
      />
    </>
  );
}
