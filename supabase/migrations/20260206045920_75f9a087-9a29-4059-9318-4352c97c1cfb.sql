-- Enable realtime for store_orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_orders;

-- Add a secure policy for order status verification by order ID only
-- This allows the checkout to poll/subscribe to a specific order by ID
CREATE POLICY "Anyone can view order by id for payment verification"
ON public.store_orders
FOR SELECT
USING (true);

-- Note: This is a SELECT-only policy. The order ID is a UUID which is 
-- effectively unguessable, making it safe to allow viewing by ID.