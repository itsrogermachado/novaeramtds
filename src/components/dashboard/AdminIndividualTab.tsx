import { useMemo, useState } from 'react';
import { UserProfile } from '@/hooks/useAllUsers';
import { useUserMemberships } from '@/hooks/useUserMemberships';
import { MembershipTier } from '@/contexts/AuthContext';
import { Operation } from '@/hooks/useOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MembershipBadge } from './MembershipBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, TrendingUp, TrendingDown, Crown, User, Search } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const { memberships, updateMembership, isLoading: membershipsLoading } = useUserMemberships();

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
          membershipTier: memberships.get(user.id) || 'free' as MembershipTier,
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [users, allOperations, memberships]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return usersProfits;
    
    const query = searchQuery.toLowerCase().trim();
    return usersProfits.filter(user => {
      const nameMatch = user.full_name?.toLowerCase().includes(query);
      const emailMatch = user.email?.toLowerCase().includes(query);
      return nameMatch || emailMatch;
    });
  }, [usersProfits, searchQuery]);

  const totalProfit = useMemo(() => {
    return filteredUsers.reduce((sum, user) => sum + user.profit, 0);
  }, [filteredUsers]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleMembershipChange = async (userId: string, tier: MembershipTier) => {
    await updateMembership(userId, tier);
  };

  if (isLoading || membershipsLoading) {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lucro por Usuário
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Plano</TableHead>
              <TableHead className="text-center">Operações</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'Nenhum usuário encontrado com essa busca' : 'Nenhum usuário encontrado'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
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
                  <TableCell className="text-muted-foreground text-sm">
                    {user.email || '-'}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.membershipTier}
                      onValueChange={(value) => handleMembershipChange(user.id, value as MembershipTier)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Membro Free</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="vip">
                          <div className="flex items-center gap-2">
                            <Crown className="h-3.5 w-3.5 text-gold" />
                            <span>Membro VIP</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
              <TableCell colSpan={4} className="font-semibold">
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
