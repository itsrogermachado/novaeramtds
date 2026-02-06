-- Add payment_reference column to store_orders for MisticPay transaction tracking
ALTER TABLE public.store_orders 
ADD COLUMN IF NOT EXISTS payment_reference text;

-- Add payer_name and payer_document for PIX transaction
ALTER TABLE public.store_orders 
ADD COLUMN IF NOT EXISTS payer_name text;

ALTER TABLE public.store_orders 
ADD COLUMN IF NOT EXISTS payer_document text;

-- Create index for faster lookup by payment_reference
CREATE INDEX IF NOT EXISTS idx_store_orders_payment_reference 
ON public.store_orders(payment_reference);