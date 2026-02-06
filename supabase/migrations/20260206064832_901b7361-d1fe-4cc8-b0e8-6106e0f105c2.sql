-- ============================================
-- FIX: Remove public role access and ensure only authenticated users can read data
-- ============================================

-- TUTORIAL_LINKS: Drop old public policy and keep only authenticated
DROP POLICY IF EXISTS "All authenticated users can view tutorial links" ON public.tutorial_links;

-- PROFILES: Ensure anon role cannot access
-- The existing policies are for 'public' role which includes both anon and authenticated
-- We need to make them authenticated-only

-- Drop and recreate with authenticated role only
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- STORE_ORDERS: Already has authenticated-only SELECT policies
-- But INSERT is for public (needed for guest checkout)
-- This is correct - guests can create orders, but only authenticated can read their own

-- Revoke anon access to sensitive tables to ensure RLS is the only gate
REVOKE ALL ON public.profiles FROM anon;
REVOKE SELECT ON public.tutorial_links FROM anon;
REVOKE SELECT ON public.store_orders FROM anon;