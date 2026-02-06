-- Create store_coupons table
CREATE TABLE public.store_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 0,
  used_count INTEGER NOT NULL DEFAULT 0,
  min_order_value NUMERIC NOT NULL DEFAULT 0,
  max_order_value NUMERIC NOT NULL DEFAULT 0,
  max_discount_amount NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  category_ids UUID[] DEFAULT '{}',
  product_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.store_coupons ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all coupons"
ON public.store_coupons
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert coupons"
ON public.store_coupons
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update coupons"
ON public.store_coupons
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete coupons"
ON public.store_coupons
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policy for anyone to validate active coupons (for checkout)
CREATE POLICY "Anyone can validate active coupons"
ON public.store_coupons
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_store_coupons_updated_at
BEFORE UPDATE ON public.store_coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();