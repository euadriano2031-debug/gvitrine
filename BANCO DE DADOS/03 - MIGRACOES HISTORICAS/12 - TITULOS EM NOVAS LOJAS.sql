-- Garante configuração de títulos/ícones na criação de novas lojas.
create or replace function public.organizations_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_main_org_id uuid;
begin
  insert into public.organization_members(organization_id,user_id,role)
  values(new.id,new.owner_user_id,'owner')
  on conflict (organization_id,user_id) do nothing;

  insert into public.organization_subscriptions(organization_id,plan_code,status)
  values(new.id,'free','active')
  on conflict (organization_id) do nothing;

  perform public.sync_products_from_main_store(new.id);
  perform public.initialize_organization_from_legacy(new.id);

  select id into v_main_org_id
  from public.organizations
  where slug='ki-vitrine' and status='active'
  order by created_at
  limit 1;

  if v_main_org_id is not null and v_main_org_id <> new.id then
    insert into public.configuracoes(organization_id,chave,valor)
    select new.id,c.chave,c.valor
    from public.configuracoes c
    where c.organization_id=v_main_org_id
      and c.chave in ('banner','titulos_secoes')
      and not exists (
        select 1 from public.configuracoes x
        where x.organization_id=new.id and x.chave=c.chave
      );
  end if;

  if not exists (
    select 1 from public.configuracoes
    where organization_id=new.id and chave='titulos_secoes'
  ) then
    insert into public.configuracoes(organization_id,chave,valor)
    values (
      new.id,
      'titulos_secoes',
      '{"destaque":{"modo":"icone","texto":"Produtos em Destaque","texto_cor":"","texto_tamanho":24,"icone_cor":"#f97316","icone_tamanho":24,"icone_imagem_url":""},"vitrine":{"modo":"icone","texto":"Vitrine Completa","texto_cor":"","texto_tamanho":24,"icone_cor":"#f97316","icone_tamanho":24,"icone_imagem_url":""}}'::jsonb
    );
  end if;

  return new;
end;
$function$;
