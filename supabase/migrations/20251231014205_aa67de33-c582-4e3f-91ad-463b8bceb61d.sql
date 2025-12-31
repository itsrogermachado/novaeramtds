-- Create enum type for goal types
CREATE TYPE public.goal_type AS ENUM ('monthly', 'daily');

-- Add goal_type column to goals table with default 'monthly'
ALTER TABLE public.goals 
ADD COLUMN goal_type public.goal_type NOT NULL DEFAULT 'monthly';