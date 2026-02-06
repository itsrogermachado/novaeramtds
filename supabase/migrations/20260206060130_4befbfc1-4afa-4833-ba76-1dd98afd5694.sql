-- Drop the existing INSERT policies that are causing issues
DROP POLICY IF EXISTS "Authenticated users can create their own orders" ON public.store_orders;
DROP POLICY IF EXISTS "Guests can create orders" ON public.store_orders;

-- Create a single, unified INSERT policy that works for both authenticated and guest users
-- For authenticated users: their email must match the customer_email in the order
-- For anonymous users: customer_email must be provided and not empty
CREATE POLICY "Anyone can create orders with valid email"
ON public.store_orders
FOR INSERT
WITH CHECK (
  -- Basic validation for all users
  customer_email IS NOT NULL 
  AND customer_email <> ''
  AND status = 'pending'
  AND payment_method = 'pix'
  AND total >= 0
  AND (
    -- For authenticated users: email must match their JWT email
    (auth.role() = 'authenticated' AND customer_email = (auth.jwt() ->> 'email'))
    OR
    -- For anonymous users: allow any valid email
    (auth.role() = 'anon')
  )
);