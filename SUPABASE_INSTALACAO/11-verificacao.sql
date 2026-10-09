-- PASSO 11 — verificação final
select 'TABELAS' as grupo, table_name
from information_schema.tables
where table_schema='public'
  and table_name in (
    'organizations','user_roles','saas_plans','organization_members',
    'organization_subscriptions','categorias','produtos','configuracoes',
    'leads','loja_backups'
  )
order by table_name;

select 'CONTAGENS' as grupo,
       (select count(*) from public.organizations) as organizations,
       (select count(*) from public.organization_members) as organization_members,
       (select count(*) from public.categorias) as categorias,
       (select count(*) from public.produtos) as produtos,
       (select count(*) from public.configuracoes) as configuracoes,
       (select count(*) from public.leads) as leads,
       (select count(*) from public.loja_backups) as backups;

select 'RLS' as grupo, schemaname, tablename, rowsecurity
from pg_tables
where schemaname='public'
  and tablename in (
    'organizations','user_roles','saas_plans','organization_members',
    'organization_subscriptions','categorias','produtos','configuracoes',
    'leads','loja_backups'
  )
order by tablename;

select 'LOJAS' as grupo, id, name, slug, status, owner_user_id
from public.organizations
order by created_at;

select 'MEMBROS' as grupo, organization_id, user_id, role
from public.organization_members
order by organization_id, user_id;

select 'BACKUPS' as grupo, organization_id, gerado_em, expira_em, origem
from public.loja_backups
order by gerado_em desc;

select 'CRON' as grupo,
       to_regclass('cron.job') as cron_table;

do $$
begin
  if to_regclass('cron.job') is not null then
    raise notice 'Jobs de backup: %',
      (select count(*) from cron.job where jobname='loja-backups-7d-60d' and active);
  else
    raise notice 'pg_cron não está disponível neste projeto.';
  end if;
end $$;

select 'STORAGE' as grupo, id, name, public
from storage.buckets
where id='loja';

select 'BANNERS' as grupo,
       o.slug,
       c.valor->>'video_url' as video_url,
       c.valor->>'controles' as controles
from public.organizations o
left join public.configuracoes c
  on c.organization_id=o.id
 and c.chave='banner'
where o.status='active'
order by o.slug;

select 'PUBLIC RPC' as grupo, routine_name, routine_type
from information_schema.routines
where routine_schema='public'
  and routine_name in (
    'public_produtos_por_loja',
    'public_categorias_por_loja',
    'public_configuracao_por_loja',
    'public_produto_por_loja',
    'criar_lead_publico',
    'criar_backup_da_loja',
    'criar_backup_pre_restauracao_da_loja',
    'excluir_backup_da_loja',
    'restaurar_backup_da_loja',
    'rotina_backups_60_dias'
  )
order by routine_name;
