-- Padroniza o banner de apresentação do YouTube para todas as lojas existentes.
-- A loja principal (slug=ki-vitrine) é a fonte do vídeo e das opções do player.

do $$
declare
  v_banner jsonb;
  v_source uuid;
begin
  select id into v_source
  from public.organizations
  where slug='ki-vitrine' and status='active'
  order by created_at
  limit 1;

  if v_source is null then
    return;
  end if;

  select valor into v_banner
  from public.configuracoes
  where organization_id=v_source and chave='banner'
  limit 1;

  if v_banner is null then
    v_banner := jsonb_build_object(
      'ativo', true,
      'tipo', 'youtube',
      'video_url', 'https://www.youtube.com/embed/xFLaqcsRP40',
      'mp4_url', '',
      'capa_url', '',
      'autoplay', false,
      'controles', true,
      'selo_tipo', 'texto',
      'selo_imagem_url', '',
      'selo_tamanho_fonte', 14,
      'selo_cor_texto', '#111827',
      'selo_cor_fundo', '#ffffff',
      'titulo', 'Códigos-fonte, automações e IA prontos para vender',
      'subtitulo', 'Lançamento',
      'descricao', 'Marketplace de produtos digitais premium para você lançar seu próprio negócio em minutos.',
      'cor_fundo', '',
      'cor_texto', '',
      'posicao', 'center'
    );
  end if;

  update public.configuracoes c
  set valor=v_banner, updated_at=now()
  where c.chave='banner'
    and c.organization_id is not null
    and c.organization_id <> v_source;

  if not exists (
    select 1 from public.configuracoes
    where organization_id=v_source and chave='banner'
  ) then
    insert into public.configuracoes(organization_id,chave,valor)
    values(v_source,'banner',v_banner);
  end if;
end $$;

-- Novas lojas recebem a configuração da loja principal dentro da trigger
-- public.organizations_after_insert (atualizada no instalador e no banco).
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
      and c.chave='banner'
      and not exists (
        select 1 from public.configuracoes x
        where x.organization_id=new.id and x.chave=c.chave
      );
  end if;

  return new;
end;
$function$;
