import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Pencil, Trash2, Check, X, Target } from 'lucide-react';
import { Goal, GoalType } from '@/hooks/useGoals';
import { cn } from '@/lib/utils';

interface GoalsCardProps {
  goals: Goal[];
  todayProfit: number;
  weeklyProfit: number;
  netBalance: number;
  onCreate: (goal: { title: string; target_amount: number; goal_type: GoalType }) => Promise<{ error: Error | null }>;
  onUpdate: (id: string, goal: Partial<Goal>) => Promise<{ error: Error | null }>;
  onDelete: (id: string) => Promise<{ error: Error | null }>;
}

type EditingGoal = {
  id: string;
  title: string;
  target_amount: string;
};

type NewGoal = {
  type: GoalType;
  title: string;
  target_amount: string;
};

const goalTypeLabels: Record<GoalType, string> = {
  daily: 'Diárias',
  weekly: 'Semanais',
  monthly: 'Mensais',
};

const goalTypeSingularLabels: Record<GoalType, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

export function GoalsCard({
  goals,
  todayProfit,
  weeklyProfit,
  netBalance,
  onCreate,
  onUpdate,
  onDelete,
}: GoalsCardProps) {
  const [editingGoal, setEditingGoal] = useState<EditingGoal | null>(null);
  const [newGoal, setNewGoal] = useState<NewGoal | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getProgressValue = (goalType: GoalType): number => {
    switch (goalType) {
      case 'daily':
        return todayProfit;
      case 'weekly':
        return weeklyProfit;
      case 'monthly':
        return netBalance;
      default:
        return 0;
    }
  };

  const getProgressPercentage = (goal: Goal): number => {
    const currentValue = getProgressValue(goal.goal_type);
    const percentage = (currentValue / goal.target_amount) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  const handleCreate = async () => {
    if (!newGoal || !newGoal.title || !newGoal.target_amount) return;
    
    setIsLoading(true);
    await onCreate({
      title: newGoal.title,
      target_amount: parseFloat(newGoal.target_amount),
      goal_type: newGoal.type,
    });
    setNewGoal(null);
    setIsLoading(false);
  };

  const handleUpdate = async () => {
    if (!editingGoal || !editingGoal.title || !editingGoal.target_amount) return;
    
    setIsLoading(true);
    await onUpdate(editingGoal.id, {
      title: editingGoal.title,
      target_amount: parseFloat(editingGoal.target_amount),
    });
    setEditingGoal(null);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    await onDelete(id);
    setIsLoading(false);
  };

  const renderGoalItem = (goal: Goal) => {
    const isEditing = editingGoal?.id === goal.id;
    const currentValue = getProgressValue(goal.goal_type);
    const percentage = getProgressPercentage(goal);
    const isCompleted = percentage >= 100;

    if (isEditing) {
      return (
        <div key={goal.id} className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border/50">
          <Input
            value={editingGoal.title}
            onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
            placeholder="Título da meta"
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Input
              type="number"
              value={editingGoal.target_amount}
              onChange={(e) => setEditingGoal({ ...editingGoal, target_amount: e.target.value })}
              placeholder="Valor alvo"
              className="h-8 text-sm"
            />
            <Button size="sm" variant="ghost" onClick={handleUpdate} disabled={isLoading} className="hover:bg-success/10">
              <Check className="h-4 w-4 text-success" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingGoal(null)} className="hover:bg-muted">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div key={goal.id} className="space-y-2 group">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate flex-1">{goal.title}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => setEditingGoal({
                id: goal.id,
                title: goal.title,
                target_amount: String(goal.target_amount),
              })}
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-destructive/10"
              onClick={() => handleDelete(goal.id)}
              disabled={isLoading}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Progress 
            value={percentage} 
            className={cn(
              "h-2.5 progress-premium",
              isCompleted && "success-glow"
            )} 
          />
          {isCompleted && (
            <div className="absolute -right-1 -top-1 w-4 h-4 bg-success rounded-full flex items-center justify-center animate-scale-in">
              <Check className="h-2.5 w-2.5 text-success-foreground" />
            </div>
          )}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className={cn(isCompleted && "text-success font-medium")}>
            {formatCurrency(currentValue)} / {formatCurrency(goal.target_amount)}
          </span>
          <span className={cn(
            "font-medium",
            isCompleted ? "text-success" : percentage > 50 ? "text-gold" : "text-muted-foreground"
          )}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    );
  };

  const renderNewGoalForm = (type: GoalType) => {
    if (newGoal?.type !== type) return null;

    return (
      <div className="space-y-2 p-3 rounded-lg bg-muted/50 mt-2 border border-border/50 animate-scale-in">
        <Input
          value={newGoal.title}
          onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
          placeholder={`Nova meta ${goalTypeSingularLabels[type].toLowerCase()}`}
          className="h-8 text-sm"
        />
        <div className="flex gap-2">
          <Input
            type="number"
            value={newGoal.target_amount}
            onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
            placeholder="Valor alvo (R$)"
            className="h-8 text-sm"
          />
          <Button size="sm" variant="ghost" onClick={handleCreate} disabled={isLoading} className="hover:bg-success/10">
            <Check className="h-4 w-4 text-success" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setNewGoal(null)} className="hover:bg-muted">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderGoalSection = (type: GoalType) => {
    const typeGoals = goals.filter((g) => g.goal_type === type);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {goalTypeLabels[type]}
          </h4>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-muted"
            onClick={() => setNewGoal({ type, title: '', target_amount: '' })}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {typeGoals.length === 0 && !newGoal && (
          <p className="text-xs text-muted-foreground italic">Nenhuma meta {goalTypeSingularLabels[type].toLowerCase()}</p>
        )}
        <div className="space-y-3">
          {typeGoals.map(renderGoalItem)}
        </div>
        {renderNewGoalForm(type)}
      </div>
    );
  };

  return (
    <Card className="premium-shadow gradient-border animate-slide-up-fade animation-delay-200">
      <CardHeader className="pb-2 md:pb-3 p-3 sm:p-4 md:p-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gold/10">
            <Target className="h-4 w-4 text-gold" />
          </div>
          <CardTitle className="text-sm md:text-base">Metas</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 p-3 sm:p-4 md:p-6 md:pt-0">
        <ScrollArea className="h-[250px] sm:h-[300px] md:h-[400px] pr-2 md:pr-3">
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {renderGoalSection('daily')}
            <div className="decorative-line" />
            {renderGoalSection('weekly')}
            <div className="decorative-line" />
            {renderGoalSection('monthly')}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
