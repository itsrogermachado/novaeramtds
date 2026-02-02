import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TeamMember {
  id: string;
  manager_id: string;
  operator_id: string;
  nickname: string | null;
  status: 'pending' | 'active' | 'declined';
  invited_at: string;
  accepted_at: string | null;
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

export interface TeamInvite {
  id: string;
  manager_id: string;
  manager_profile?: {
    full_name: string | null;
    email: string | null;
  };
  invited_at: string;
}

export function useTeam() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<TeamInvite[]>([]);
  const [teamStats, setTeamStats] = useState<TeamOperatorStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

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
        status: member.status as 'pending' | 'active' | 'declined',
        operator_profile: profiles?.find(p => p.id === member.operator_id) || undefined,
      })) || [];

      setTeamMembers(membersWithProfiles);
    } else {
      setTeamMembers([]);
    }
  }, [user]);

  // Fetch pending invites (as operator)
  const fetchPendingInvites = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('team_members')
      .select('id, manager_id, invited_at')
      .eq('operator_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching invites:', error);
      return;
    }

    // Fetch manager profiles
    const managerIds = data?.map(i => i.manager_id) || [];
    if (managerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', managerIds);

      const invitesWithProfiles = data?.map(invite => ({
        ...invite,
        manager_profile: profiles?.find(p => p.id === invite.manager_id) || undefined,
      })) || [];

      setPendingInvites(invitesWithProfiles);
    } else {
      setPendingInvites([]);
    }
  }, [user]);

  // Fetch team statistics
  const fetchTeamStats = useCallback(async () => {
    if (!user) return;

    setIsLoadingStats(true);

    // Get active team members
    const activeMembers = teamMembers.filter(m => m.status === 'active');
    if (activeMembers.length === 0) {
      setTeamStats([]);
      setIsLoadingStats(false);
      return;
    }

    const operatorIds = activeMembers.map(m => m.operator_id);
    const stats: TeamOperatorStats[] = [];

    for (const member of activeMembers) {
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

  // Invite operator by email
  const inviteOperator = async (email: string, nickname?: string) => {
    if (!user) return { error: 'Usuário não autenticado' };

    // Find user by email
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (profileError) {
      console.error('Error finding user:', profileError);
      return { error: 'Erro ao buscar usuário' };
    }

    if (!profiles) {
      return { error: 'Nenhum usuário encontrado com este email' };
    }

    if (profiles.id === user.id) {
      return { error: 'Você não pode convidar a si mesmo' };
    }

    // Check if already invited
    const { data: existing } = await supabase
      .from('team_members')
      .select('id, status')
      .eq('manager_id', user.id)
      .eq('operator_id', profiles.id)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'active') {
        return { error: 'Este usuário já faz parte do seu time' };
      }
      if (existing.status === 'pending') {
        return { error: 'Já existe um convite pendente para este usuário' };
      }
      // If declined, delete and recreate
      await supabase.from('team_members').delete().eq('id', existing.id);
    }

    // Create invite
    const { error } = await supabase
      .from('team_members')
      .insert({
        manager_id: user.id,
        operator_id: profiles.id,
        nickname: nickname || null,
      });

    if (error) {
      console.error('Error inviting operator:', error);
      return { error: 'Erro ao enviar convite' };
    }

    toast.success('Convite enviado com sucesso!');
    await fetchTeamMembers();
    return { error: null };
  };

  // Accept invite
  const acceptInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from('team_members')
      .update({ status: 'active', accepted_at: new Date().toISOString() })
      .eq('id', inviteId);

    if (error) {
      console.error('Error accepting invite:', error);
      toast.error('Erro ao aceitar convite');
      return;
    }

    toast.success('Convite aceito! Você agora faz parte do time.');
    await fetchPendingInvites();
  };

  // Decline invite
  const declineInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from('team_members')
      .update({ status: 'declined' })
      .eq('id', inviteId);

    if (error) {
      console.error('Error declining invite:', error);
      toast.error('Erro ao recusar convite');
      return;
    }

    toast.success('Convite recusado.');
    await fetchPendingInvites();
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

  // Initial fetch
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([fetchTeamMembers(), fetchPendingInvites()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [user, fetchTeamMembers, fetchPendingInvites]);

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
    refetch: () => Promise.all([fetchTeamMembers(), fetchPendingInvites()]),
  };
}
