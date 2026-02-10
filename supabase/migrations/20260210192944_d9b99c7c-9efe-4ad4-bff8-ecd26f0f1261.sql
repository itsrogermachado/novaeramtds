
-- Create cooperations table
CREATE TABLE public.cooperations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  child_accounts JSONB NOT NULL DEFAULT '[]'::jsonb,
  treasure NUMERIC NOT NULL DEFAULT 0,
  salary NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cooperations ENABLE ROW LEVEL SECURITY;

-- Users can view their own cooperations
CREATE POLICY "Users can view their own cooperations"
ON public.cooperations FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own cooperations
CREATE POLICY "Users can create their own cooperations"
ON public.cooperations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own cooperations
CREATE POLICY "Users can delete their own cooperations"
ON public.cooperations FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own cooperations
CREATE POLICY "Users can update their own cooperations"
ON public.cooperations FOR UPDATE
USING (auth.uid() = user_id);
