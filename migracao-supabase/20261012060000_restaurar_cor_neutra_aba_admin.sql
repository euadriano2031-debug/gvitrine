-- Restore the prior neutral highlight color for the selected admin sidebar item.
-- This is scoped to KI-VITRINE; other stores retain their own theme settings.
UPDATE public.configuracoes c
SET valor = jsonb_set(
  COALESCE(c.valor, '{}'::jsonb),
  '{tema_item_ativo_cor}',
  to_jsonb('#ebe5e5'::text),
  true
)
FROM public.organizations o
WHERE c.organization_id = o.id
  AND c.chave = 'admin_tema'
  AND o.slug = 'ki-vitrine';

