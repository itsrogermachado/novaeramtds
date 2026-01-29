import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, Target, TrendingUp, Sparkles, Zap, Trophy, Brain, PlusCircle, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDutchingHistory } from '@/hooks/useDutchingHistory';
import { DutchingHistoryTable } from './DutchingHistoryTable';
import { useToast } from '@/hooks/use-toast';

interface OddInput {
  id: number;
  value: string;
}

interface CalculationResult {
  stakes: { odd: number; stake: number; percentage: number }[];
  totalStake: number;
  guaranteedReturn: number;
  profit: number;
  roi: number;
}

export function DutchingCalculator() {
  const [totalStake, setTotalStake] = useState<string>('100');
  const [odds, setOdds] = useState<OddInput[]>([
    { id: 1, value: '' },
    { id: 2, value: '' },
  ]);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const { history, isLoading: historyLoading, createEntry, updateObservation, deleteEntry } = useDutchingHistory();
  const { toast } = useToast();

  const addOdd = () => {
    if (odds.length < 6) {
      setOdds([...odds, { id: Date.now(), value: '' }]);
    }
  };

  const removeOdd = (id: number) => {
    if (odds.length > 2) {
      setOdds(odds.filter(odd => odd.id !== id));
    }
  };

  const updateOdd = (id: number, value: string) => {
    setOdds(odds.map(odd => odd.id === id ? { ...odd, value } : odd));
    setResult(null);
    setHasCalculated(false);
  };

  const validOdds = useMemo(() => {
    return odds
      .map(o => parseFloat(o.value))
      .filter(o => !isNaN(o) && o > 1);
  }, [odds]);

  const canCalculate = validOdds.length >= 2 && parseFloat(totalStake) > 0;

  const calculateDutching = async () => {
    if (!canCalculate) return;

    setIsCalculating(true);
    
    // Simulate calculation delay for animation effect
    await new Promise(resolve => setTimeout(resolve, 600));

    const total = parseFloat(totalStake);
    
    // Calculate sum of (1/odd) for all odds
    const sumInverseOdds = validOdds.reduce((sum, odd) => sum + (1 / odd), 0);
    
    // Calculate stake for each odd
    const stakes = validOdds.map(odd => {
      const stake = total * (1 / odd) / sumInverseOdds;
      return {
        odd,
        stake,
        percentage: (stake / total) * 100
      };
    });

    // The return is the same for any winning outcome
    const guaranteedReturn = stakes[0].stake * stakes[0].odd;
    const profit = guaranteedReturn - total;
    const roi = (profit / total) * 100;

    const calcResult: CalculationResult = {
      stakes,
      totalStake: total,
      guaranteedReturn,
      profit,
      roi
    };

    setResult(calcResult);
    setIsCalculating(false);
    setHasCalculated(true);

    // Save to history
    const { error } = await createEntry({
      total_invested: total,
      odds: validOdds,
      stakes: stakes.map(s => s.stake),
      guaranteed_return: guaranteedReturn,
      profit,
      roi,
    });

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar no histórico.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateObservation = async (id: string, observation: string) => {
    const { error } = await updateObservation(id, observation);
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a observação.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteEntry(id);
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a operação.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Operação excluída' });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const isProfitable = result && result.profit > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dutching-orange/10 border border-dutching-orange/20">
          <Brain className="h-5 w-5 text-dutching-orange" />
          <span className="font-game font-bold text-dutching-orange">CALCULADORA DE DUTCHING</span>
          <Sparkles className="h-4 w-4 text-dutching-blue animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground font-game-body max-w-md mx-auto">
          Calcule. Divida. Lucro garantido.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card className="dutching-card overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-game text-lg">
              <Target className="h-5 w-5 text-dutching-blue" />
              Insira as Odds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total Stake Input */}
            <div className="space-y-2">
              <Label htmlFor="total-stake" className="font-game-body font-semibold text-sm">
                Valor Total da Aposta
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                <Input
                  id="total-stake"
                  type="number"
                  value={totalStake}
                  onChange={(e) => {
                    setTotalStake(e.target.value);
                    setResult(null);
                    setHasCalculated(false);
                  }}
                  className="pl-10 dutching-input font-game-body text-lg h-12"
                  placeholder="100"
                />
              </div>
            </div>

            {/* Odds Inputs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-game-body font-semibold text-sm">Odds das Casas</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addOdd}
                  disabled={odds.length >= 6}
                  className="text-dutching-blue hover:text-dutching-blue/80 gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              
              <div className="grid gap-3">
                {odds.map((odd, index) => (
                  <div
                    key={odd.id}
                    className={cn(
                      "relative group animate-scale-in",
                      "transition-all duration-300"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-dutching-dark flex items-center justify-center">
                        <span className="text-dutching-orange font-game font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={odd.value}
                        onChange={(e) => updateOdd(odd.id, e.target.value)}
                        className="dutching-input font-game-body text-base h-11"
                        placeholder={`Odd ${index + 1} (ex: 2.50)`}
                      />
                      {odds.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOdd(odd.id)}
                          className="flex-shrink-0 text-destructive hover:text-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculate Button */}
            <Button
              onClick={calculateDutching}
              disabled={!canCalculate || isCalculating}
              className={cn(
                "w-full h-14 font-game text-base gap-2 transition-all duration-300",
                "dutching-button",
                isCalculating && "animate-pulse"
              )}
            >
              {isCalculating ? (
                <>
                  <Zap className="h-5 w-5 animate-bounce" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5" />
                  Calcular Apostas
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className={cn(
          "dutching-card overflow-hidden transition-all duration-500",
          hasCalculated && "dutching-result-card"
        )}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-game text-lg">
              <TrendingUp className="h-5 w-5 text-dutching-blue" />
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Calculator className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground font-game-body">
                    Insira as odds para calcular
                  </p>
                  <p className="text-xs text-muted-foreground/60 font-game-body">
                    Mínimo de 2 odds necessárias
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in">
                {/* Stakes breakdown */}
                <div className="space-y-3">
                  <p className="text-sm font-game-body font-semibold text-muted-foreground">
                    Distribuição das Apostas
                  </p>
                  {result.stakes.map((stake, index) => (
                    <div
                      key={index}
                      className="space-y-2 animate-slide-up-fade"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-dutching-dark flex items-center justify-center">
                            <span className="text-dutching-orange font-game text-xs font-bold">
                              {index + 1}
                            </span>
                          </div>
                          <span className="font-game-body text-sm">
                            Odd <span className="text-dutching-blue font-bold">{stake.odd.toFixed(2)}</span>
                          </span>
                        </div>
                        <span className="font-game font-bold text-foreground">
                          {formatCurrency(stake.stake)}
                        </span>
                      </div>
                      <Progress
                        value={stake.percentage}
                        className="h-2 bg-muted"
                      />
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-border/50" />

                {/* Summary */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="font-game-body text-sm text-muted-foreground">Retorno Garantido</span>
                    <span className="font-game font-bold text-lg text-foreground">
                      {formatCurrency(result.guaranteedReturn)}
                    </span>
                  </div>

                  {/* Profit Badge */}
                  <div className={cn(
                    "p-4 rounded-xl text-center space-y-2 transition-all duration-500",
                    isProfitable
                      ? "bg-success/10 border border-success/20"
                      : "bg-destructive/10 border border-destructive/20"
                  )}>
                    <div className="flex items-center justify-center gap-2">
                      {isProfitable ? (
                        <Trophy className="h-6 w-6 text-success animate-bounce" />
                      ) : (
                        <TrendingUp className="h-6 w-6 text-destructive rotate-180" />
                      )}
                      <span className={cn(
                        "font-game text-2xl font-bold",
                        isProfitable ? "text-success" : "text-destructive"
                      )}>
                        {formatCurrency(result.profit)}
                      </span>
                    </div>
                    <Badge
                      variant={isProfitable ? "default" : "destructive"}
                      className={cn(
                        "font-game-body",
                        isProfitable && "bg-success text-success-foreground"
                      )}
                    >
                      ROI: {result.roi.toFixed(2)}%
                    </Badge>
                    {isProfitable && (
                      <p className="text-sm font-game-body text-success/80 pt-1">
                        🧠🎯 A matemática venceu de novo.
                      </p>
                    )}
                  </div>

                  {isProfitable && (
                    <div className="text-center animate-fade-in">
                      <p className="text-xs text-muted-foreground font-game-body">
                        Você jogou com as odds — e venceu.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History Section */}
      <DutchingHistoryTable
        history={history}
        isLoading={historyLoading}
        onUpdateObservation={handleUpdateObservation}
        onDelete={handleDelete}
      />

      {/* Info Section */}
      <Card className="dutching-card border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-dutching-blue/10">
              <Sparkles className="h-4 w-4 text-dutching-blue" />
            </div>
            <div className="space-y-1">
              <p className="font-game-body font-semibold text-sm">O que é Dutching?</p>
              <p className="text-xs text-muted-foreground font-game-body leading-relaxed">
                Dutching é uma técnica de apostas que distribui seu valor total entre múltiplas seleções, 
                garantindo o mesmo retorno independentemente de qual opção vencer. 
                Ideal para surebets e arbitragem esportiva.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
