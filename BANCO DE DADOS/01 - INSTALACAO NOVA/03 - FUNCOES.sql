-- PASSO 3 — funções da plataforma e do multi-tenant
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.unaccent_fallback(_txt text)
returns text
language sql
immutable
set search_path = public
as $$
  select translate(
    _txt,
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
  );
$$;

create or replace function public.slugify(_txt text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(
    both '-' from regexp_replace(
      lower(public.unaccent_fallback(_txt)),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select _user_id = auth.uid()
     and exists (
       select 1 from public.user_roles
       where user_id = _user_id and role = _role
     );
$$;

create or replace function public.is_organization_member(_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = _organization_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_organization_admin(_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = _organization_id
      and user_id = auth.uid()
      and role in ('owner','admin')
  );
$$;

create or replace function public.is_organization_active(_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organizations
    where id = _organization_id
      and status = 'active'
  );
$$;

create or replace function public.produtos_set_slug()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  base text;
  candidato text;
  i integer := 1;
begin
  if new.slug is null or new.slug = '' then
    base := public.slugify(coalesce(new.titulo, 'produto'));
    if base = '' then base := 'produto'; end if;
    candidato := base;

    while exists (
      select 1
      from public.produtos p
      where p.organization_id is not distinct from new.organization_id
        and p.slug = candidato
        and p.id <> new.id
    ) loop
      i := i + 1;
      candidato := base || '-' || i;
    end loop;

    new.slug := candidato;
  end if;

  return new;
end;
$$;

create or replace function public.public_produtos_por_loja(_organization_slug text)
returns setof jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(p)
  from public.produtos p
  join public.organizations o on o.id = p.organization_id
  where o.slug = trim(_organization_slug)
    and o.status = 'active'
    and p.ativo = true
  order by p.ordem, p.created_at, p.id;
$$;

create or replace function public.public_categorias_por_loja(_organization_slug text)
returns setof jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(c)
  from public.categorias c
  join public.organizations o on o.id = c.organization_id
  where o.slug = trim(_organization_slug)
    and o.status = 'active'
  order by c.ordem, c.nome, c.id;
$$;

create or replace function public.public_configuracao_por_loja(
  _organization_slug text,
  _chave text
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select c.valor
  from public.configuracoes c
  join public.organizations o on o.id = c.organization_id
  where o.slug = trim(_organization_slug)
    and o.status = 'active'
    and c.chave = _chave
    and c.chave in (
      'banner','ajuda','marca','card_textos',
      'compartilhamento','produto_beneficios','categoria_botoes',
      'botao_ver_mais','titulos_secoes','rodape','favicon'
    )
  limit 1;
$$;

create or replace function public.public_produto_por_loja(
  _organization_slug text,
  _product_slug text
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(p)
  from public.produtos p
  join public.organizations o on o.id = p.organization_id
  where o.slug = trim(_organization_slug)
    and o.status = 'active'
    and p.slug = _product_slug
    and p.ativo = true
  limit 1;
$$;

create or replace function public.criar_lead_publico(
  _organization_slug text,
  _nome text,
  _email text default null,
  _telefone text default null,
  _mensagem text default null,
  _produto_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_prod_org_id uuid;
  v_lead_id uuid;
begin
  if length(trim(coalesce(_nome,''))) < 2
     or length(trim(coalesce(_nome,''))) > 120 then
    raise exception 'Nome inválido.';
  end if;

  select o.id into v_org_id
  from public.organizations o
  where o.slug = trim(_organization_slug)
    and o.status = 'active'
  limit 1;

  if v_org_id is null then
    raise exception 'Loja não encontrada ou inativa.';
  end if;

  if _produto_id is not null then
    select p.organization_id into v_prod_org_id
    from public.produtos p
    where p.id = _produto_id and p.ativo = true
    limit 1;

    if v_prod_org_id is distinct from v_org_id then
      raise exception 'Produto não pertence a esta loja.';
    end if;
  end if;

  insert into public.leads(
    nome,email,telefone,produto_id,mensagem,
    organization_id,status,source
  )
  values (
    trim(_nome),
    nullif(trim(coalesce(_email,'')),''),
    nullif(trim(coalesce(_telefone,'')),''),
    _produto_id,
    nullif(trim(coalesce(_mensagem,'')),''),
    v_org_id,
    'novo',
    'site'
  )
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

create or replace function public.saas_usage(_organization_id uuid)
returns table(
  products_count bigint,
  leads_count bigint,
  members_count bigint,
  max_products integer,
  max_leads integer,
  max_members integer,
  plan_code text,
  plan_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.produtos p where p.organization_id = _organization_id),
    (select count(*) from public.leads l where l.organization_id = _organization_id),
    (select count(*) from public.organization_members m where m.organization_id = _organization_id),
    p.max_products, p.max_leads, p.max_members, p.code, p.name
  from public.organization_subscriptions s
  join public.saas_plans p on p.code = s.plan_code
  where s.organization_id = _organization_id
    and (
      public.is_organization_member(_organization_id)
      or public.has_role(auth.uid(),'admin'::public.app_role)
    );
$$;

create or replace function public.initialize_organization_from_legacy(_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Compatibilidade: se houver registros legados sem organization_id,
  -- eles podem ser clonados uma única vez para a loja recém-criada.
  if not exists (
    select 1 from public.organizations where id = _organization_id and status = 'active'
  ) then
    return;
  end if;

  insert into public.categorias(nome,slug,ordem,created_at,updated_at,organization_id)
  select c.nome, c.slug || '-' || substr(_organization_id::text,1,8),
         c.ordem, c.created_at, c.updated_at, _organization_id
  from public.categorias c
  where c.organization_id is null
    and not exists (
      select 1 from public.categorias x
      where x.organization_id = _organization_id and x.slug = c.slug
    );

  insert into public.produtos(
    id,titulo,slug,descricao,imagem_url,preco,preco_antigo,parcelamento,selo,desconto,
    desconto_cor,desconto_ativo,categoria_id,checkout_url,video_url,demo_url,whatsapp_url,
    popup_video_url,popup_video_tipo,popup_imagem_url,secao,tags,comprar_texto,comprar_cor,
    comprar_provedor,comprar_ativo,demo_texto,demo_cor,demo_ativo,destaque,ativo,ordem,
    created_at,updated_at,pix_icone,site_url,site_texto,site_cor,site_ativo,botoes_ordem,
    whatsapp_compartilhar_ativo,whatsapp_compartilhar_cor,whatsapp_compartilhar_texto,
    whatsapp_compartilhar_url,whatsapp_compartilhar_titulo,whatsapp_compartilhar_descricao,
    whatsapp_compartilhar_imagem_url,organization_id,whatsapp_compartilhar_mensagem,
    video_legenda_url,video_legenda_ativa
  )
  select
    gen_random_uuid(),
    p.titulo,
    case when p.slug is null then null else p.slug || '-' || substr(_organization_id::text,1,8) end,
    p.descricao,p.imagem_url,p.preco,p.preco_antigo,p.parcelamento,p.selo,p.desconto,
    p.desconto_cor,p.desconto_ativo,
    null,
    p.checkout_url,p.video_url,p.demo_url,p.whatsapp_url,p.popup_video_url,p.popup_video_tipo,
    p.popup_imagem_url,p.secao,p.tags,p.comprar_texto,p.comprar_cor,p.comprar_provedor,
    p.comprar_ativo,p.demo_texto,p.demo_cor,p.demo_ativo,p.destaque,p.ativo,p.ordem,
    p.created_at,p.updated_at,p.pix_icone,p.site_url,p.site_texto,p.site_cor,p.site_ativo,
    p.botoes_ordem,p.whatsapp_compartilhar_ativo,p.whatsapp_compartilhar_cor,
    p.whatsapp_compartilhar_texto,p.whatsapp_compartilhar_url,p.whatsapp_compartilhar_titulo,
    p.whatsapp_compartilhar_descricao,p.whatsapp_compartilhar_imagem_url,_organization_id,
    p.whatsapp_compartilhar_mensagem,p.video_legenda_url,p.video_legenda_ativa
  from public.produtos p
  where p.organization_id is null
    and not exists (
      select 1 from public.produtos x
      where x.organization_id = _organization_id
        and lower(trim(x.titulo)) = lower(trim(p.titulo))
    );
end;
$$;

create or replace function public.sync_products_from_main_store(_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source_org_id uuid;
  v_source_product record;
  v_new_category_id uuid;
begin
  if _organization_id is null then return; end if;

  select id into v_source_org_id
  from public.organizations
  where slug = 'ki-vitrine'
    and status = 'active'
  order by created_at asc
  limit 1;

  if v_source_org_id is null or v_source_org_id = _organization_id then
    return;
  end if;

  insert into public.categorias(nome,slug,ordem,organization_id)
  select c.nome,c.slug,c.ordem,_organization_id
  from public.categorias c
  where c.organization_id = v_source_org_id
    and not exists (
      select 1 from public.categorias t
      where t.organization_id = _organization_id and t.slug = c.slug
    );

  for v_source_product in
    select p.* from public.produtos p
    where p.organization_id = v_source_org_id
    order by p.ordem,p.titulo
  loop
    if exists (
      select 1 from public.produtos t
      where t.organization_id = _organization_id
        and (
          (t.slug is not null and v_source_product.slug is not null and t.slug = v_source_product.slug)
          or lower(trim(t.titulo)) = lower(trim(v_source_product.titulo))
        )
    ) then
      continue;
    end if;

    v_new_category_id := null;

    if v_source_product.categoria_id is not null then
      select t.id into v_new_category_id
      from public.categorias t
      where t.organization_id = _organization_id
        and t.slug = (
          select sc.slug from public.categorias sc
          where sc.id = v_source_product.categoria_id
            and sc.organization_id = v_source_org_id
          limit 1
        )
      limit 1;
    end if;

    insert into public.produtos(
      titulo,slug,descricao,imagem_url,preco,preco_antigo,parcelamento,selo,desconto,
      desconto_cor,desconto_ativo,categoria_id,checkout_url,video_url,demo_url,whatsapp_url,
      popup_video_url,popup_video_tipo,popup_imagem_url,secao,tags,comprar_texto,comprar_cor,
      comprar_provedor,comprar_ativo,demo_texto,demo_cor,demo_ativo,destaque,ativo,ordem,
      pix_icone,site_url,site_texto,site_cor,site_ativo,botoes_ordem,
      whatsapp_compartilhar_ativo,whatsapp_compartilhar_cor,whatsapp_compartilhar_texto,
      whatsapp_compartilhar_url,whatsapp_compartilhar_titulo,whatsapp_compartilhar_descricao,
      whatsapp_compartilhar_imagem_url,organization_id,whatsapp_compartilhar_mensagem,
      video_legenda_url,video_legenda_ativa
    )
    select
      titulo,slug,descricao,imagem_url,preco,preco_antigo,parcelamento,selo,desconto,
      desconto_cor,desconto_ativo,v_new_category_id,checkout_url,video_url,demo_url,whatsapp_url,
      popup_video_url,popup_video_tipo,popup_imagem_url,secao,tags,comprar_texto,comprar_cor,
      comprar_provedor,comprar_ativo,demo_texto,demo_cor,demo_ativo,destaque,ativo,ordem,
      pix_icone,site_url,site_texto,site_cor,site_ativo,botoes_ordem,
      whatsapp_compartilhar_ativo,whatsapp_compartilhar_cor,whatsapp_compartilhar_texto,
      whatsapp_compartilhar_url,whatsapp_compartilhar_titulo,whatsapp_compartilhar_descricao,
      whatsapp_compartilhar_imagem_url,_organization_id,whatsapp_compartilhar_mensagem,
      video_legenda_url,video_legenda_ativa
    from jsonb_populate_record(null::public.produtos, to_jsonb(v_source_product));
  end loop;
end;
$$;

create or replace function public.organizations_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

  -- Novas lojas recebem o mesmo banner de apresentação do YouTube da loja principal.
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
$$;