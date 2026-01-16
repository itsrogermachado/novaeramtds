import { useMemo } from 'react';
import { UserProfile } from '@/hooks/useAllUsers';
import { Operation } from '@/hooks/useOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';

interface AdminIndividualTabProps {
  users: UserProfile[];
  allOperations: Operation[];
  isLoading: boolean;
}

export function AdminIndividualTab({
  users,
  allOperations,
  isLoading,
}: AdminIndividualTabProps) {
  const usersProfits = useMemo(() => {
    return users
      .map(user => {
        const userOps = allOperations.filter(op => op.user_id === user.id);
        const invested = userOps.reduce((sum, op) => sum + Number(op.invested_amount), 0);
        const returned = userOps.reduce((sum, op) => sum + Number(op.return_amount), 0);
        const profit = returned - invested;

        return {
          ...user,
          profit,
          operationsCount: userOps.length,
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [users, allOperations]);

  const totalProfit = useMemo(() => {
    return usersProfits.reduce((sum, user) => sum + user.profit, 0);
  }, [usersProfits]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Lucro por Usuário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead className="text-center">Operações</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersProfits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              usersProfits.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.full_name || 'Sem nome'}</span>
                      {user.role === 'admin' && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {user.operationsCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {user.profit >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span
                        className={
                          user.profit >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'
                        }
                      >
                        {formatCurrency(user.profit)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-semibold">
                Total
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={
                    totalProfit >= 0
                      ? 'text-success font-semibold'
                      : 'text-destructive font-semibold'
                  }
                >
                  {formatCurrency(totalProfit)}
                </span>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
