-- PASSO 5 — grants, RLS e políticas por loja
grant usage on type public.app_role to authenticated, service_role;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

grant select on public.organizations to anon, authenticated;
grant insert, update, delete on public.organizations to authenticated;
grant all on public.organizations to service_role;

grant select on public.saas_plans to anon, authenticated;
grant all on public.saas_plans to service_role;

grant select, insert, update, delete on public.organization_members to authenticated;
grant all on public.organization_members to service_role;

grant select on public.organization_subscriptions to authenticated;
grant all on public.organization_subscriptions to service_role;

grant select on public.categorias to anon, authenticated;
grant insert, update, delete on public.categorias to authenticated;
grant all on public.categorias to service_role;

grant select on public.produtos to anon, authenticated;
grant insert, update, delete on public.produtos to authenticated;
grant all on public.produtos to service_role;

grant select on public.configuracoes to anon, authenticated;
grant insert, update, delete on public.configuracoes to authenticated;
grant all on public.configuracoes to service_role;

grant insert on public.leads to anon, authenticated;
grant select, delete on public.leads to authenticated;
grant all on public.leads to service_role;

grant select on public.loja_backups to authenticated;
grant delete on public.loja_backups to authenticated;
grant all on public.loja_backups to service_role;

alter table public.user_roles enable row level security;
alter table public.organizations enable row level security;
alter table public.saas_plans enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_subscriptions enable row level security;
alter table public.categorias enable row level security;
alter table public.produtos enable row level security;
alter table public.configuracoes enable row level security;
alter table public.leads enable row level security;
alter table public.loja_backups enable row level security;

do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'user_roles','organizations','saas_plans','organization_members',
        'organization_subscriptions','categorias','produtos','configuracoes',
        'leads','loja_backups'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

create policy "Users can view their own roles"
on public.user_roles for select to authenticated
using (auth.uid() = user_id);

create policy "Active organizations are public"
on public.organizations for select to anon, authenticated
using (status = 'active');

create policy "Users can create their own organization"
on public.organizations for insert to authenticated
with check (owner_user_id = auth.uid());

create policy "Organization owners and admins can update"
on public.organizations for update to authenticated
using (owner_user_id = auth.uid() or public.is_organization_admin(id))
with check (owner_user_id = auth.uid() or public.is_organization_admin(id));

create policy "Organization owners can delete"
on public.organizations for delete to authenticated
using (owner_user_id = auth.uid());

create policy "SaaS plans are public"
on public.saas_plans for select to anon, authenticated
using (active = true);

create policy "Organization members can view members"
on public.organization_members for select to authenticated
using (public.is_organization_member(organization_id) or public.has_role(auth.uid(),'admin'));

create policy "Organization admins manage member inserts"
on public.organization_members for insert to authenticated
with check (public.is_organization_admin(organization_id) or public.has_role(auth.uid(),'admin'));

create policy "Organization admins manage member updates"
on public.organization_members for update to authenticated
using (public.is_organization_admin(organization_id) or public.has_role(auth.uid(),'admin'))
with check (public.is_organization_admin(organization_id) or public.has_role(auth.uid(),'admin'));

create policy "Organization admins manage member deletes"
on public.organization_members for delete to authenticated
using (public.is_organization_admin(organization_id) or public.has_role(auth.uid(),'admin'));

create policy "Members can view their subscription"
on public.organization_subscriptions for select to authenticated
using (public.is_organization_member(organization_id) or public.has_role(auth.uid(),'admin'));

create policy "Public categories of active stores"
on public.categorias for select to anon
using (
  organization_id is null
  or public.is_organization_active(organization_id)
);

create policy "Authenticated categories scoped to store"
on public.categorias for select to authenticated
using (
  organization_id is null
  or public.has_role(auth.uid(),'admin')
  or public.is_organization_member(organization_id)
);

create policy "Category admins insert"
on public.categorias for insert to authenticated
with check (
  public.has_role(auth.uid(),'admin')
  or (organization_id is not null and public.is_organization_admin(organization_id))
);

create policy "Category admins update"
on public.categorias for update to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or (organization_id is not null and public.is_organization_admin(organization_id))
)
with check (
  public.has_role(auth.uid(),'admin')
  or (organization_id is not null and public.is_organization_admin(organization_id))
);

create policy "Category admins delete"
on public.categorias for delete to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or (organization_id is not null and public.is_organization_admin(organization_id))
);

create policy "Public active products of active stores"
on public.produtos for select to anon
using (
  ativo = true
  and (organization_id is null or public.is_organization_active(organization_id))
);

create policy "Authenticated products scoped to store"
on public.produtos for select to authenticated
using (
  organization_id is null
  or public.has_role(auth.uid(),'admin')
  or public.is_organization_member(organization_id)
);

create policy "Product admins insert"
on public.produtos for insert to authenticated
with check (
  public.has_role(auth.uid(),'admin')
  or (organization_id is not null and public.is_organization_admin(organization_id))
);

create policy "Product admins update"
on public.produtos for update to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or (organization_id is not null and public.is_organization_admin(organization_id))
)
with check (
  public.has_role(auth.uid(),'admin')
  or (organization_id is not null and public.is_organization_admin(organization_id))
);

create policy "Product admins delete"
on public.produtos for delete to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or (organization_id is not null and public.is_organization_admin(organization_id))
);

create policy "Public configs of active stores"
on public.configuracoes for select to anon
using (
  organization_id is null
  or (
    public.is_organization_active(organization_id)
    and chave in ('banner','ajuda','marca','card_textos','compartilhamento','produto_beneficios','categoria_botoes','botao_ver_mais','titulos_secoes','rodape','favicon')
  )
);

create policy "Authenticated configs scoped to store"
on public.configuracoes for select to authenticated
using (
  organization_id is null
  or public.has_role(auth.uid(),'admin')
  or public.is_organization_member(organization_id)
);

create policy "Config admins insert"
on public.configuracoes for insert to authenticated
with check (
  public.has_role(auth.uid(),'admin')
  or (organization_id is not null and public.is_organization_admin(organization_id))
);

create policy "Config admins update"
on public.configuracoes for update to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or (organization_id is not null and public.is_organization_admin(organization_id))
)
with check (
  public.has_role(auth.uid(),'admin')
  or (organization_id is not null and public.is_organization_admin(organization_id))
);

create policy "Config admins delete"
on public.configuracoes for delete to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or (organization_id is not null and public.is_organization_admin(organization_id))
);

create policy "Public legacy lead inserts"
on public.leads for insert to anon, authenticated
with check (organization_id is null);

create policy "Public store lead inserts"
on public.leads for insert to anon, authenticated
with check (
  organization_id is not null
  and public.is_organization_active(organization_id)
);

create policy "Lead admins view"
on public.leads for select to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or (organization_id is not null and public.is_organization_admin(organization_id))
);

create policy "Lead admins delete"
on public.leads for delete to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or (organization_id is not null and public.is_organization_admin(organization_id))
);

create policy "Backup admins view"
on public.loja_backups for select to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or public.is_organization_admin(organization_id)
);

create policy "Backup admins insert"
on public.loja_backups for insert to authenticated
with check (
  (
    public.has_role(auth.uid(),'admin')
    or public.is_organization_admin(organization_id)
  )
  and (criado_por is null or criado_por = auth.uid())
);

create policy "Backup admins delete"
on public.loja_backups for delete to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or public.is_organization_admin(organization_id)
);


grant execute on function public.is_organization_active(uuid) to anon, authenticated, service_role;

revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.produtos_set_slug() from public, anon, authenticated;
