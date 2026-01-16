import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Goal, GoalType } from '@/hooks/useGoals';

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

    if (isEditing) {
      return (
        <div key={goal.id} className="space-y-2 p-2 rounded-md bg-muted/50">
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
            <Button size="sm" variant="ghost" onClick={handleUpdate} disabled={isLoading}>
              <Check className="h-4 w-4 text-success" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingGoal(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div key={goal.id} className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate flex-1">{goal.title}</span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
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
              className="h-6 w-6 p-0"
              onClick={() => handleDelete(goal.id)}
              disabled={isLoading}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(currentValue)} / {formatCurrency(goal.target_amount)}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      </div>
    );
  };

  const renderNewGoalForm = (type: GoalType) => {
    if (newGoal?.type !== type) return null;

    return (
      <div className="space-y-2 p-2 rounded-md bg-muted/50 mt-2">
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
          <Button size="sm" variant="ghost" onClick={handleCreate} disabled={isLoading}>
            <Check className="h-4 w-4 text-success" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setNewGoal(null)}>
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
            className="h-6 w-6 p-0"
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
    <Card>
      <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
        <CardTitle className="text-sm md:text-base">Metas</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 p-3 md:p-6 md:pt-0">
        <ScrollArea className="h-[200px] md:h-[400px] pr-2 md:pr-3">
          <div className="space-y-4 md:space-y-5">
            {renderGoalSection('daily')}
            {renderGoalSection('weekly')}
            {renderGoalSection('monthly')}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
