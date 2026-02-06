-- Drop the problematic policy that references auth.users
DROP POLICY IF EXISTS "Customers can view their own orders by email" ON public.store_orders;

-- Create a new policy that only uses profiles table (which is accessible)
CREATE POLICY "Customers can view their own orders by email"
ON public.store_orders
FOR SELECT
USING (
  customer_email = (SELECT email FROM profiles WHERE id = auth.uid())
);