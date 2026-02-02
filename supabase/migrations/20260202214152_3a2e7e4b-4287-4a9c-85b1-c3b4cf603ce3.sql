-- Create a dedicated teams table so team names persist even when a manager has 0 operators
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'Meu Time',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Managers can read their own team; operators can read the team they belong to
DROP POLICY IF EXISTS "Managers can view their team" ON public.teams;
CREATE POLICY "Managers/operators can view team name"
ON public.teams
FOR SELECT
USING (
  auth.uid() = manager_id
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.operator_id = auth.uid()
      AND tm.manager_id = public.teams.manager_id
  )
);

-- Managers can create/update/delete only their own team row
DROP POLICY IF EXISTS "Managers can insert their team" ON public.teams;
CREATE POLICY "Managers can insert their team"
ON public.teams
FOR INSERT
WITH CHECK (auth.uid() = manager_id);

DROP POLICY IF EXISTS "Managers can update their team" ON public.teams;
CREATE POLICY "Managers can update their team"
ON public.teams
FOR UPDATE
USING (auth.uid() = manager_id);

DROP POLICY IF EXISTS "Managers can delete their team" ON public.teams;
CREATE POLICY "Managers can delete their team"
ON public.teams
FOR DELETE
USING (auth.uid() = manager_id);

-- Keep updated_at in sync
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill existing managers' team names from team_members
INSERT INTO public.teams (manager_id, name)
SELECT manager_id, COALESCE(MAX(team_name), 'Meu Time')
FROM public.team_members
GROUP BY manager_id
ON CONFLICT (manager_id) DO NOTHING;