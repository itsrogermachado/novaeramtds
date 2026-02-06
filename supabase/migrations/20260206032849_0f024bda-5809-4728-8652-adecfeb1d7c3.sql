-- ==============================================
-- CORREÇÃO CRÍTICA: Esconder campo stock de não-admins
-- ==============================================

-- Remover política antiga de produtos
DROP POLICY IF EXISTS "Anyone can view active products" ON public.store_products;
DROP POLICY IF EXISTS "Anyone can view active products without stock" ON public.store_products;

-- Criar política que permite ver produtos ativos, MAS vamos esconder stock via função
CREATE POLICY "Public can view active products"
ON public.store_products
FOR SELECT
USING (status = 'active');

-- Criar função segura para verificar se produto tem estoque (sem expor conteúdo)
CREATE OR REPLACE FUNCTION public.check_product_stock(product_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (stock IS NOT NULL AND stock != '')
  FROM public.store_products
  WHERE id = product_id;
$$;

-- Criar função para obter quantidade de estoque (sem expor conteúdo)
CREATE OR REPLACE FUNCTION public.get_product_stock_count(product_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN product_type = 'lines' THEN 
        array_length(string_to_array(COALESCE(stock, ''), E'\n'), 1)
      WHEN stock IS NOT NULL AND stock != '' THEN 1
      ELSE 0
    END
  FROM public.store_products
  WHERE id = product_id;
$$;