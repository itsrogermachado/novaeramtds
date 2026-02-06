-- Fix privacy leak: remove overly-broad public SELECT policy and restrict access

-- Ensure RLS is enabled
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

-- Remove insecure / overly broad guest policies (if they exist)
DROP POLICY IF EXISTS "Anyone can view recent orders for payment flow" ON public.store_orders;
DROP POLICY IF EXISTS "Anyone can view their own order by id for payment verification" ON public.store_orders;

-- Replace/standardize authenticated access policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.store_orders;
DROP POLICY IF EXISTS "Admins can view all store orders" ON public.store_orders;

-- Authenticated users: only their own orders (by JWT email)
CREATE POLICY "Users can view their own orders"
ON public.store_orders
FOR SELECT
TO authenticated
USING (
  customer_email = (auth.jwt() ->> 'email')
);

-- Admins: can view all orders
CREATE POLICY "Admins can view all store orders"
ON public.store_orders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);
