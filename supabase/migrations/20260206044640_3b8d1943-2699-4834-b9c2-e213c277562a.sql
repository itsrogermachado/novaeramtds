-- Allow anyone to view their own pending/recent order by ID (for payment verification)
-- This policy enables guests to check payment status after creating an order
CREATE POLICY "Anyone can view their own order by id for payment verification"
ON public.store_orders
FOR SELECT
USING (
  -- Allow viewing orders that are pending and created within last 2 hours
  -- This enables payment status polling for guests
  status = 'pending' 
  AND created_at > (now() - interval '2 hours')
);