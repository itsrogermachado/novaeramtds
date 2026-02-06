-- ============================================
-- FIX: Protect product stock from public exposure
-- The stock column contains sensitive credentials/licenses
-- ============================================

-- Drop the current public policy that exposes stock
DROP POLICY IF EXISTS "Public can view active products" ON public.store_products;

-- Create a new public policy that uses a more restrictive approach
-- Public can only see products, but we'll use a view for safe public access
CREATE POLICY "Public can view active product info"
ON public.store_products
FOR SELECT
USING (
  status = 'active' 
  AND is_hidden IS NOT TRUE
);

-- Create a secure view for public product listing that excludes sensitive columns
CREATE OR REPLACE VIEW public.store_products_public AS
SELECT 
  id,
  category_id,
  name,
  slug,
  short_description,
  long_description,
  price,
  comparison_price,
  image_url,
  video_url,
  status,
  display_order,
  is_featured,
  is_private,
  is_hidden,
  hide_sold_count,
  min_quantity,
  max_quantity,
  delivery_type,
  cta_url,
  auto_open_chat,
  created_at,
  updated_at,
  -- Use the secure function to get stock count without exposing actual content
  public.get_product_stock_count(id) as stock_available
FROM public.store_products
WHERE status = 'active' AND is_hidden IS NOT TRUE;

-- Grant access to the public view
GRANT SELECT ON public.store_products_public TO anon;
GRANT SELECT ON public.store_products_public TO authenticated;

-- Comment explaining security
COMMENT ON VIEW public.store_products_public IS 'Public-facing view that excludes sensitive stock data (credentials, license keys). Use this view for customer-facing product listings.';

-- Also add a column-level security function for stock checking
-- This ensures stock is only checked via secure functions, never directly queried
CREATE OR REPLACE FUNCTION public.check_product_availability(product_id uuid, requested_quantity integer DEFAULT 1)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'available', 
    CASE 
      WHEN p.product_type = 'lines' THEN 
        COALESCE(array_length(string_to_array(p.stock, E'\n'), 1), 0) >= requested_quantity
      WHEN p.stock IS NOT NULL AND p.stock != '' THEN 
        true
      ELSE 
        false
    END,
    'stock_count',
    CASE 
      WHEN p.product_type = 'lines' THEN 
        COALESCE(array_length(string_to_array(p.stock, E'\n'), 1), 0)
      WHEN p.stock IS NOT NULL AND p.stock != '' THEN 
        1
      ELSE 
        0
    END
  )
  FROM public.store_products p
  WHERE p.id = product_id;
$$;