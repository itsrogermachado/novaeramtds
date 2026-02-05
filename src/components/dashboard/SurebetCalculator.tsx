import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calculator, TrendingUp, Settings, Gift, ChevronDown, Lock, DollarSign, Percent, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useDutchingHistory } from '@/hooks/useDutchingHistory';
import { DutchingHistoryTable } from './DutchingHistoryTable';

interface HouseData {
  id: number;
  odd: string;
  stake: string;
  isFixed: boolean;
  // Configurações avançadas
  increasePercent: string;
  commissionPercent: string;
  cashbackValue: string;
  isFreebet: boolean;
  // Resultado
  profit: number;
  roi: number;
}

const createEmptyHouse = (id: number): HouseData => ({
  id,
  odd: '2',
  stake: '100',
  isFixed: false,
  increasePercent: '',
  commissionPercent: '',
  cashbackValue: '',
  isFreebet: false,
  profit: 0,
  roi: 0,
});

export function SurebetCalculator() {
  const [numberOfHouses, setNumberOfHouses] = useState(2);
  const [houses, setHouses] = useState<HouseData[]>([
    createEmptyHouse(1),
    createEmptyHouse(2),
  ]);
  const [expandedConfigs, setExpandedConfigs] = useState<Set<number>>(new Set());
  const [copiedText, setCopiedText] = useState(false);
  
  const { toast } = useToast();
  const { history, isLoading: historyLoading, createEntry, updateObservation, deleteEntry } = useDutchingHistory();

  // Atualiza o número de casas
  const handleHouseCountChange = (value: string) => {
    const count = parseInt(value);
    setNumberOfHouses(count);
    
    if (count > houses.length) {
      const newHouses = [...houses];
      for (let i = houses.length; i < count; i++) {
        newHouses.push(createEmptyHouse(i + 1));
      }
      setHouses(newHouses);
    } else if (count < houses.length) {
      setHouses(houses.slice(0, count));
    }
  };

  // Atualiza dados de uma casa
  const updateHouse = useCallback((id: number, field: keyof HouseData, value: string | boolean) => {
    setHouses(prev => prev.map(house => 
      house.id === id ? { ...house, [field]: value } : house
    ));
  }, []);

  // Toggle configurações
  const toggleConfig = (id: number) => {
    setExpandedConfigs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Fixa stake de uma casa e recalcula as outras
  const fixStake = (houseId: number) => {
    setHouses(prev => prev.map(house => ({
      ...house,
      isFixed: house.id === houseId,
    })));
    calculateStakes(houseId);
  };

  // Calcula stakes proporcionais para garantir lucro igual
  const calculateStakes = (fixedHouseId?: number) => {
    const validHouses = houses.filter(h => parseFloat(h.odd) > 1);
    if (validHouses.length < 2) return;

    const fixedHouse = fixedHouseId 
      ? houses.find(h => h.id === fixedHouseId)
      : houses.find(h => h.isFixed) || houses[0];
    
    if (!fixedHouse) return;

    const fixedStake = parseFloat(fixedHouse.stake) || 0;
    const fixedOdd = parseFloat(fixedHouse.odd) || 2;
    
    if (fixedStake <= 0) return;

    // O retorno alvo é o que a casa fixa retornaria
    const targetReturn = fixedStake * fixedOdd;

    setHouses(prev => prev.map(house => {
      if (house.id === fixedHouse.id) {
        return { ...house, isFixed: true };
      }
      
      const odd = parseFloat(house.odd) || 2;
      // Stake necessária para atingir o mesmo retorno
      const calculatedStake = targetReturn / odd;
      
      return {
        ...house,
        stake: calculatedStake.toFixed(2),
        isFixed: false,
      };
    }));
  };

  // Resultados calculados
  const results = useMemo(() => {
    const validHouses = houses.filter(h => 
      parseFloat(h.odd) > 1 && parseFloat(h.stake) > 0
    );

    if (validHouses.length < 2) {
      return {
        totalStake: 0,
        houseProfits: houses.map(() => ({ profit: 0, roi: 0 })),
        overallRoi: 0,
        isSurebet: false,
      };
    }

    const totalStake = validHouses.reduce((sum, h) => sum + parseFloat(h.stake), 0);

    // Calcula o investimento real (freebets não são desembolsadas)
    const realInvestment = validHouses.reduce((sum, h) => {
      const stake = parseFloat(h.stake) || 0;
      return sum + (h.isFreebet ? 0 : stake);
    }, 0);

    const houseProfits = houses.map(house => {
      const odd = parseFloat(house.odd) || 0;
      const stake = parseFloat(house.stake) || 0;
      const increasePercent = parseFloat(house.increasePercent) || 0;
      const commissionPercent = parseFloat(house.commissionPercent) || 0;
      const cashbackValue = parseFloat(house.cashbackValue) || 0;
      
      if (odd <= 1 || stake <= 0) {
        return { profit: 0, roi: 0 };
      }
      
      // Odd efetiva com aumento
      const effectiveOdd = odd * (1 + increasePercent / 100);
      
      // Retorno bruto quando esta casa vence
      let grossReturn: number;
      if (house.isFreebet) {
        // Freebet: retorna (odd - 1) * stake, pois a stake não é devolvida
        grossReturn = stake * (effectiveOdd - 1);
      } else {
        // Normal: retorna odd * stake
        grossReturn = stake * effectiveOdd;
      }
      
      // Comissão sobre o lucro líquido da aposta (não sobre o total)
      const betProfit = house.isFreebet ? grossReturn : grossReturn - stake;
      const commission = betProfit > 0 ? betProfit * (commissionPercent / 100) : 0;
      
      // Lucro líquido: retorno - investimento real + cashback - comissão
      // Quando esta casa vence, recebemos o retorno mas perdemos o investimento real
      const profit = grossReturn - realInvestment + cashbackValue - commission;
      const roi = realInvestment > 0 ? (profit / realInvestment) * 100 : 0;

      return { profit, roi };
    });

    // Verifica se é surebet (todos os resultados têm lucro positivo)
    const validProfits = houseProfits.filter((_, i) => {
      const h = houses[i];
      return parseFloat(h.odd) > 1 && parseFloat(h.stake) > 0;
    });
    const isSurebet = validProfits.length >= 2 && validProfits.every(hp => hp.profit >= 0) && validProfits.some(hp => hp.profit > 0);
    
    // ROI médio (considerando o cenário com menor lucro)
    const minProfit = validProfits.length > 0 ? Math.min(...validProfits.map(hp => hp.profit)) : 0;
    const overallRoi = realInvestment > 0 ? (minProfit / realInvestment) * 100 : 0;

    return {
      totalStake,
      realInvestment,
      houseProfits,
      overallRoi,
      isSurebet,
    };
  }, [houses]);

  // Salvar no histórico
  const saveToHistory = async () => {
    const validHouses = houses.filter(h => 
      parseFloat(h.odd) > 1 && parseFloat(h.stake) > 0
    );

    if (validHouses.length < 2) {
      toast({
        title: 'Dados insuficientes',
        description: 'Preencha pelo menos 2 casas com odds e stakes válidos.',
        variant: 'destructive',
      });
      return;
    }

    const validProfits = results.houseProfits.filter((_, i) => {
      const h = houses[i];
      return parseFloat(h.odd) > 1 && parseFloat(h.stake) > 0;
    });
    const minProfit = validProfits.length > 0 ? Math.min(...validProfits.map(hp => hp.profit)) : 0;
    
    const { error } = await createEntry({
      total_invested: results.realInvestment,
      odds: validHouses.map(h => parseFloat(h.odd)),
      stakes: validHouses.map(h => parseFloat(h.stake)),
      guaranteed_return: results.realInvestment + minProfit,
      profit: minProfit,
      roi: results.overallRoi,
    });

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar no histórico.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Salvo!',
        description: 'Operação adicionada ao histórico.',
      });
    }
  };

  // Copiar como texto
  const copyAsText = () => {
    const validHouses = houses.filter(h => 
      parseFloat(h.odd) > 1 && parseFloat(h.stake) > 0
    );

    let text = '📊 Surebet\n\n';
    validHouses.forEach((house, index) => {
      const profit = results.houseProfits[houses.indexOf(house)];
      const freebetMark = house.isFreebet ? ' [FB]' : '';
      text += `Casa ${index + 1}${freebetMark}: Odd ${house.odd} | Stake R$ ${house.stake} | Lucro: R$ ${profit.profit.toFixed(2)}\n`;
    });
    text += `\n💰 Investimento: R$ ${results.realInvestment.toFixed(2)}`;
    text += `\n📈 ROI: ${results.overallRoi.toFixed(2)}%`;
    text += `\n📈 ROI: ${results.overallRoi.toFixed(2)}%`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    toast({ title: 'Copiado!' });
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Calculadora de Surebet</h2>
            <p className="text-sm text-muted-foreground">
              Calcule stakes e lucros da sua arbitragem
            </p>
          </div>
        </div>
      </div>

      {/* Seletor de número de casas */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Número de Casas
        </Label>
        <Select value={numberOfHouses.toString()} onValueChange={handleHouseCountChange}>
          <SelectTrigger className="w-full bg-muted/50 border-border/50 h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <SelectItem key={n} value={n.toString()}>
                {n} casas
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards das Casas */}
      <div className={cn(
        "grid gap-4",
        numberOfHouses <= 2 ? "md:grid-cols-2" : 
        numberOfHouses <= 3 ? "md:grid-cols-3" : 
        "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      )}>
        {houses.map((house, index) => {
          const houseProfit = results.houseProfits[index];
          const isProfitable = houseProfit.profit > 0;
          const isLoss = houseProfit.profit < 0;
          
          return (
            <Card 
              key={house.id} 
              className={cn(
                "transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/50",
                house.isFixed && "ring-2 ring-primary shadow-lg shadow-primary/10"
              )}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="text-primary font-bold">Casa {index + 1}</span>
                  {house.isFixed && (
                    <Badge className="gap-1 bg-primary/20 text-primary border-primary/30">
                      <Lock className="h-3 w-3" />
                      Fixada
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Odd */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Odd</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={house.odd}
                    onChange={(e) => updateHouse(house.id, 'odd', e.target.value)}
                    className="h-12 text-lg font-semibold bg-muted/50 border-border/50 focus:border-primary"
                    placeholder="2.00"
                  />
                </div>

                {/* Stake */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Stake</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={house.stake}
                        onChange={(e) => updateHouse(house.id, 'stake', e.target.value)}
                        className="h-12 pl-10 text-lg font-semibold bg-muted/50 border-border/50 focus:border-primary"
                        placeholder="100.00"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 bg-primary/20 border-primary/30 hover:bg-primary/30 text-primary font-bold"
                      onClick={() => {
                        const currentStake = parseFloat(house.stake) || 0;
                        updateHouse(house.id, 'stake', (currentStake * 2).toString());
                      }}
                      title="Banca (dobrar stake)"
                    >
                      B
                    </Button>
                  </div>
                </div>

                {/* Configurações */}
                <Collapsible 
                  open={expandedConfigs.has(house.id)}
                  onOpenChange={() => toggleConfig(house.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-between text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                    >
                      <span className="flex items-center gap-2">
                        <div className="p-1 rounded bg-muted">
                          <Settings className="h-3 w-3" />
                        </div>
                        CONFIGURAÇÕES
                      </span>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        expandedConfigs.has(house.id) && "rotate-180"
                      )} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-3 animate-in slide-in-from-top-2">
                    {/* Aumento % */}
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <Label className="text-xs flex-1 text-muted-foreground">Aumento (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={house.increasePercent}
                        onChange={(e) => updateHouse(house.id, 'increasePercent', e.target.value)}
                        className="w-24 h-9 text-sm bg-muted/50 border-border/50"
                        placeholder="0"
                      />
                    </div>
                    
                    {/* Comissão % */}
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <Label className="text-xs flex-1 text-muted-foreground">Comissão (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={house.commissionPercent}
                        onChange={(e) => updateHouse(house.id, 'commissionPercent', e.target.value)}
                        className="w-24 h-9 text-sm bg-muted/50 border-border/50"
                        placeholder="0"
                      />
                    </div>
                    
                    {/* Cashback */}
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <Label className="text-xs flex-1 text-muted-foreground">Cashback (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={house.cashbackValue}
                        onChange={(e) => updateHouse(house.id, 'cashbackValue', e.target.value)}
                        className="w-24 h-9 text-sm bg-muted/50 border-border/50"
                        placeholder="0"
                      />
                    </div>
                    
                    {/* Freebet */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <Label className="text-xs flex items-center gap-2 text-muted-foreground">
                        <Gift className="h-3 w-3 text-primary" />
                        Freebet
                      </Label>
                      <Switch
                        checked={house.isFreebet}
                        onCheckedChange={(checked) => updateHouse(house.id, 'isFreebet', checked)}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Resultado */}
                <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    RESULTADO
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Lucro
                    </span>
                    <span className={cn(
                      "font-bold text-lg",
                      isProfitable && "text-success",
                      isLoss && "text-destructive",
                      !isProfitable && !isLoss && "text-primary"
                    )}>
                      {formatCurrency(houseProfit.profit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      ROI
                    </span>
                    <span className={cn(
                      "font-semibold",
                      isProfitable && "text-success",
                      isLoss && "text-destructive",
                      !isProfitable && !isLoss && "text-primary"
                    )}>
                      {houseProfit.roi.toFixed(4)}%
                    </span>
                  </div>
                </div>

                {/* Botão Fixar Stake */}
                <Button
                  variant={house.isFixed ? "default" : "outline"}
                  className={cn(
                    "w-full h-11 font-semibold transition-all",
                    house.isFixed 
                      ? "bg-primary hover:bg-primary/90" 
                      : "border-primary/50 text-primary hover:bg-primary/10"
                  )}
                  onClick={() => fixStake(house.id)}
                >
                  {house.isFixed ? 'Stake Fixa' : 'Fixar Stake'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumo Geral */}
      <Card className={cn(
        "transition-all bg-card/50 backdrop-blur-sm border-border/50",
        results.isSurebet && "ring-2 ring-success/30 shadow-lg shadow-success/10"
      )}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-lg font-bold">Resumo Geral</span>
              <p className="text-xs text-muted-foreground font-normal">Análise completa da surebet</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Investimento Real
              </p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(results.realInvestment)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {results.totalStake !== results.realInvestment 
                  ? `Stakes: ${formatCurrency(results.totalStake)}` 
                  : 'Valor desembolsado'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Percent className="h-3 w-3" />
                ROI
              </p>
              <p className={cn(
                "text-2xl font-bold",
                results.overallRoi >= 0 ? "text-success" : "text-destructive"
              )}>
                {results.overallRoi.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Retorno sobre investimento</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Lucro Garantido
              </p>
              <p className={cn(
                "text-2xl font-bold",
                results.overallRoi >= 0 ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(
                  houses.some(h => parseFloat(h.odd) > 1 && parseFloat(h.stake) > 0)
                    ? Math.min(...results.houseProfits.filter((_, i) => parseFloat(houses[i].odd) > 1 && parseFloat(houses[i].stake) > 0).map(hp => hp.profit))
                    : 0
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Mínimo garantido</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30 flex flex-col items-center justify-center">
              <p className="text-xs text-muted-foreground mb-2">Status</p>
              <Badge 
                variant={results.isSurebet ? "default" : "destructive"}
                className={cn(
                  "text-sm px-4 py-1",
                  results.isSurebet && "bg-success hover:bg-success/90 shadow-lg shadow-success/30"
                )}
              >
                {results.isSurebet ? '✓ Surebet' : '✗ Sem Lucro'}
              </Badge>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={saveToHistory} className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90">
              <TrendingUp className="h-4 w-4" />
              Adicionar à Planilha
            </Button>
            <Button variant="outline" onClick={copyAsText} className="gap-2 h-11 border-border/50 hover:bg-muted/50">
              {copiedText ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedText ? 'Copiado!' : 'Compartilhar Texto'}
            </Button>
          </div>

          {/* Lucro por Casa */}
          <div className="pt-4 border-t border-border/30">
            <h4 className="font-semibold mb-4 text-sm text-muted-foreground">Lucro por Casa</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {houses.map((house, index) => {
                const houseProfit = results.houseProfits[index];
                const isProfitable = houseProfit.profit >= 0;
                
                return (
                  <div 
                    key={house.id}
                    className={cn(
                      "p-4 rounded-xl border text-center transition-all",
                      isProfitable 
                        ? "bg-success/5 border-success/20 hover:border-success/40" 
                        : "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
                    )}
                  >
                    <p className="text-xs text-muted-foreground mb-1">Casa {index + 1}</p>
                    <p className="text-lg font-bold text-primary">{house.odd}</p>
                    <p className={cn(
                      "font-bold text-lg",
                      isProfitable ? "text-success" : "text-destructive"
                    )}>
                      {formatCurrency(houseProfit.profit)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      <DutchingHistoryTable
        history={history}
        isLoading={historyLoading}
        onUpdateObservation={handleUpdateObservation}
        onDelete={handleDelete}
      />
    </div>
  );
}
