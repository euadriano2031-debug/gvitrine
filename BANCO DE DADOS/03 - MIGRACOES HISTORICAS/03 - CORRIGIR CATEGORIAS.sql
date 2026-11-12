-- Corrige a classificação dos produtos da SAM VITRINE.
with mapa(slug, categoria_slug) as (
  values
    ('landing-page-builder', 'sites'),
    ('erp-dashboard-pro', 'paineis'),
    ('delivery-app-completo', 'apps'),
    ('agenda-agendamentos', 'apps')
)
update public.produtos p
set
  categoria_id = c.id,
  updated_at = now()
from mapa m, public.categorias c
where p.organization_id = '76f13db2-25a2-431f-9064-cbc3ffcdafd3'
  and p.slug = m.slug
  and c.organization_id = p.organization_id
  and c.slug = m.categoria_slug;

do $$
declare
  v_sem_categoria integer;
begin
  select count(*)
    into v_sem_categoria
  from public.produtos
  where organization_id = '76f13db2-25a2-431f-9064-cbc3ffcdafd3'
    and ativo
    and categoria_id is null;

  if v_sem_categoria > 0 then
    raise exception 'SAM VITRINE ainda possui % produto(s) ativo(s) sem categoria.', v_sem_categoria;
  end if;
end $$;
