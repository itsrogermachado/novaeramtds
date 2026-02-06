-- Add new columns to store_products for the enhanced product form
ALTER TABLE public.store_products
ADD COLUMN IF NOT EXISTS comparison_price text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS slug text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS video_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'manual' CHECK (delivery_type IN ('manual', 'automatic')),
ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'text' CHECK (product_type IN ('text', 'lines')),
ADD COLUMN IF NOT EXISTS min_quantity integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS post_sale_instructions text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_open_chat boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_sold_count boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Create unique index on slug (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS store_products_slug_unique ON public.store_products (slug) WHERE slug IS NOT NULL;