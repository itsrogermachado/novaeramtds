-- Drop the current INSERT policy that is too restrictive
DROP POLICY IF EXISTS "Anyone can create orders with valid email" ON public.store_orders;

-- Create a simpler INSERT policy that allows anyone to create orders
-- The key validation is just that email is provided and basic fields are valid
CREATE POLICY "Allow order creation with valid email"
ON public.store_orders
FOR INSERT
WITH CHECK (
  customer_email IS NOT NULL 
  AND customer_email <> ''
  AND length(customer_email) > 3
  AND status = 'pending'
  AND payment_method = 'pix'
  AND total >= 0
);