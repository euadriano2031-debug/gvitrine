-- PASSO 4 — triggers
drop trigger if exists organizations_after_insert on public.organizations;
create trigger organizations_after_insert
after insert on public.organizations
for each row execute function public.organizations_after_insert();

drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists produtos_slug_trigger on public.produtos;
create trigger produtos_slug_trigger
before insert or update on public.produtos
for each row execute function public.produtos_set_slug();

drop trigger if exists produtos_updated_at on public.produtos;
create trigger produtos_updated_at
before update on public.produtos
for each row execute function public.set_updated_at();

drop trigger if exists categorias_updated_at on public.categorias;
create trigger categorias_updated_at
before update on public.categorias
for each row execute function public.set_updated_at();

drop trigger if exists configuracoes_updated_at on public.configuracoes;
create trigger configuracoes_updated_at
before update on public.configuracoes
for each row execute function public.set_updated_at();

drop trigger if exists organization_subscriptions_updated_at on public.organization_subscriptions;
create trigger organization_subscriptions_updated_at
before update on public.organization_subscriptions
for each row execute function public.set_updated_at();
