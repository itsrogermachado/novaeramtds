import { useState } from 'react';
import { useTeam } from '@/hooks/useTeam';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DollarSign,
  Receipt,
  BarChart3,
  Check,
  X,
  Trash2,
  Edit2,
  RefreshCw,
  UserCheck,
  Crown,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function TeamTab() {
  const {
    teamMembers,
    myTeamInfo,
    teamStats,
    teamTotals,
    teamName,
    isLoading,
    isLoadingStats,
    createOperator,
    removeTeamMember,
    updateNickname,
    updateTeamName,
    refetch,
  } = useTeam();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOperator, setNewOperator] = useState({
    email: '',
    password: '',
    fullName: '',
    nickname: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [newTeamName, setNewTeamName] = useState(teamName);

  const handleCreateOperator = async () => {
    if (!newOperator.email.trim() || !newOperator.password || !newOperator.fullName.trim()) {
      return;
    }
    
    setIsCreating(true);
    const result = await createOperator({
      email: newOperator.email,
      password: newOperator.password,
      fullName: newOperator.fullName,
      nickname: newOperator.nickname || undefined,
    });
    setIsCreating(false);

    if (!result.error) {
      setNewOperator({ email: '', password: '', fullName: '', nickname: '' });
      setCreateDialogOpen(false);
    }
  };

  const handleUpdateNickname = async (memberId: string) => {
    await updateNickname(memberId, editNickname);
    setEditingMember(null);
    setEditNickname('');
  };

  const handleUpdateTeamName = async () => {
    if (newTeamName.trim() && newTeamName !== teamName) {
      await updateTeamName(newTeamName.trim());
    }
    setEditingTeamName(false);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // If user is an operator (belongs to a team), show team info
  if (myTeamInfo) {
    return (
      <div className="space-y-6">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {myTeamInfo.team_name}
            </CardTitle>
            <CardDescription>
              Você faz parte deste time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manager */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Gestor</p>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={myTeamInfo.manager_profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {getInitials(myTeamInfo.manager_profile?.full_name || null, myTeamInfo.manager_profile?.email || null)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-2">
                    {myTeamInfo.manager_profile?.full_name || 'Gestor'}
                    <Crown className="h-4 w-4 text-yellow-500" />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {myTeamInfo.manager_profile?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Teammates */}
            {myTeamInfo.teammates.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Colegas de time ({myTeamInfo.teammates.length})
                </p>
                <div className="space-y-2">
                  {myTeamInfo.teammates.map((teammate) => (
                    <div key={teammate.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={teammate.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(teammate.full_name, null)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm">
                        {teammate.nickname || teammate.full_name || 'Operador'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Manager view - manage team
  return (
    <div className="space-y-6">
      {/* Header with team name */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {editingTeamName ? (
            <div className="flex items-center gap-2">
              <Input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="h-9 w-48"
                placeholder="Nome do time"
              />
              <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleUpdateTeamName}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditingTeamName(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              {teamName}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  setNewTeamName(teamName);
                  setEditingTeamName(true);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </h2>
          )}
          <p className="text-muted-foreground">
            {teamMembers.length} operador{teamMembers.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Operador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Conta de Operador</DialogTitle>
                <DialogDescription>
                  Crie uma conta para um novo operador do seu time. Você definirá o email e senha de acesso.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo *</Label>
                  <Input
                    id="fullName"
                    placeholder="João da Silva"
                    value={newOperator.fullName}
                    onChange={(e) => setNewOperator(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="operador@email.com"
                    value={newOperator.email}
                    onChange={(e) => setNewOperator(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={newOperator.password}
                      onChange={(e) => setNewOperator(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">Apelido (opcional)</Label>
                  <Input
                    id="nickname"
                    placeholder="Ex: João - Conta Principal"
                    value={newOperator.nickname}
                    onChange={(e) => setNewOperator(prev => ({ ...prev, nickname: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateOperator} 
                  disabled={isCreating || !newOperator.email.trim() || !newOperator.password || !newOperator.fullName.trim()}
                >
                  {isCreating ? 'Criando...' : 'Criar Operador'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Team Totals */}
      {teamMembers.length > 0 && (
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
              <p className={cn("text-2xl font-bold", teamTotals.totalProfit >= 0 ? "text-green-500" : "text-destructive")}>
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
              <p className={cn("text-2xl font-bold", teamTotals.netProfit >= 0 ? "text-primary" : "text-destructive")}>
                {formatCurrency(teamTotals.netProfit)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Members Stats Table */}
      {teamMembers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Operadores
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
                          <TableCell className={cn("text-right font-medium", stat.total_profit >= 0 ? "text-green-500" : "text-destructive")}>
                            {formatCurrency(stat.total_profit)}
                          </TableCell>
                          <TableCell className="text-right text-orange-500">
                            {formatCurrency(stat.total_expenses)}
                          </TableCell>
                          <TableCell className={cn("text-right font-bold", stat.net_profit >= 0 ? "text-primary" : "text-destructive")}>
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
                                      Você não terá mais acesso aos dados deste operador. A conta do operador continuará existindo, mas não estará mais vinculada ao seu time.
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
              Crie contas para seus operadores e acompanhe a performance de todos em um único lugar.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Primeiro Operador
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
