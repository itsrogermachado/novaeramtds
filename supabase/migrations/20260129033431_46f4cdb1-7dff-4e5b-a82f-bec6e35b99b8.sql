-- Create table for dutching calculation history
CREATE TABLE public.dutching_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_invested NUMERIC NOT NULL,
  odds NUMERIC[] NOT NULL,
  stakes NUMERIC[] NOT NULL,
  guaranteed_return NUMERIC NOT NULL,
  profit NUMERIC NOT NULL,
  roi NUMERIC NOT NULL,
  observation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dutching_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view their own dutching history"
ON public.dutching_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own history
CREATE POLICY "Users can create their own dutching history"
ON public.dutching_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own history (for observations)
CREATE POLICY "Users can update their own dutching history"
ON public.dutching_history
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete their own dutching history"
ON public.dutching_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_dutching_history_user_id ON public.dutching_history(user_id);
CREATE INDEX idx_dutching_history_created_at ON public.dutching_history(created_at DESC);