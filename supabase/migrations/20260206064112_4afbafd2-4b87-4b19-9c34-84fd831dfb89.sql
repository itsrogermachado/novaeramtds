-- Drop the SECURITY DEFINER view that was created
DROP VIEW IF EXISTS public.store_products_public;

-- The store_products table already has proper RLS policies and the stock column
-- is protected via RPC functions (check_product_stock, get_product_stock_count)
-- No additional view is needed - the existing approach is secure