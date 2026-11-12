-- PASSO 8 — backup individual por organização
create or replace function public.gerar_payload_backup_loja(_organization_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
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
$$;

create or replace function public._criar_backup_da_loja_com_origem(
  _organization_id uuid,
  _origem text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
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
$$;

create or replace function public.criar_backup_da_loja(_organization_id uuid)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public._criar_backup_da_loja_com_origem(_organization_id,'manual');
$$;

create or replace function public.criar_backup_pre_restauracao_da_loja(_organization_id uuid)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public._criar_backup_da_loja_com_origem(_organization_id,'pre_restauracao');
$$;

create or replace function public.restaurar_backup_da_loja(
  _organization_id uuid,
  _payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source_org_id uuid;
  v_source_slug text;
  v_org jsonb;
  v_categories integer := 0;
  v_products integer := 0;
  v_configs integer := 0;
  v_leads integer := 0;
begin
  if not (
    public.has_role(auth.uid(),'admin'::public.app_role)
    or public.is_organization_admin(_organization_id)
  ) then
    raise exception 'Apenas administradores da loja podem restaurar backups.';
  end if;

  if jsonb_typeof(_payload) <> 'object'
     or jsonb_typeof(_payload->'organization') <> 'object' then
    raise exception 'Arquivo de backup inválido: organização ausente.';
  end if;

  v_source_org_id := nullif(_payload->'organization'->>'id','')::uuid;
  v_source_slug := nullif(trim(_payload->'organization'->>'slug'),'');

  if v_source_org_id is distinct from _organization_id then
    raise exception 'Este backup pertence a outra loja e não pode ser restaurado nesta loja.';
  end if;

  if v_source_slug is not null and exists (
    select 1 from public.organizations o
    where o.slug = v_source_slug and o.id <> _organization_id
  ) then
    raise exception 'O slug do backup já pertence a outra loja.';
  end if;

  if jsonb_typeof(_payload->'categorias') <> 'array'
     or jsonb_typeof(_payload->'produtos') <> 'array'
     or jsonb_typeof(_payload->'configuracoes') <> 'array'
     or jsonb_typeof(_payload->'leads') <> 'array' then
    raise exception 'Arquivo de backup inválido: seções obrigatórias ausentes.';
  end if;

  v_org := _payload->'organization';

  update public.organizations
  set name = coalesce(v_org->>'name',name),
      slug = coalesce(v_source_slug,slug),
      description = coalesce(v_org->>'description',description),
      logo_url = case when v_org ? 'logo_url' then v_org->>'logo_url' else logo_url end,
      primary_color = coalesce(v_org->>'primary_color',primary_color),
      custom_domain = case when v_org ? 'custom_domain' then v_org->>'custom_domain' else custom_domain end,
      updated_at = now()
  where id = _organization_id;

  delete from public.leads where organization_id = _organization_id;
  delete from public.produtos where organization_id = _organization_id;
  delete from public.categorias where organization_id = _organization_id;
  delete from public.configuracoes where organization_id = _organization_id;

  insert into public.categorias
  select * from jsonb_populate_recordset(null::public.categorias,_payload->'categorias');
  get diagnostics v_categories = row_count;

  insert into public.produtos
  select * from jsonb_populate_recordset(null::public.produtos,_payload->'produtos');
  get diagnostics v_products = row_count;

  insert into public.configuracoes
  select * from jsonb_populate_recordset(null::public.configuracoes,_payload->'configuracoes');
  get diagnostics v_configs = row_count;

  insert into public.leads
  select * from jsonb_populate_recordset(null::public.leads,_payload->'leads');
  get diagnostics v_leads = row_count;

  return jsonb_build_object(
    'restaurado',true,
    'organization_id',_organization_id,
    'categorias',v_categories,
    'produtos',v_products,
    'configuracoes',v_configs,
    'leads',v_leads,
    'restaurado_em',now()
  );
end;
$$;

create or replace function public.rotina_backups_60_dias()
returns integer
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
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
$$;

create or replace function public.excluir_backup_da_loja(
  _organization_id uuid,
  _backup_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
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
$$;

revoke all on function public.gerar_payload_backup_loja(uuid) from public,anon,authenticated;
revoke all on function public._criar_backup_da_loja_com_origem(uuid,text) from public,anon,authenticated;
revoke all on function public.rotina_backups_60_dias() from public,anon,authenticated;
revoke all on function public.criar_backup_da_loja(uuid) from public,anon;
revoke all on function public.criar_backup_pre_restauracao_da_loja(uuid) from public,anon;
revoke all on function public.restaurar_backup_da_loja(uuid,jsonb) from public,anon;
revoke all on function public.excluir_backup_da_loja(uuid,uuid) from public,anon;

grant execute on function public.criar_backup_da_loja(uuid) to authenticated,service_role;
grant execute on function public.criar_backup_pre_restauracao_da_loja(uuid) to authenticated,service_role;
grant execute on function public.restaurar_backup_da_loja(uuid,jsonb) to authenticated,service_role;
grant execute on function public.excluir_backup_da_loja(uuid,uuid) to authenticated,service_role;
grant execute on function public.gerar_payload_backup_loja(uuid) to service_role;

do $$
begin
  if to_regclass('cron.job') is not null then
    begin
      if exists (select 1 from cron.job where jobname='loja-backups-7d-60d') then
        perform cron.unschedule(jobid)
        from cron.job
        where jobname='loja-backups-7d-60d';
      end if;

      perform cron.schedule(
        'loja-backups-7d-60d',
        '17 6 * * *',
        'select public.rotina_backups_60_dias();'
      );
    exception when others then
      raise notice 'Não foi possível registrar o cron do backup: %', sqlerrm;
    end;
  else
    raise notice 'cron.job não existe; o backup manual continuará funcionando.';
  end if;
end $$;
