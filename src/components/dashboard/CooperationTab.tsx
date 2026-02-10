import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Check,
  Handshake,
  Users,
  Landmark,
  Banknote,
  History,
  X,
  Pencil,
} from 'lucide-react';
import { format } from 'date-fns';

interface ChildAccount {
  name: string;
  deposit: number;
  withdrawal: number;
}

interface CooperationRecord {
  id: string;
  user_id: string;
  child_accounts: ChildAccount[];
  treasure: number;
  salary: number;
  total: number;
  created_at: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function CooperationTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [childAccounts, setChildAccounts] = useState<ChildAccount[]>([
    { name: '', deposit: 0, withdrawal: 0 },
  ]);
  const [treasure, setTreasure] = useState(0);
  const [salary, setSalary] = useState(0);

  // Fetch history
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['cooperations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cooperations')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CooperationRecord[];
    },
    enabled: !!user,
  });

  // Save mutation (insert or update)
  const saveMutation = useMutation({
    mutationFn: async () => {
      const total = childAccountsTotal + treasure + salary;
      if (editingId) {
        const { error } = await supabase.from('cooperations').update({
          child_accounts: childAccounts as any,
          treasure,
          salary,
          total,
        }).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cooperations').insert({
          user_id: user!.id,
          child_accounts: childAccounts as any,
          treasure,
          salary,
          total,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooperations', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['cooperations-total', user?.id] });
      toast({ title: editingId ? 'Cooperação atualizada!' : 'Cooperação salva com sucesso!' });
      resetEditor();
    },
    onError: () => {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cooperations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooperations', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['cooperations-total', user?.id] });
      toast({ title: 'Cooperação excluída' });
    },
  });

  const resetEditor = () => {
    setIsEditing(false);
    setEditingId(null);
    setChildAccounts([{ name: '', deposit: 0, withdrawal: 0 }]);
    setTreasure(0);
    setSalary(0);
  };

  const startEditing = (record: CooperationRecord) => {
    const accounts = (record.child_accounts || []) as ChildAccount[];
    setChildAccounts(accounts.length > 0 ? accounts : [{ name: '', deposit: 0, withdrawal: 0 }]);
    setTreasure(record.treasure);
    setSalary(record.salary);
    setEditingId(record.id);
    setIsEditing(true);
  };

  const addChildAccount = () => {
    setChildAccounts((prev) => [...prev, { name: '', deposit: 0, withdrawal: 0 }]);
  };

  const removeChildAccount = (index: number) => {
    setChildAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateChildAccount = (index: number, field: keyof ChildAccount, value: string | number) => {
    setChildAccounts((prev) =>
      prev.map((acc, i) => (i === index ? { ...acc, [field]: value } : acc))
    );
  };

  const childAccountsTotal = useMemo(
    () => childAccounts.reduce((sum, acc) => sum + acc.withdrawal - acc.deposit, 0),
    [childAccounts]
  );

  const grandTotal = childAccountsTotal + treasure + salary;

  // ── Editor view ──
  if (isEditing) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            {editingId ? 'Editar Cooperação' : 'Nova Cooperação'}
          </h2>
          <Button variant="ghost" size="sm" onClick={resetEditor}>
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
        </div>

        {/* Contas Filhas */}
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Contas Filhas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_40px] gap-2 text-xs text-muted-foreground font-medium px-1">
              <span>Depósito</span>
              <span>Saque</span>
              <span />
            </div>
            {childAccounts.map((acc, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_40px] gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Depósito"
                  value={acc.deposit || ''}
                  onChange={(e) => updateChildAccount(i, 'deposit', parseFloat(e.target.value) || 0)}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Saque"
                  value={acc.withdrawal || ''}
                  onChange={(e) => updateChildAccount(i, 'withdrawal', parseFloat(e.target.value) || 0)}
                  className="text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeChildAccount(i)}
                  disabled={childAccounts.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addChildAccount} className="gap-1">
              <Plus className="h-3 w-3" /> Adicionar conta
            </Button>
            <Separator />
            <div className="flex justify-between items-center px-1 font-medium text-sm">
              <span>Subtotal Contas Filhas</span>
              <span className={cn(childAccountsTotal >= 0 ? 'text-success' : 'text-destructive')}>
                {formatCurrency(childAccountsTotal)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Baú */}
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              Baú
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              placeholder="Valor do Baú"
              value={treasure || ''}
              onChange={(e) => setTreasure(parseFloat(e.target.value) || 0)}
            />
            <div className="flex justify-between items-center px-1 mt-3 font-medium text-sm">
              <span>Subtotal Baú</span>
              <span className={cn(treasure >= 0 ? 'text-success' : 'text-destructive')}>
                {formatCurrency(treasure)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Salário */}
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" />
              Salário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              placeholder="Valor do Salário"
              value={salary || ''}
              onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
            />
            <div className="flex justify-between items-center px-1 mt-3 font-medium text-sm">
              <span>Subtotal Salário</span>
              <span className={cn(salary >= 0 ? 'text-success' : 'text-destructive')}>
                {formatCurrency(salary)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Geral */}
        <Card className="border-primary/30 bg-primary/5 backdrop-blur">
          <CardContent className="py-4">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total Geral</span>
              <span className={cn(grandTotal >= 0 ? 'text-success' : 'text-destructive')}>
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full gap-2"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          <Check className="h-4 w-4" />
          {saveMutation.isPending ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cooperação Finalizada'}
        </Button>
      </div>
    );
  }

  // ── History view ──
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Handshake className="h-5 w-5 text-primary" />
          Cooperação
        </h2>
        <Button onClick={() => setIsEditing(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Cooperação
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhuma cooperação registrada ainda.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Clique em "Nova Cooperação" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((record) => {
            const accounts = (record.child_accounts || []) as ChildAccount[];
            const accountsTotal = accounts.reduce((s, a) => s + a.withdrawal - a.deposit, 0);
            return (
              <Card key={record.id} className="border-border/50 bg-card/80 backdrop-blur">
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(record.created_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={cn('font-bold', record.total >= 0 ? 'text-success' : 'text-destructive')}>
                        {formatCurrency(record.total)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => startEditing(record)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(record.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div className="flex justify-between sm:flex-col sm:gap-0.5">
                      <span className="text-muted-foreground">Contas Filhas ({accounts.length})</span>
                      <span className="font-medium">{formatCurrency(accountsTotal)}</span>
                    </div>
                    <div className="flex justify-between sm:flex-col sm:gap-0.5">
                      <span className="text-muted-foreground">Baú</span>
                      <span className="font-medium">{formatCurrency(record.treasure)}</span>
                    </div>
                    <div className="flex justify-between sm:flex-col sm:gap-0.5">
                      <span className="text-muted-foreground">Salário</span>
                      <span className="font-medium">{formatCurrency(record.salary)}</span>
                    </div>
                  </div>
                  {accounts.length > 0 && (
                    <div className="border-t border-border/30 pt-2 space-y-1">
                      {accounts.map((acc, i) => (
                        <div key={i} className="flex justify-between text-xs text-muted-foreground">
                          <span>{acc.name || `Conta ${i + 1}`}</span>
                          <span>
                            D: {formatCurrency(acc.deposit)} / S: {formatCurrency(acc.withdrawal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CooperationTab;
