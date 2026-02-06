-- ============================================
-- FIX: Remove SECURITY DEFINER from view
-- Views should use invoker's permissions, not definer's
-- ============================================

-- Drop the view and recreate without security definer
DROP VIEW IF EXISTS public.store_products_public;

-- Recreate as a normal view (uses invoker's permissions by default)
CREATE VIEW public.store_products_public AS
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

-- Grant select to anon and authenticated 
GRANT SELECT ON public.store_products_public TO anon;
GRANT SELECT ON public.store_products_public TO authenticated;

COMMENT ON VIEW public.store_products_public IS 'Public-facing view that excludes sensitive stock data (credentials, license keys). Uses invoker permissions with underlying RLS on store_products table.';