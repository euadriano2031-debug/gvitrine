-- Ensure every panel color lives in the per-organization admin_tema row.
-- Preserve already-customized admin_tema keys; only add the color keys that were
-- previously stored in admin_cabecalho. No storefront keys or product data change.
insert into public.configuracoes (organization_id, chave, valor)
select
  o.id,
  'admin_tema',
  jsonb_build_object(
    'titulo_cor', coalesce(nullif(h.valor->>'titulo_cor',''), '#16a34a'),
    'menu_fundo_cor', coalesce(nullif(h.valor->>'menu_fundo_cor',''), '#16a34a'),
    'menu_icone_cor', coalesce(nullif(h.valor->>'menu_icone_cor',''), '#ffffff'),
    'loja_fundo_cor', coalesce(nullif(h.valor->>'loja_fundo_cor',''), '#16a34a'),
    'loja_icone_cor', coalesce(nullif(h.valor->>'loja_icone_cor',''), '#ffffff'),
    'loja_texto_cor', coalesce(nullif(h.valor->>'loja_texto_cor',''), '#ffffff'),
    'sidebar_titulo_cor', coalesce(nullif(h.valor->>'sidebar_titulo_cor',''), '#0f172a'),
    'sidebar_subtitulo_cor', coalesce(nullif(h.valor->>'sidebar_subtitulo_cor',''), '#64748b'),
    'sidebar_fundo_cor', coalesce(nullif(h.valor->>'sidebar_fundo_cor',''), '#16a34a'),
    'sidebar_icone_cor', coalesce(nullif(h.valor->>'sidebar_icone_cor',''), '#ffffff'),
    'tema_primaria_cor', '#16a34a',
    'tema_primaria_texto_cor', '#ffffff',
    'tema_item_ativo_cor', '#dcfce7',
    'tema_item_ativo_texto_cor', '#166534'
  )
from public.organizations o
left join public.configuracoes h
  on h.organization_id = o.id
 and h.chave = 'admin_cabecalho'
on conflict (organization_id, chave)
do update set valor = excluded.valor || public.configuracoes.valor;
