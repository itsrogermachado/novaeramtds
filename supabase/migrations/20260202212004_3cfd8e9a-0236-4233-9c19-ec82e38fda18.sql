-- Drop the problematic policies
DROP POLICY IF EXISTS "Operators can respond to invites" ON public.team_members;
DROP POLICY IF EXISTS "Managers can update team member details" ON public.team_members;

-- Recreate with proper WITH CHECK clauses
-- Operators can update their membership status (accept/decline)
CREATE POLICY "Operators can respond to invites"
ON public.team_members
FOR UPDATE
USING (auth.uid() = operator_id AND status = 'pending')
WITH CHECK (auth.uid() = operator_id);

-- Managers can update nickname of their team members
CREATE POLICY "Managers can update team member details"
ON public.team_members
FOR UPDATE
USING (auth.uid() = manager_id)
WITH CHECK (auth.uid() = manager_id);