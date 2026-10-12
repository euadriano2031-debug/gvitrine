-- Isola o tema do painel administrativo por organização.
-- Seguro para reexecução: preserva qualquer configuração admin_tema já existente.
-- Não atualiza nem apaga admin_cabecalho, configurações da loja ou dados públicos.
insert into public.configuracoes (organization_id, chave, valor)
select
  o.id,
  'admin_tema',
  jsonb_build_object(
    'tema_primaria_cor', coalesce(nullif(c.valor->>'tema_primaria_cor', ''), '#16a34a'),
    'tema_primaria_texto_cor', coalesce(nullif(c.valor->>'tema_primaria_texto_cor', ''), '#ffffff'),
    'tema_item_ativo_cor', coalesce(nullif(c.valor->>'tema_item_ativo_cor', ''), '#dcfce7'),
    'tema_item_ativo_texto_cor', coalesce(nullif(c.valor->>'tema_item_ativo_texto_cor', ''), '#166534')
  )
from public.organizations o
left join public.configuracoes c
  on c.organization_id = o.id
 and c.chave = 'admin_cabecalho'
on conflict (organization_id, chave) do nothing;
