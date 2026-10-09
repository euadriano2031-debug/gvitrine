-- PASSO 7 — Storage privado por loja e atualização em tempo real das configurações.
-- O nome do arquivo deve começar pelo UUID da organização: <organization_id>/arquivo.
insert into storage.buckets(id, name, public)
values ('loja', 'loja', false)
on conflict (id) do update set public = false;

drop policy if exists "Admins gerenciam arquivos da loja" on storage.objects;

create policy "Admins gerenciam arquivos da loja"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'loja'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.is_organization_admin(split_part(name, '/', 1)::uuid)
  )
)
with check (
  bucket_id = 'loja'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.is_organization_admin(split_part(name, '/', 1)::uuid)
  )
);

-- Habilita Realtime de maneira idempotente, quando a publicação existe.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'configuracoes'
     ) then
    execute 'alter publication supabase_realtime add table public.configuracoes';
  end if;
exception
  when duplicate_object then
    null;
end $$;
