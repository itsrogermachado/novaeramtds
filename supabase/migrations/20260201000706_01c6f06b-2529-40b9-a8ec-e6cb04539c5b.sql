-- Create table for balance adjustments
CREATE TABLE public.balance_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.balance_adjustments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own adjustments" 
ON public.balance_adjustments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own adjustments" 
ON public.balance_adjustments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adjustments" 
ON public.balance_adjustments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own adjustments" 
ON public.balance_adjustments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can view all adjustments
CREATE POLICY "Admins can view all adjustments" 
ON public.balance_adjustments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));