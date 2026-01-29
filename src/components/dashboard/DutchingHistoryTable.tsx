import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { History, TrendingUp, TrendingDown, Minus, Trash2, Check, X } from 'lucide-react';
import { DutchingHistoryEntry } from '@/hooks/useDutchingHistory';
import { cn } from '@/lib/utils';

interface DutchingHistoryTableProps {
  history: DutchingHistoryEntry[];
  isLoading: boolean;
  onUpdateObservation: (id: string, observation: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DutchingHistoryTable({
  history,
  isLoading,
  onUpdateObservation,
  onDelete,
}: DutchingHistoryTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getResultBadge = (profit: number) => {
    if (profit > 0.01) {
      return (
        <Badge className="bg-success text-success-foreground gap-1 font-game-body">
          <TrendingUp className="h-3 w-3" />
          Lucro
        </Badge>
      );
    } else if (profit < -0.01) {
      return (
        <Badge variant="destructive" className="gap-1 font-game-body">
          <TrendingDown className="h-3 w-3" />
          Prejuízo
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="gap-1 font-game-body bg-warning/20 text-warning border-warning/30">
          <Minus className="h-3 w-3" />
          Empate
        </Badge>
      );
    }
  };

  const handleStartEdit = (entry: DutchingHistoryEntry) => {
    setEditingId(entry.id);
    setEditingText(entry.observation || '');
  };

  const handleSaveObservation = async (id: string) => {
    setSavingId(id);
    await onUpdateObservation(id, editingText);
    setSavingId(null);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta operação?')) return;
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  if (isLoading) {
    return (
      <Card className="dutching-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-game text-lg">
            <History className="h-5 w-5 text-dutching-blue" />
            Histórico de Operações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dutching-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-game text-lg">
          <History className="h-5 w-5 text-dutching-blue" />
          Histórico de Operações
        </CardTitle>
        <p className="text-sm text-muted-foreground font-game-body">
          Aqui ficam registradas todas as suas operações de dutching.
        </p>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
              <History className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <p className="font-game-body text-muted-foreground">
                Nenhuma operação registrada ainda
              </p>
              <p className="text-xs text-muted-foreground/60 font-game-body">
                Faça seu primeiro cálculo para começar o histórico
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="font-game text-xs text-muted-foreground">Data & Hora</TableHead>
                    <TableHead className="font-game text-xs text-muted-foreground">Investido</TableHead>
                    <TableHead className="font-game text-xs text-muted-foreground hidden md:table-cell">Odds</TableHead>
                    <TableHead className="font-game text-xs text-muted-foreground hidden lg:table-cell">Distribuição</TableHead>
                    <TableHead className="font-game text-xs text-muted-foreground">Retorno</TableHead>
                    <TableHead className="font-game text-xs text-muted-foreground">Resultado</TableHead>
                    <TableHead className="font-game text-xs text-muted-foreground min-w-[200px]">Observação</TableHead>
                    <TableHead className="font-game text-xs text-muted-foreground w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={cn(
                        "border-border/30 transition-colors",
                        deletingId === entry.id && "opacity-50",
                        "animate-fade-in"
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="font-game-body text-sm whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(parseISO(entry.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(entry.created_at), 'HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-game-body font-medium">
                        {formatCurrency(entry.total_invested)}
                      </TableCell>
                      <TableCell className="font-game-body text-sm hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {entry.odds.map((odd, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs font-game bg-dutching-dark/50 border-dutching-blue/30 text-dutching-blue"
                            >
                              {odd.toFixed(2)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-game-body text-xs hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {entry.stakes.map((stake, i) => (
                            <span key={i} className="text-muted-foreground">
                              {i > 0 && '| '}
                              {formatCurrency(stake)}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-game font-bold text-sm">
                        {formatCurrency(entry.guaranteed_return)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getResultBadge(entry.profit)}
                          <span className={cn(
                            "text-xs font-game-body font-semibold",
                            entry.profit > 0 ? "text-success" : entry.profit < 0 ? "text-destructive" : "text-warning"
                          )}>
                            {entry.profit >= 0 ? '+' : ''}{formatCurrency(entry.profit)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingId === entry.id ? (
                          <div className="flex flex-col gap-2">
                            <Textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              placeholder="Por que você fez essa operação?"
                              className="min-h-[60px] text-sm font-game-body resize-none dutching-input"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveObservation(entry.id)}
                                disabled={savingId === entry.id}
                                className="h-7 px-2 text-success hover:text-success"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-7 px-2 text-muted-foreground"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(entry)}
                            className={cn(
                              "text-left text-sm font-game-body w-full min-h-[40px] p-2 rounded-md",
                              "border border-transparent hover:border-border/50 transition-colors",
                              "focus:outline-none focus:border-dutching-blue/50",
                              entry.observation
                                ? "text-foreground"
                                : "text-muted-foreground/50 italic"
                            )}
                          >
                            {entry.observation || 'Clique para adicionar...'}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingId === entry.id}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground/60 font-game-body text-center mt-4 pt-3 border-t border-border/30">
              Use as observações para aprender com seus próprios padrões.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
