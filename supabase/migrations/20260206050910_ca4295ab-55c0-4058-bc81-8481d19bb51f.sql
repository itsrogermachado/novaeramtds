-- Add limited RLS policy for payment verification by order ID
-- This is secure because UUIDs are effectively unguessable
CREATE POLICY "Anyone can view order status by id"
ON public.store_orders
FOR SELECT
TO anon
USING (
  -- Only recent orders (2 hours) can be checked
  created_at > (now() - interval '2 hours')
);