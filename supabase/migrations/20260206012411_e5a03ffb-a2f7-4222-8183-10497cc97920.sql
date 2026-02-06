-- Create orders table to store sales history
CREATE TABLE public.store_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'pix',
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  coupon_code TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX idx_store_orders_created_at ON public.store_orders(created_at DESC);
CREATE INDEX idx_store_orders_status ON public.store_orders(status);
CREATE INDEX idx_store_orders_email ON public.store_orders(customer_email);

-- Enable RLS
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" 
ON public.store_orders 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update orders (change status, etc.)
CREATE POLICY "Admins can update orders" 
ON public.store_orders 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete orders
CREATE POLICY "Admins can delete orders" 
ON public.store_orders 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can create orders (checkout)
CREATE POLICY "Anyone can create orders" 
ON public.store_orders 
FOR INSERT 
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_store_orders_updated_at
BEFORE UPDATE ON public.store_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();