-- Remove insecure anon policy that exposes all recent orders
DROP POLICY IF EXISTS "Anyone can view order status by id" ON public.store_orders;