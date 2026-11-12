-- Funções do schema public capturadas em 2026-11-12.
-- Revisar grants/EXECUTE e SECURITY DEFINER antes de restaurar.

CREATE OR REPLACE FUNCTION public._criar_backup_da_loja_com_origem(_organization_id uuid, _origem text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_payload jsonb;
  v_checksum text;
  v_id uuid;
  v_origem text;
begin
  if not (
    public.has_role(auth.uid(),'admin'::public.app_role)
    or public.is_organization_admin(_organization_id)
  ) then
    raise exception 'Apenas administradores da loja podem criar backups.';
  end if;

  v_origem := case
    when _origem in ('manual','automatico','pre_restauracao') then _origem
    else 'manual'
  end;

  v_payload := public.gerar_payload_backup_loja(_organization_id);
  v_checksum := encode(extensions.digest(v_payload::text,'sha256'),'hex');

  insert into public.loja_backups(
    organization_id,gerado_em,expira_em,checksum,origem,criado_por,payload
  )
  values(
    _organization_id,now(),now()+interval '60 days',
    v_checksum,v_origem,auth.uid(),v_payload
  )
  returning id into v_id;

  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.criar_backup_da_loja(_organization_id uuid)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public._criar_backup_da_loja_com_origem(_organization_id,'manual');
$function$;

CREATE OR REPLACE FUNCTION public.criar_backup_pre_restauracao_da_loja(_organization_id uuid)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public._criar_backup_da_loja_com_origem(_organization_id,'pre_restauracao');
$function$;

CREATE OR REPLACE FUNCTION public.criar_lead_publico(_organization_slug text, _nome text, _email text DEFAULT NULL::text, _telefone text DEFAULT NULL::text, _mensagem text DEFAULT NULL::text, _produto_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.crm_preencher_valores_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.crm_estimated_value IS NULL AND NEW.produto_id IS NOT NULL THEN
    SELECT p.preco
      INTO NEW.crm_estimated_value
    FROM public.produtos p
    WHERE p.id = NEW.produto_id
      AND p.organization_id = NEW.organization_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.excluir_backup_da_loja(_organization_id uuid, _backup_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_deleted integer := 0;
begin
  if not (
    public.has_role(auth.uid(),'admin'::public.app_role)
    or public.is_organization_admin(_organization_id)
  ) then
    raise exception 'Apenas administradores da loja podem excluir backups.';
  end if;

  if _organization_id is null or _backup_id is null then
    raise exception 'Loja ou backup inválido.';
  end if;

  delete from public.loja_backups
  where id = _backup_id
    and organization_id = _organization_id;

  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    raise exception 'Backup não encontrado para esta loja.';
  end if;

  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.gerar_payload_backup_loja(_organization_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  select jsonb_build_object(
    'backup_version', 1,
    'gerado_em', now(),
    'organization_id', _organization_id,
    'organization', (
      select to_jsonb(o) from public.organizations o where o.id = _organization_id
    ),
    'categorias', (
      select coalesce(
        jsonb_agg(to_jsonb(c) order by c.ordem,c.id),
        '[]'::jsonb
      )
      from public.categorias c
      where c.organization_id = _organization_id
    ),
    'produtos', (
      select coalesce(
        jsonb_agg(to_jsonb(p) order by p.ordem,p.created_at,p.id),
        '[]'::jsonb
      )
      from public.produtos p
      where p.organization_id = _organization_id
    ),
    'configuracoes', (
      select coalesce(
        jsonb_agg(to_jsonb(c) order by c.chave,c.id),
        '[]'::jsonb
      )
      from public.configuracoes c
      where c.organization_id = _organization_id
    ),
    'leads', (
      select coalesce(
        jsonb_agg(to_jsonb(l) order by l.created_at,l.id),
        '[]'::jsonb
      )
      from public.leads l
      where l.organization_id = _organization_id
    )
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT _user_id = auth.uid()
     AND EXISTS (
       SELECT 1
       FROM public.user_roles ur
       WHERE ur.user_id = _user_id
         AND ur.role = _role
     )
     AND (
       _role <> 'admin'::public.app_role
       OR (
         NOT EXISTS (
           SELECT 1 FROM public.organization_members m
           WHERE m.user_id = _user_id
         )
         AND NOT EXISTS (
           SELECT 1 FROM public.organizations o
           WHERE o.owner_user_id = _user_id
         )
       )
     );
$function$;

CREATE OR REPLACE FUNCTION public.initialize_organization_from_legacy(_organization_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.is_organization_active(_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.organizations
    where id = _organization_id
      and status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_organization_admin(_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.organization_members
    where organization_id = _organization_id
      and user_id = auth.uid()
      and role in ('owner','admin')
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_organization_member(_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.organization_members
    where organization_id = _organization_id
      and user_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.normalizar_campos_crm_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.crm_stage := COALESCE(NULLIF(trim(NEW.crm_stage), ''), 'novo');
  IF NEW.crm_stage NOT IN ('novo','contato','qualificado','proposta','negociacao','ganho','perdido') THEN
    RAISE EXCEPTION 'Etapa de CRM inválida.';
  END IF;

  NEW.crm_priority := COALESCE(NULLIF(trim(NEW.crm_priority), ''), 'media');
  IF NEW.crm_priority NOT IN ('baixa','media','alta','urgente') THEN
    RAISE EXCEPTION 'Prioridade de CRM inválida.';
  END IF;

  IF NEW.crm_estimated_value IS NOT NULL AND NEW.crm_estimated_value < 0 THEN
    RAISE EXCEPTION 'O valor estimado não pode ser negativo.';
  END IF;

  IF NEW.crm_final_value IS NOT NULL AND NEW.crm_final_value < 0 THEN
    RAISE EXCEPTION 'O valor fechado não pode ser negativo.';
  END IF;

  -- When a deal is marked won, initialize the closed amount from the estimate
  -- unless the operator supplied an explicit closing amount.
  IF NEW.crm_stage = 'ganho' AND NEW.crm_final_value IS NULL THEN
    NEW.crm_final_value := NEW.crm_estimated_value;
  END IF;

  NEW.crm_updated_at := now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.organizations_after_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.produtos_set_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.public_categorias_por_loja(_organization_slug text)
 RETURNS SETOF jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select to_jsonb(c)
  from public.categorias c
  join public.organizations o on o.id = c.organization_id
  where o.slug = trim(_organization_slug)
    and o.status = 'active'
  order by c.ordem, c.nome, c.id;
$function$;

CREATE OR REPLACE FUNCTION public.public_configuracao_por_loja(_organization_slug text, _chave text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.public_produto_por_loja(_organization_slug text, _product_slug text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select to_jsonb(p)
  from public.produtos p
  join public.organizations o on o.id = p.organization_id
  where o.slug = trim(_organization_slug)
    and o.status = 'active'
    and p.slug = _product_slug
    and p.ativo = true
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.public_produtos_por_loja(_organization_slug text)
 RETURNS SETOF jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select to_jsonb(p)
  from public.produtos p
  join public.organizations o on o.id = p.organization_id
  where o.slug = trim(_organization_slug)
    and o.status = 'active'
    and p.ativo = true
  order by p.ordem, p.created_at, p.id;
$function$;

CREATE OR REPLACE FUNCTION public.restaurar_backup_da_loja(_organization_id uuid, _payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_source_org_id uuid;
  v_source_slug text;
  v_org jsonb;
  v_categories integer := 0;
  v_products integer := 0;
  v_configs integer := 0;
  v_leads integer := 0;
BEGIN
  IF _organization_id IS NULL THEN
    RAISE EXCEPTION 'Loja inválida.';
  END IF;

  IF NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_organization_admin(_organization_id)
  ) THEN
    RAISE EXCEPTION 'Apenas administradores desta loja podem restaurar backups.';
  END IF;

  IF _payload IS NULL OR jsonb_typeof(_payload) <> 'object'
     OR jsonb_typeof(_payload->'organization') <> 'object' THEN
    RAISE EXCEPTION 'Arquivo de backup inválido: organização ausente.';
  END IF;

  IF _payload->>'organization_id' IS DISTINCT FROM _organization_id::text THEN
    RAISE EXCEPTION 'Este backup pertence a outra loja e não pode ser restaurado nesta loja.';
  END IF;

  v_source_org_id := NULLIF(_payload->'organization'->>'id', '')::uuid;
  v_source_slug := NULLIF(trim(_payload->'organization'->>'slug'), '');

  IF v_source_org_id IS DISTINCT FROM _organization_id THEN
    RAISE EXCEPTION 'Este backup pertence a outra loja e não pode ser restaurado nesta loja.';
  END IF;

  IF v_source_slug IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.slug = v_source_slug
      AND o.id <> _organization_id
  ) THEN
    RAISE EXCEPTION 'O slug do backup já pertence a outra loja.';
  END IF;

  IF NULLIF(trim(_payload->'organization'->>'custom_domain'), '') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM public.organizations o
       WHERE o.custom_domain = NULLIF(trim(_payload->'organization'->>'custom_domain'), '')
         AND o.id <> _organization_id
     ) THEN
    RAISE EXCEPTION 'O domínio personalizado do backup já pertence a outra loja.';
  END IF;

  IF jsonb_typeof(_payload->'categorias') <> 'array'
     OR jsonb_typeof(_payload->'produtos') <> 'array'
     OR jsonb_typeof(_payload->'configuracoes') <> 'array'
     OR jsonb_typeof(_payload->'leads') <> 'array' THEN
    RAISE EXCEPTION 'Arquivo de backup inválido: seções obrigatórias ausentes.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(_payload->'categorias') AS x(item)
    WHERE jsonb_typeof(x.item) <> 'object'
       OR x.item->>'organization_id' IS DISTINCT FROM _organization_id::text
  ) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(_payload->'produtos') AS x(item)
    WHERE jsonb_typeof(x.item) <> 'object'
       OR x.item->>'organization_id' IS DISTINCT FROM _organization_id::text
  ) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(_payload->'configuracoes') AS x(item)
    WHERE jsonb_typeof(x.item) <> 'object'
       OR x.item->>'organization_id' IS DISTINCT FROM _organization_id::text
  ) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(_payload->'leads') AS x(item)
    WHERE jsonb_typeof(x.item) <> 'object'
       OR x.item->>'organization_id' IS DISTINCT FROM _organization_id::text
  ) THEN
    RAISE EXCEPTION 'O backup contém registros que não pertencem a esta loja.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(_payload->'produtos') AS p(item)
    WHERE NULLIF(p.item->>'categoria_id', '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(_payload->'categorias') AS c(item)
        WHERE c.item->>'id' = p.item->>'categoria_id'
          AND c.item->>'organization_id' = _organization_id::text
      )
  ) THEN
    RAISE EXCEPTION 'O backup contém produtos vinculados a categorias de outra loja.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(_payload->'leads') AS l(item)
    WHERE NULLIF(l.item->>'produto_id', '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(_payload->'produtos') AS p(item)
        WHERE p.item->>'id' = l.item->>'produto_id'
          AND p.item->>'organization_id' = _organization_id::text
      )
  ) THEN
    RAISE EXCEPTION 'O backup contém contatos vinculados a produtos de outra loja.';
  END IF;

  v_org := _payload->'organization';

  UPDATE public.organizations
  SET name = COALESCE(v_org->>'name', name),
      slug = COALESCE(v_source_slug, slug),
      description = COALESCE(v_org->>'description', description),
      logo_url = CASE WHEN v_org ? 'logo_url' THEN v_org->>'logo_url' ELSE logo_url END,
      primary_color = COALESCE(v_org->>'primary_color', primary_color),
      custom_domain = CASE WHEN v_org ? 'custom_domain' THEN v_org->>'custom_domain' ELSE custom_domain END,
      updated_at = now()
  WHERE id = _organization_id;

  DELETE FROM public.leads WHERE organization_id = _organization_id;
  DELETE FROM public.produtos WHERE organization_id = _organization_id;
  DELETE FROM public.categorias WHERE organization_id = _organization_id;
  DELETE FROM public.configuracoes WHERE organization_id = _organization_id;

  INSERT INTO public.categorias
  SELECT * FROM jsonb_populate_recordset(NULL::public.categorias, _payload->'categorias');
  GET DIAGNOSTICS v_categories = ROW_COUNT;

  INSERT INTO public.produtos
  SELECT * FROM jsonb_populate_recordset(NULL::public.produtos, _payload->'produtos');
  GET DIAGNOSTICS v_products = ROW_COUNT;

  INSERT INTO public.configuracoes
  SELECT * FROM jsonb_populate_recordset(NULL::public.configuracoes, _payload->'configuracoes');
  GET DIAGNOSTICS v_configs = ROW_COUNT;

  INSERT INTO public.leads
  SELECT * FROM jsonb_populate_recordset(NULL::public.leads, _payload->'leads');
  GET DIAGNOSTICS v_leads = ROW_COUNT;

  RETURN jsonb_build_object(
    'restaurado', true,
    'organization_id', _organization_id,
    'categorias', v_categories,
    'produtos', v_products,
    'configuracoes', v_configs,
    'leads', v_leads,
    'restaurado_em', now()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.rotina_backups_60_dias()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $function$
declare
  v_count integer := 0;
  v_org record;
  v_cycle_start timestamptz;
  v_latest_auto timestamptz;
  v_payload jsonb;
  v_checksum text;
begin
  for v_org in
    select id from public.organizations where status='active'
  loop
    select
      min(gerado_em) filter (where origem='automatico'),
      max(gerado_em) filter (where origem='automatico')
    into v_cycle_start,v_latest_auto
    from public.loja_backups
    where organization_id=v_org.id;

    if v_cycle_start is not null
       and now() >= v_cycle_start + interval '60 days' then
      delete from public.loja_backups
      where organization_id=v_org.id;

      v_payload := public.gerar_payload_backup_loja(v_org.id);
      v_checksum := encode(extensions.digest(v_payload::text,'sha256'),'hex');

      insert into public.loja_backups(
        organization_id,gerado_em,expira_em,checksum,origem,criado_por,payload
      )
      values(
        v_org.id,now(),now()+interval '60 days',
        v_checksum,'automatico',null,v_payload
      );

      v_count := v_count + 1;
      continue;
    end if;

    if v_latest_auto is null
       or now() >= v_latest_auto + interval '7 days' then
      v_payload := public.gerar_payload_backup_loja(v_org.id);
      v_checksum := encode(extensions.digest(v_payload::text,'sha256'),'hex');

      insert into public.loja_backups(
        organization_id,gerado_em,expira_em,checksum,origem,criado_por,payload
      )
      values(
        v_org.id,now(),now()+interval '60 days',
        v_checksum,'automatico',null,v_payload
      );

      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.saas_usage(_organization_id uuid)
 RETURNS TABLE(products_count bigint, leads_count bigint, members_count bigint, max_products integer, max_leads integer, max_members integer, plan_code text, plan_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    (SELECT count(*) FROM public.produtos p WHERE p.organization_id = _organization_id),
    (SELECT count(*) FROM public.leads l WHERE l.organization_id = _organization_id),
    (SELECT count(*) FROM public.organization_members m WHERE m.organization_id = _organization_id),
    p.max_products, p.max_leads, p.max_members, p.code, p.name
  FROM public.organization_subscriptions s
  JOIN public.saas_plans p ON p.code = s.plan_code
  WHERE s.organization_id = _organization_id
    AND (
      public.is_organization_member(_organization_id)
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    );
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.slugify(_txt text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select trim(
    both '-' from regexp_replace(
      lower(public.unaccent_fallback(_txt)),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
$function$;

CREATE OR REPLACE FUNCTION public.sync_products_from_main_store(_organization_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.unaccent_fallback(_txt text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select translate(
    _txt,
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
  );
$function$;

CREATE OR REPLACE FUNCTION public.validar_atividade_crm_mesma_loja()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = NEW.lead_id
      AND l.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'O contato selecionado não pertence a esta loja.';
  END IF;

  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validar_categoria_da_mesma_loja()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Todo produto precisa pertencer a uma loja.';
  END IF;

  IF NEW.categoria_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.categorias c
       WHERE c.id = NEW.categoria_id
         AND c.organization_id = NEW.organization_id
     ) THEN
    RAISE EXCEPTION 'A categoria selecionada não pertence a esta loja.';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validar_produto_do_lead_mesma_loja()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Todo contato precisa estar associado a uma loja.';
  END IF;

  IF NEW.produto_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.produtos p
       WHERE p.id = NEW.produto_id
         AND p.organization_id = NEW.organization_id
     ) THEN
    RAISE EXCEPTION 'O produto associado ao contato não pertence a esta loja.';
  END IF;

  RETURN NEW;
END;
$function$;