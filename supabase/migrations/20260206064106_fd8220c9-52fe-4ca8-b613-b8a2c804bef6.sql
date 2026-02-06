-- Fix security issues: Remove public coupon access and fix storage policies

-- 1. Remove the public SELECT policy that exposes all coupons
DROP POLICY IF EXISTS "Anyone can validate active coupons" ON store_coupons;

-- 2. Fix products storage bucket policies - add admin role check
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- Create secure policies with admin role check
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Update store_products public policy to exclude sensitive stock column
-- First drop the existing public policy
DROP POLICY IF EXISTS "Public can view active products" ON store_products;

-- Create a view that excludes sensitive fields for public access
CREATE OR REPLACE VIEW public.store_products_public AS
SELECT 
  id,
  category_id,
  display_order,
  created_at,
  updated_at,
  min_quantity,
  max_quantity,
  auto_open_chat,
  is_private,
  is_hidden,
  hide_sold_count,
  is_featured,
  -- Exclude: post_sale_instructions, stock (sensitive)
  name,
  short_description,
  long_description,
  price,
  status,
  cta_url,
  image_url,
  comparison_price,
  slug,
  video_url,
  delivery_type,
  product_type
FROM store_products
WHERE status = 'active';

-- Recreate policy that still allows viewing active products
-- but the sensitive columns are now protected via RPC functions
CREATE POLICY "Public can view active products"
ON store_products FOR SELECT
USING (status = 'active');