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

    const houseProfits = houses.map(house => {
      const odd = parseFloat(house.odd) || 0;
      const stake = parseFloat(house.stake) || 0;
      const increasePercent = parseFloat(house.increasePercent) || 0;
      const commissionPercent = parseFloat(house.commissionPercent) || 0;
      const cashbackValue = parseFloat(house.cashbackValue) || 0;
      
      // Odd efetiva com aumento
      const effectiveOdd = odd * (1 + increasePercent / 100);
      
      // Retorno bruto
      let grossReturn = stake * effectiveOdd;
      
      // Freebet: stake não é retornada
      if (house.isFreebet) {
        grossReturn = stake * (effectiveOdd - 1);
      }
      
      // Comissão sobre lucro
      const grossProfit = grossReturn - stake;
      const commission = grossProfit > 0 ? grossProfit * (commissionPercent / 100) : 0;
      
      // Lucro líquido: retorno - investimento total + cashback - comissão
      // Quando esta casa vence, perdemos as stakes das outras casas
      const otherStakes = validHouses
        .filter(h => h.id !== house.id)
        .reduce((sum, h) => sum + parseFloat(h.stake), 0);
      
      const profit = grossReturn - totalStake + cashbackValue - commission;
      const roi = totalStake > 0 ? (profit / totalStake) * 100 : 0;

      return { profit, roi };
    });

    // Verifica se é surebet (todos os resultados têm lucro positivo)
    const isSurebet = houseProfits.every(hp => hp.profit >= 0) && houseProfits.some(hp => hp.profit > 0);
    
    // ROI médio (considerando o cenário com menor lucro)
    const minProfit = Math.min(...houseProfits.map(hp => hp.profit));
    const overallRoi = totalStake > 0 ? (minProfit / totalStake) * 100 : 0;

    return {
      totalStake,
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

    const minProfit = Math.min(...results.houseProfits.map(hp => hp.profit));
    
    const { error } = await createEntry({
      total_invested: results.totalStake,
      odds: validHouses.map(h => parseFloat(h.odd)),
      stakes: validHouses.map(h => parseFloat(h.stake)),
      guaranteed_return: results.totalStake + minProfit,
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
      text += `Casa ${index + 1}: Odd ${house.odd} | Stake R$ ${house.stake} | Lucro: R$ ${profit.profit.toFixed(2)}\n`;
    });
    text += `\n💰 Total: R$ ${results.totalStake.toFixed(2)}`;
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
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <Calculator className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">CALCULADORA DE SUREBET</span>
        </div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Calcule stakes e lucros da sua arbitragem
        </p>
      </div>

      {/* Seletor de número de casas */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="house-count" className="font-semibold whitespace-nowrap">
              Número de Casas
            </Label>
            <Select value={numberOfHouses.toString()} onValueChange={handleHouseCountChange}>
              <SelectTrigger className="w-40">
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
        </CardContent>
      </Card>

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
                "transition-all duration-300",
                house.isFixed && "ring-2 ring-primary"
              )}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="text-primary">Casa {index + 1}</span>
                  {house.isFixed && (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Fixada
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Odd */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Odd</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={house.odd}
                    onChange={(e) => updateHouse(house.id, 'odd', e.target.value)}
                    className="h-11 text-lg font-semibold"
                    placeholder="2.00"
                  />
                </div>

                {/* Stake */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Stake</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={house.stake}
                      onChange={(e) => updateHouse(house.id, 'stake', e.target.value)}
                      className="h-11 pl-10 text-lg font-semibold"
                      placeholder="100.00"
                    />
                  </div>
                </div>

                {/* Configurações Avançadas */}
                <Collapsible 
                  open={expandedConfigs.has(house.id)}
                  onOpenChange={() => toggleConfig(house.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Configurações
                      </span>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        expandedConfigs.has(house.id) && "rotate-180"
                      )} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-3">
                    {/* Aumento % */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs flex-1">Aumento (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={house.increasePercent}
                        onChange={(e) => updateHouse(house.id, 'increasePercent', e.target.value)}
                        className="w-20 h-8 text-sm"
                        placeholder="0"
                      />
                    </div>
                    
                    {/* Comissão % */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs flex-1">Comissão (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={house.commissionPercent}
                        onChange={(e) => updateHouse(house.id, 'commissionPercent', e.target.value)}
                        className="w-20 h-8 text-sm"
                        placeholder="0"
                      />
                    </div>
                    
                    {/* Cashback */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs flex-1">Cashback (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={house.cashbackValue}
                        onChange={(e) => updateHouse(house.id, 'cashbackValue', e.target.value)}
                        className="w-20 h-8 text-sm"
                        placeholder="0"
                      />
                    </div>
                    
                    {/* Freebet */}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs flex items-center gap-1">
                        <Gift className="h-3 w-3" />
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
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Lucro
                    </span>
                    <span className={cn(
                      "font-semibold",
                      isProfitable && "text-success",
                      isLoss && "text-destructive"
                    )}>
                      {formatCurrency(houseProfit.profit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      ROI
                    </span>
                    <span className={cn(
                      "font-semibold",
                      isProfitable && "text-success",
                      isLoss && "text-destructive"
                    )}>
                      {houseProfit.roi.toFixed(4)}%
                    </span>
                  </div>
                </div>

                {/* Botão Fixar Stake */}
                <Button
                  variant={house.isFixed ? "secondary" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => fixStake(house.id)}
                >
                  {house.isFixed ? 'Stake Fixada' : 'Fixar Stake'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumo Geral */}
      <Card className={cn(
        "transition-all",
        results.isSurebet && "ring-2 ring-success/50 bg-success/5"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumo Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Stake Total</p>
              <p className="text-xl font-bold">{formatCurrency(results.totalStake)}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">ROI Mínimo</p>
              <p className={cn(
                "text-xl font-bold",
                results.overallRoi >= 0 ? "text-success" : "text-destructive"
              )}>
                {results.overallRoi.toFixed(2)}%
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Lucro Garantido</p>
              <p className={cn(
                "text-xl font-bold",
                results.overallRoi >= 0 ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(Math.min(...results.houseProfits.map(hp => hp.profit)))}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge 
                variant={results.isSurebet ? "default" : "destructive"}
                className={cn(
                  "mt-1",
                  results.isSurebet && "bg-success hover:bg-success/90"
                )}
              >
                {results.isSurebet ? '✓ Surebet' : '✗ Sem Lucro'}
              </Badge>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2 mt-6">
            <Button onClick={saveToHistory} className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Adicionar à Planilha
            </Button>
            <Button variant="outline" onClick={copyAsText} className="gap-2">
              {copiedText ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedText ? 'Copiado!' : 'Compartilhar Texto'}
            </Button>
          </div>

          {/* Lucro por Casa */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-3">Lucro por Casa</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {houses.map((house, index) => {
                const houseProfit = results.houseProfits[index];
                const isProfitable = houseProfit.profit >= 0;
                
                return (
                  <div 
                    key={house.id}
                    className={cn(
                      "p-3 rounded-lg border text-center",
                      isProfitable ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
                    )}
                  >
                    <p className="text-xs text-muted-foreground">Casa {index + 1}</p>
                    <p className="text-sm font-medium">{house.odd}</p>
                    <p className={cn(
                      "font-semibold",
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
