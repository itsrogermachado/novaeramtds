import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TeamMember {
  id: string;
  manager_id: string;
  operator_id: string;
  nickname: string | null;
  team_name: string;
  created_at: string;
  operator_profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface TeamOperatorStats {
  operator_id: string;
  nickname: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  total_operations: number;
  total_invested: number;
  total_return: number;
  total_profit: number;
  total_expenses: number;
  net_profit: number;
}

export interface MyTeamInfo {
  manager_id: string;
  manager_profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  team_name: string;
  teammates: {
    id: string;
    nickname: string | null;
    full_name: string | null;
    avatar_url: string | null;
  }[];
}

export function useTeam() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [myTeamInfo, setMyTeamInfo] = useState<MyTeamInfo | null>(null);
  const [teamStats, setTeamStats] = useState<TeamOperatorStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [teamName, setTeamNameState] = useState('Meu Time');

// Fetch team info from dedicated teams table
  const fetchTeamInfo = useCallback(async () => {
    if (!user) return;

    // Fetch or create team for manager
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('name')
      .eq('manager_id', user.id)
      .maybeSingle();

    if (teamError) {
      console.error('Error fetching team:', teamError);
    }

    if (team) {
      setTeamNameState(team.name);
    } else {
      // Create team row if it doesn't exist (first time manager)
      const { error: insertError } = await supabase
        .from('teams')
        .insert({ manager_id: user.id, name: 'Meu Time' });
      if (!insertError) {
        setTeamNameState('Meu Time');
      }
    }
  }, [user]);

  // Fetch team members (as manager)
  const fetchTeamMembers = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('manager_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching team members:', error);
      return;
    }

    // Fetch operator profiles
    const operatorIds = data?.map(m => m.operator_id) || [];
    if (operatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', operatorIds);

      const membersWithProfiles = data?.map(member => ({
        ...member,
        operator_profile: profiles?.find(p => p.id === member.operator_id) || undefined,
      })) || [];

      setTeamMembers(membersWithProfiles);
    } else {
      setTeamMembers([]);
    }
  }, [user]);

  // Fetch info about the team I belong to (as operator)
  const fetchMyTeamInfo = useCallback(async () => {
    if (!user) return;

    // Check if I'm an operator in any team
    const { data: membership, error } = await supabase
      .from('team_members')
      .select('manager_id')
      .eq('operator_id', user.id)
      .maybeSingle();

    if (error || !membership) {
      setMyTeamInfo(null);
      return;
    }

    // Get team name from teams table
    const { data: teamData } = await supabase
      .from('teams')
      .select('name')
      .eq('manager_id', membership.manager_id)
      .maybeSingle();

    // Get manager profile
    const { data: managerProfile } = await supabase
      .from('profiles')
      .select('full_name, email, avatar_url')
      .eq('id', membership.manager_id)
      .single();

    // Get all teammates (other operators in the same team)
    const { data: teammates } = await supabase
      .from('team_members')
      .select('operator_id, nickname')
      .eq('manager_id', membership.manager_id);

    // Get teammate profiles
    const teammateIds = teammates?.map(t => t.operator_id).filter(id => id !== user.id) || [];
    let teammateProfiles: { id: string; full_name: string | null; avatar_url: string | null }[] = [];
    
    if (teammateIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', teammateIds);
      teammateProfiles = profiles || [];
    }

    setMyTeamInfo({
      manager_id: membership.manager_id,
      manager_profile: managerProfile || undefined,
      team_name: teamData?.name || 'Meu Time',
      teammates: teammates
        ?.filter(t => t.operator_id !== user.id)
        .map(t => {
          const profile = teammateProfiles.find(p => p.id === t.operator_id);
          return {
            id: t.operator_id,
            nickname: t.nickname,
            full_name: profile?.full_name || null,
            avatar_url: profile?.avatar_url || null,
          };
        }) || [],
    });
  }, [user]);

  // Fetch team statistics (for managers)
  const fetchTeamStats = useCallback(async () => {
    if (!user || teamMembers.length === 0) {
      setTeamStats([]);
      return;
    }

    setIsLoadingStats(true);
    const stats: TeamOperatorStats[] = [];

    for (const member of teamMembers) {
      // Fetch operations
      const { data: operations } = await supabase
        .from('operations')
        .select('invested_amount, return_amount')
        .eq('user_id', member.operator_id);

      // Fetch expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', member.operator_id);

      const totalOperations = operations?.length || 0;
      const totalInvested = operations?.reduce((sum, op) => sum + Number(op.invested_amount), 0) || 0;
      const totalReturn = operations?.reduce((sum, op) => sum + Number(op.return_amount), 0) || 0;
      const totalProfit = totalReturn - totalInvested;
      const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const netProfit = totalProfit - totalExpenses;

      stats.push({
        operator_id: member.operator_id,
        nickname: member.nickname,
        full_name: member.operator_profile?.full_name || null,
        email: member.operator_profile?.email || null,
        avatar_url: member.operator_profile?.avatar_url || null,
        total_operations: totalOperations,
        total_invested: totalInvested,
        total_return: totalReturn,
        total_profit: totalProfit,
        total_expenses: totalExpenses,
        net_profit: netProfit,
      });
    }

    setTeamStats(stats);
    setIsLoadingStats(false);
  }, [user, teamMembers]);

  // Create operator account (manager only)
  const createOperator = async (data: {
    email: string;
    password: string;
    fullName: string;
    nickname?: string;
  }) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { data: resData, error: resError } = await supabase.functions.invoke('create-team-operator', {
        body: {
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          nickname: data.nickname,
        },
      });

      // When the backend returns non-2xx, supabase-js often surfaces a generic error message.
      // Prefer showing the backend's JSON error when present.
      const serverMsg = (resData as any)?.error as string | undefined;
      if (serverMsg) {
        toast.error(serverMsg);
        return { error: serverMsg };
      }

      if (resError) {
        const msg = resError.message || 'Erro ao criar operador';
        toast.error(msg);
        return { error: msg };
      }

      toast.success('Operador criado com sucesso!');
      await fetchTeamMembers();
      return { error: null, operator: (resData as any)?.operator };
    } catch (error: any) {
      console.error('Error creating operator:', error);
      const msg = error?.message || 'Erro ao criar operador';
      toast.error(msg);
      return { error: msg };
    }
  };

  // Remove team member
  const removeTeamMember = async (memberId: string) => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error removing member:', error);
      toast.error('Erro ao remover membro');
      return;
    }

    toast.success('Membro removido do time.');
    await fetchTeamMembers();
  };

  // Update nickname
  const updateNickname = async (memberId: string, nickname: string) => {
    const { error } = await supabase
      .from('team_members')
      .update({ nickname })
      .eq('id', memberId);

    if (error) {
      console.error('Error updating nickname:', error);
      toast.error('Erro ao atualizar apelido');
      return;
    }

    toast.success('Apelido atualizado!');
    await fetchTeamMembers();
  };

  // Update team name in dedicated teams table
  const updateTeamName = async (newName: string) => {
    if (!user) return;

    // Upsert: update if exists, insert if not
    const { error } = await supabase
      .from('teams')
      .upsert(
        { manager_id: user.id, name: newName },
        { onConflict: 'manager_id' }
      );

    if (error) {
      console.error('Error updating team name:', error);
      toast.error('Erro ao atualizar nome do time');
      return;
    }

    setTeamNameState(newName);
    toast.success('Nome do time atualizado!');
  };

  // Initial fetch
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([fetchTeamInfo(), fetchTeamMembers(), fetchMyTeamInfo()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [user, fetchTeamInfo, fetchTeamMembers, fetchMyTeamInfo]);

  // Fetch stats when team members change
  useEffect(() => {
    if (teamMembers.length > 0) {
      fetchTeamStats();
    } else {
      setTeamStats([]);
    }
  }, [teamMembers, fetchTeamStats]);

  // Calculate totals
  const teamTotals = {
    totalOperations: teamStats.reduce((sum, s) => sum + s.total_operations, 0),
    totalInvested: teamStats.reduce((sum, s) => sum + s.total_invested, 0),
    totalReturn: teamStats.reduce((sum, s) => sum + s.total_return, 0),
    totalProfit: teamStats.reduce((sum, s) => sum + s.total_profit, 0),
    totalExpenses: teamStats.reduce((sum, s) => sum + s.total_expenses, 0),
    netProfit: teamStats.reduce((sum, s) => sum + s.net_profit, 0),
  };

  return {
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
    refetch: () => Promise.all([fetchTeamInfo(), fetchTeamMembers(), fetchMyTeamInfo()]),
  };
}
