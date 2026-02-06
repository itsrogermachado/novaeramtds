-- Drop the initial policy and create a better one
DROP POLICY "Anyone can view their own order by id for payment verification" ON public.store_orders;

-- Allow anyone to view recent orders for payment flow (pending/paid/delivered in last 2 hours)
CREATE POLICY "Anyone can view recent orders for payment flow"
ON public.store_orders
FOR SELECT
USING (
  -- Allow viewing orders that are recent (created within last 2 hours)
  -- This enables payment status polling and delivery viewing for guests
  created_at > (now() - interval '2 hours')
  AND status IN ('pending', 'paid', 'delivered')
);