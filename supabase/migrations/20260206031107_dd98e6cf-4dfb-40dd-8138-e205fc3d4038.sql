-- Allow customers to view their own orders by email
CREATE POLICY "Customers can view their own orders by email" 
ON public.store_orders 
FOR SELECT 
USING (
  customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);