-- First drop all policies that depend on the status column
DROP POLICY IF EXISTS "Operators can respond to invites" ON public.team_members;
DROP POLICY IF EXISTS "Managers can view their team" ON public.team_members;
DROP POLICY IF EXISTS "Managers can invite operators" ON public.team_members;
DROP POLICY IF EXISTS "Managers can remove team members" ON public.team_members;
DROP POLICY IF EXISTS "Managers can update team member details" ON public.team_members;
DROP POLICY IF EXISTS "Operators can view their memberships" ON public.team_members;

-- Now we can safely drop the columns
ALTER TABLE public.team_members 
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS invited_at,
DROP COLUMN IF EXISTS accepted_at;

-- Drop the enum type
DROP TYPE IF EXISTS public.team_member_status;

-- Add team_name column
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS team_name TEXT DEFAULT 'Meu Time';

-- Create new simplified policies
CREATE POLICY "Managers have full control of their team"
ON public.team_members
FOR ALL
USING (auth.uid() = manager_id)
WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Operators can view their team"
ON public.team_members
FOR SELECT
USING (auth.uid() = operator_id);

-- Update functions (simpler without status check)
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
  )
$$;

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
$$;