-- Consultas somente de leitura para conferir a estrutura do banco.
-- Execute no SQL Editor do Supabase; não alteram tabelas nem dados.

-- 1. Tabelas public e estado do RLS.
select schemaname, tablename, rowsecurity as rls_habilitado
from pg_tables t
join pg_class c on c.relname = t.tablename
join pg_namespace n on n.oid = c.relnamespace
where schemaname = 'public'
order by tablename;

-- 2. Colunas, tipos, nulabilidade e defaults.
select table_name, ordinal_position, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- 3. Políticas RLS de public e Storage.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- 4. Funções public e SECURITY DEFINER.
select n.nspname as schema_name, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer, pg_get_userbyid(p.proowner) as owner
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

-- 5. Triggers não internos.
select n.nspname as schema_name, c.relname as table_name,
       t.tgname as trigger_name, p.proname as function_name
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal and n.nspname = 'public'
order by c.relname, t.tgname;

-- 6. Buckets e contagem de objetos (metadados; não baixa os arquivos).
select b.id as bucket_id, b.name, b.public,
       (select count(*) from storage.objects o where o.bucket_id=b.id) as object_count
from storage.buckets b
order by b.id;
