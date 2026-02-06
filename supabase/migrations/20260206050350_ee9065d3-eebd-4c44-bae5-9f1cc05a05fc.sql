-- SECURITY FIX: stop leaking all orders

-- 1) Remove the permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view order by id for payment verification" ON public.store_orders;

-- 2) Replace the overly-permissive INSERT policy (WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.store_orders;

-- Guests (anon) can create orders but must at least provide basic required fields
CREATE POLICY "Guests can create orders"
ON public.store_orders
FOR INSERT
TO anon
WITH CHECK (
  customer_email IS NOT NULL
  AND customer_email <> ''
  AND status = 'pending'
  AND payment_method = 'pix'
  AND total >= 0
);

-- Authenticated users can create orders only for their own email
CREATE POLICY "Authenticated users can create their own orders"
ON public.store_orders
FOR INSERT
TO authenticated
WITH CHECK (
  customer_email = (auth.jwt() ->> 'email')
  AND status = 'pending'
  AND payment_method = 'pix'
  AND total >= 0
);
