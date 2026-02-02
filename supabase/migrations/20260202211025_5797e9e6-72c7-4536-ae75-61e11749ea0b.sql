-- Create enum for team member status
CREATE TYPE public.team_member_status AS ENUM ('pending', 'active', 'declined');

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  status team_member_status NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate invites
  UNIQUE(manager_id, operator_id),
  
  -- Prevent self-invitation
  CONSTRAINT no_self_invite CHECK (manager_id != operator_id)
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is manager of an operator
CREATE OR REPLACE FUNCTION public.is_manager_of(_manager_id UUID, _operator_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE manager_id = _manager_id
      AND operator_id = _operator_id
      AND status = 'active'
  )
$$;

-- Create function to get all operator IDs for a manager
CREATE OR REPLACE FUNCTION public.get_team_operator_ids(_manager_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT operator_id
  FROM public.team_members
  WHERE manager_id = _manager_id
    AND status = 'active'
$$;

-- RLS Policies for team_members

-- Managers can view their team members
CREATE POLICY "Managers can view their team"
ON public.team_members
FOR SELECT
USING (auth.uid() = manager_id);

-- Operators can view teams they belong to
CREATE POLICY "Operators can view their memberships"
ON public.team_members
FOR SELECT
USING (auth.uid() = operator_id);

-- Managers can invite operators
CREATE POLICY "Managers can invite operators"
ON public.team_members
FOR INSERT
WITH CHECK (auth.uid() = manager_id);

-- Managers can remove team members
CREATE POLICY "Managers can remove team members"
ON public.team_members
FOR DELETE
USING (auth.uid() = manager_id);

-- Operators can update their membership status (accept/decline)
CREATE POLICY "Operators can respond to invites"
ON public.team_members
FOR UPDATE
USING (auth.uid() = operator_id AND status = 'pending');

-- Managers can update nickname of their team members
CREATE POLICY "Managers can update team member details"
ON public.team_members
FOR UPDATE
USING (auth.uid() = manager_id);

-- Add policies to operations table for manager visibility
CREATE POLICY "Managers can view team operations"
ON public.operations
FOR SELECT
USING (public.is_manager_of(auth.uid(), user_id));

-- Add policies to expenses table for manager visibility
CREATE POLICY "Managers can view team expenses"
ON public.expenses
FOR SELECT
USING (public.is_manager_of(auth.uid(), user_id));

-- Add policies to balance_adjustments for manager visibility
CREATE POLICY "Managers can view team adjustments"
ON public.balance_adjustments
FOR SELECT
USING (public.is_manager_of(auth.uid(), user_id));

-- Create index for performance
CREATE INDEX idx_team_members_manager ON public.team_members(manager_id);
CREATE INDEX idx_team_members_operator ON public.team_members(operator_id);
CREATE INDEX idx_team_members_status ON public.team_members(status);