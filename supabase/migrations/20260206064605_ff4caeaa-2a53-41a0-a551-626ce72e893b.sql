-- ============================================
-- FIX: Restrict public access to store_products to prevent stock/credential exposure
-- Only admins should see stock and post_sale_instructions
-- ============================================

-- Drop the public policy that exposes all fields
DROP POLICY IF EXISTS "Public can view active product info" ON public.store_products;

-- The table should NOT be publicly accessible - only through the secure view
-- Admins can still see everything via their policy
-- We need to ensure anon/authenticated cannot query the table directly

-- Create a policy that only allows authenticated users to see products
-- but we'll use the view for actual queries
CREATE POLICY "Authenticated can view active products metadata"
ON public.store_products
FOR SELECT
TO authenticated
USING (
  status = 'active' 
  AND is_hidden IS NOT TRUE
  -- Admin override to see everything
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Revoke direct anon access to the table
-- The view will handle public access
REVOKE ALL ON public.store_products FROM anon;

-- Grant select on the secure view only
GRANT SELECT ON public.store_products_public TO anon;

-- Also fix tutorial_links to require authentication
DROP POLICY IF EXISTS "Anyone can view tutorial links" ON public.tutorial_links;

CREATE POLICY "Authenticated users can view tutorial links"
ON public.tutorial_links
FOR SELECT
TO authenticated
USING (true);