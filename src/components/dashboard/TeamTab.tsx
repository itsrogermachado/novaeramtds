import { useState } from 'react';
import { useTeam, TeamOperatorStats } from '@/hooks/useTeam';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  UserPlus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  BarChart3,
  Mail,
  Check,
  X,
  Trash2,
  Edit2,
  RefreshCw,
  Clock,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function TeamTab() {
  const {
    teamMembers,
    pendingInvites,
    teamStats,
    teamTotals,
    isLoading,
    isLoadingStats,
    inviteOperator,
    acceptInvite,
    declineInvite,
    removeTeamMember,
    updateNickname,
    refetch,
  } = useTeam();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNickname, setInviteNickname] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState('');

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    setIsInviting(true);
    const result = await inviteOperator(inviteEmail, inviteNickname || undefined);
    setIsInviting(false);

    if (!result.error) {
      setInviteEmail('');
      setInviteNickname('');
      setInviteDialogOpen(false);
    }
  };

  const handleUpdateNickname = async (memberId: string) => {
    await updateNickname(memberId, editNickname);
    setEditingMember(null);
    setEditNickname('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || 'U';
  };

  const activeMembers = teamMembers.filter(m => m.status === 'active');
  const pendingMembers = teamMembers.filter(m => m.status === 'pending');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Invites Received */}
      {pendingInvites.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-yellow-500" />
              Convites Pendentes
            </CardTitle>
            <CardDescription>
              Você foi convidado para fazer parte de um time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-card border"
                >
                  <div>
                    <p className="font-medium">
                      {invite.manager_profile?.full_name || 'Gestor'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {invite.manager_profile?.email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptInvite(invite.id)}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => declineInvite(invite.id)}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Recusar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header with stats summary */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Meu Time
          </h2>
          <p className="text-muted-foreground">
            {activeMembers.length} operador{activeMembers.length !== 1 ? 'es' : ''} ativo{activeMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar Operador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Operador</DialogTitle>
                <DialogDescription>
                  Envie um convite para um usuário cadastrado se juntar ao seu time.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email do operador</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="operador@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">Apelido (opcional)</Label>
                  <Input
                    id="nickname"
                    placeholder="Ex: João - Conta Principal"
                    value={inviteNickname}
                    onChange={(e) => setInviteNickname(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
                  {isInviting ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Team Totals */}
      {activeMembers.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs">Operações</span>
              </div>
              <p className="text-2xl font-bold">{teamTotals.totalOperations}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Investido</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(teamTotals.totalInvested)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Retorno</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(teamTotals.totalReturn)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs">Lucro Bruto</span>
              </div>
              <p className={cn("text-2xl font-bold", teamTotals.totalProfit >= 0 ? "text-green-500" : "text-red-500")}>
                {formatCurrency(teamTotals.totalProfit)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Receipt className="h-4 w-4 text-orange-500" />
                <span className="text-xs">Gastos</span>
              </div>
              <p className="text-2xl font-bold text-orange-500">
                {formatCurrency(teamTotals.totalExpenses)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs">Lucro Líquido</span>
              </div>
              <p className={cn("text-2xl font-bold", teamTotals.netProfit >= 0 ? "text-primary" : "text-red-500")}>
                {formatCurrency(teamTotals.netProfit)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Members */}
      {pendingMembers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Convites Enviados
              <Badge variant="secondary">{pendingMembers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.operator_profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.operator_profile?.full_name || null, member.operator_profile?.email || null)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.nickname || member.operator_profile?.full_name || 'Operador'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.operator_profile?.email} • Aguardando resposta
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar convite?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Isso irá cancelar o convite enviado para este operador.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeTeamMember(member.id)}>
                          Cancelar Convite
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members Stats Table */}
      {activeMembers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Operadores Ativos
            </CardTitle>
            <CardDescription>
              Performance individual de cada operador do seu time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operador</TableHead>
                      <TableHead className="text-right">Operações</TableHead>
                      <TableHead className="text-right">Investido</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                      <TableHead className="text-right">Gastos</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamStats.map((stat) => {
                      const member = teamMembers.find(m => m.operator_id === stat.operator_id);
                      return (
                        <TableRow key={stat.operator_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={stat.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(stat.full_name, stat.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                {editingMember === member?.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={editNickname}
                                      onChange={(e) => setEditNickname(e.target.value)}
                                      className="h-7 w-32"
                                      placeholder="Apelido"
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => handleUpdateNickname(member.id)}
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => setEditingMember(null)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <p className="font-medium text-sm">
                                      {stat.nickname || stat.full_name || 'Operador'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{stat.email}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {stat.total_operations}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(stat.total_invested)}
                          </TableCell>
                          <TableCell className={cn("text-right font-medium", stat.total_profit >= 0 ? "text-green-500" : "text-red-500")}>
                            {formatCurrency(stat.total_profit)}
                          </TableCell>
                          <TableCell className="text-right text-orange-500">
                            {formatCurrency(stat.total_expenses)}
                          </TableCell>
                          <TableCell className={cn("text-right font-bold", stat.net_profit >= 0 ? "text-primary" : "text-red-500")}>
                            {formatCurrency(stat.net_profit)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingMember(member?.id || null);
                                  setEditNickname(stat.nickname || '');
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover do time?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Você não terá mais acesso aos dados deste operador. Essa ação não afeta a conta do operador.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => member && removeTeamMember(member.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remover
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum operador no time</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Convide operadores para fazer parte do seu time e acompanhe a performance de todos em um único lugar.
            </p>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Primeiro Operador
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
