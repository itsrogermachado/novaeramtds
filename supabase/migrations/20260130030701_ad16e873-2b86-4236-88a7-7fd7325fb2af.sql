-- Create product categories table
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view categories
CREATE POLICY "Anyone can view product categories"
ON public.product_categories
FOR SELECT
USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can manage product categories"
ON public.product_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create digital products table
CREATE TABLE public.digital_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  image_url TEXT,
  delivery_type TEXT NOT NULL DEFAULT 'link', -- 'link', 'file', 'access'
  delivery_content TEXT, -- URL, file path, or access instructions
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products
CREATE POLICY "Anyone can view active products"
ON public.digital_products
FOR SELECT
USING (is_active = true);

-- Admins can view all products
CREATE POLICY "Admins can view all products"
ON public.digital_products
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can manage products
CREATE POLICY "Admins can insert products"
ON public.digital_products
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
ON public.digital_products
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
ON public.digital_products
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create purchases table to track user purchases
CREATE TABLE public.product_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  amount_paid NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'refunded'
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
ON public.product_purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own purchases
CREATE POLICY "Users can create their own purchases"
ON public.product_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- System updates handled via service role
CREATE POLICY "Users can update their own pending purchases"
ON public.product_purchases
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all purchases
CREATE POLICY "Admins can view all purchases"
ON public.product_purchases
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update purchases
CREATE POLICY "Admins can update purchases"
ON public.product_purchases
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_digital_products_updated_at
BEFORE UPDATE ON public.digital_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_purchases_updated_at
BEFORE UPDATE ON public.product_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default categories
INSERT INTO public.product_categories (name, description, icon, display_order) VALUES
('Cursos', 'Cursos online completos', 'GraduationCap', 1),
('E-books', 'Livros digitais e guias', 'BookOpen', 2),
('Mentorias', 'Sessões de mentoria individual', 'Users', 3),
('Ferramentas', 'Planilhas e ferramentas', 'Wrench', 4);
