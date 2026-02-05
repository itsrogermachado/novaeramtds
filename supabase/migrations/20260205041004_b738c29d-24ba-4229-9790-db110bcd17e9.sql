-- Table for store categories
CREATE TABLE public.store_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📦',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for store products
CREATE TABLE public.store_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.store_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  price TEXT NOT NULL DEFAULT '0',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  cta_url TEXT,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- Public read access for active categories
CREATE POLICY "Anyone can view active categories"
ON public.store_categories
FOR SELECT
USING (status = 'active');

-- Admins can view all categories
CREATE POLICY "Admins can view all categories"
ON public.store_categories
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can manage categories
CREATE POLICY "Admins can insert categories"
ON public.store_categories
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
ON public.store_categories
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories"
ON public.store_categories
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Public read access for active products
CREATE POLICY "Anyone can view active products"
ON public.store_products
FOR SELECT
USING (status = 'active');

-- Admins can view all products
CREATE POLICY "Admins can view all products"
ON public.store_products
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can manage products
CREATE POLICY "Admins can insert products"
ON public.store_products
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
ON public.store_products
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
ON public.store_products
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on categories
CREATE TRIGGER update_store_categories_updated_at
BEFORE UPDATE ON public.store_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on products
CREATE TRIGGER update_store_products_updated_at
BEFORE UPDATE ON public.store_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();