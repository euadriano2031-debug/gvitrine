-- Public storefront reads now go through SECURITY DEFINER RPCs that require
-- a specific active store slug. Remove broad table policies so public callers
-- cannot enumerate catalog/config rows across all tenant organizations.
-- Public content remains available through:
--   public_produtos_por_loja(slug)
--   public_categorias_por_loja(slug)
--   public_configuracao_por_loja(slug, chave)
-- and leads are submitted through criar_lead_publico(slug, ...).

DROP POLICY IF EXISTS "Public active products of active stores" ON public.produtos;
DROP POLICY IF EXISTS "Public categories of active stores" ON public.categorias;
DROP POLICY IF EXISTS "Public configs of active stores" ON public.configuracoes;

-- All public lead submissions now pass through the SECURITY DEFINER function,
-- which validates that the slug is active and any product belongs to that store.
DROP POLICY IF EXISTS "Public store lead inserts" ON public.leads;
DROP POLICY IF EXISTS "Public legacy lead inserts" ON public.leads;

-- Ensure tenant identifiers are mandatory even if a future policy is changed.
ALTER TABLE public.produtos ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.categorias ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.configuracoes ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN organization_id SET NOT NULL;
