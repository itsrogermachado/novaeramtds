-- Drop product_purchases first (depends on digital_products and payment_transactions)
DROP TABLE IF EXISTS public.product_purchases CASCADE;

-- Drop digital_products (depends on product_categories)
DROP TABLE IF EXISTS public.digital_products CASCADE;

-- Drop product_categories
DROP TABLE IF EXISTS public.product_categories CASCADE;

-- Drop payment_transactions
DROP TABLE IF EXISTS public.payment_transactions CASCADE;