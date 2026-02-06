-- Grant SELECT access on the public view to anonymous users
GRANT SELECT ON public.store_products_public TO anon;

-- Also ensure authenticated users can see it
GRANT SELECT ON public.store_products_public TO authenticated;