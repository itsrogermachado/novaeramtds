-- Remove problematic legacy SELECT policies that leak orders
DROP POLICY IF EXISTS "Anyone can view recent orders for payment flow" ON public.store_orders;
DROP POLICY IF EXISTS "Customers can view their own orders by email" ON public.store_orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.store_orders;

-- Now we only have proper policies:
-- 1. "Users can view their own orders" - authenticated, matched by JWT email
-- 2. "Admins can view all store orders" - authenticated admin users only