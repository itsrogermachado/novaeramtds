-- Create membership tier enum
CREATE TYPE public.membership_tier AS ENUM ('free', 'vip');

-- Create user_memberships table
CREATE TABLE public.user_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    tier membership_tier NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

-- Create function to check membership tier (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_membership(_user_id uuid, _tier membership_tier)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_memberships
    WHERE user_id = _user_id
      AND tier = _tier
  )
$$;

-- Create function to get user membership tier
CREATE OR REPLACE FUNCTION public.get_membership_tier(_user_id uuid)
RETURNS membership_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tier FROM public.user_memberships WHERE user_id = _user_id),
    'free'::membership_tier
  )
$$;

-- RLS Policies for user_memberships
CREATE POLICY "Users can view their own membership"
ON public.user_memberships
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all memberships"
ON public.user_memberships
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update memberships"
ON public.user_memberships
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert memberships"
ON public.user_memberships
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Update handle_new_user function to also create membership with 'free' tier
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.user_memberships (user_id, tier)
  VALUES (NEW.id, 'free');
  
  RETURN NEW;
END;
$function$;

-- Add trigger for updated_at
CREATE TRIGGER update_user_memberships_updated_at
BEFORE UPDATE ON public.user_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create memberships for existing users who don't have one
INSERT INTO public.user_memberships (user_id, tier)
SELECT id, 'free'::membership_tier
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_memberships)
ON CONFLICT (user_id) DO NOTHING;