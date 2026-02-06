-- Add delivered_items column to store the content delivered to customers
ALTER TABLE public.store_orders 
ADD COLUMN IF NOT EXISTS delivered_items jsonb DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN public.store_orders.delivered_items IS 'Stores the actual content delivered to the customer (e.g., stock lines, keys, etc.)';