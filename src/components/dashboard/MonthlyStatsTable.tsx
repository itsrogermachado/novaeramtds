import { MonthlyData } from '@/hooks/useMonthlyComparison';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MonthlyStatsTableProps {
  data: MonthlyData[];
}

export function MonthlyStatsTable({ data }: MonthlyStatsTableProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatVariation = (variation: number | null) => {
    if (variation === null) return '-';
    const sign = variation >= 0 ? '+' : '';
    return `${sign}${variation.toFixed(1)}%`;
  };

  const VariationIcon = ({ variation }: { variation: number | null }) => {
    if (variation === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (variation > 0) return <TrendingUp className="h-4 w-4 text-success" />;
    if (variation < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 shadow-elegant">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Detalhamento Mensal</h3>
        <p className="text-muted-foreground text-center py-8">Nenhum dado no período</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-elegant">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Detalhamento Mensal</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Operações</TableHead>
              <TableHead className="text-right">Investido</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
              <TableHead className="text-right">Gastos</TableHead>
              <TableHead className="text-right">Balanço</TableHead>
              <TableHead className="text-right">Variação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-medium capitalize">{row.displayMonth}</TableCell>
                <TableCell className="text-right">{row.operationsCount}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.totalInvested)}</TableCell>
                <TableCell className={`text-right ${row.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(row.profit)}
                </TableCell>
                <TableCell className="text-right text-destructive">
                  {formatCurrency(row.totalExpenses)}
                </TableCell>
                <TableCell className={`text-right font-semibold ${row.netBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(row.netBalance)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <VariationIcon variation={row.profitVariation} />
                    <span className={
                      row.profitVariation === null ? 'text-muted-foreground' :
                      row.profitVariation >= 0 ? 'text-success' : 'text-destructive'
                    }>
                      {formatVariation(row.profitVariation)}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
