
-- Table to track each modification to a cooperation with its delta value
CREATE TABLE public.cooperation_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cooperation_id UUID NOT NULL REFERENCES public.cooperations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  delta NUMERIC NOT NULL DEFAULT 0,
  new_total NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cooperation_changes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own cooperation changes"
  ON public.cooperation_changes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cooperation changes"
  ON public.cooperation_changes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cooperation changes"
  ON public.cooperation_changes FOR DELETE
  USING (auth.uid() = user_id);

-- Index for efficient date filtering
CREATE INDEX idx_cooperation_changes_user_date ON public.cooperation_changes (user_id, created_at);

-- Seed initial changes from existing cooperations (so totals match)
INSERT INTO public.cooperation_changes (cooperation_id, user_id, delta, new_total, description, created_at)
SELECT id, user_id, total, total, 'Registro inicial', created_at
FROM public.cooperations;
