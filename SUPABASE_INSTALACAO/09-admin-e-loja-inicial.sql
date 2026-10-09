-- PASSO 9 — criar administrador e loja inicial
-- Ajuste somente o e-mail abaixo antes de rodar.
set app.admin_email = 'eu.adriano2031@gmail.com';

do $$
declare
  v_email text := current_setting('app.admin_email', true);
  v_user_id uuid;
  v_org_id uuid;
begin
  if v_email is null or trim(v_email) = '' then
    raise exception 'Defina app.admin_email no passo 9.';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(trim(v_email))
  limit 1;

  if v_user_id is null then
    raise exception 'Usuário admin não encontrado em auth.users para o e-mail %. Crie o usuário primeiro.', v_email;
  end if;

  insert into public.user_roles(user_id,role)
  values(v_user_id,'admin')
  on conflict (user_id,role) do nothing;

  select id into v_org_id
  from public.organizations
  where lower(slug) = 'ki-vitrine'
  limit 1;

  if v_org_id is null then
    insert into public.organizations(
      owner_user_id,name,slug,description,primary_color,status
    )
    values(
      v_user_id,
      'KI-VITRINE',
      'ki-vitrine',
      'Loja principal da G-Vitrine.',
      '#16a34a',
      'active'
    )
    returning id into v_org_id;
  end if;

  insert into public.organization_members(organization_id,user_id,role)
  values(v_org_id,v_user_id,'owner')
  on conflict (organization_id,user_id)
  do update set role='owner';

  insert into public.organization_subscriptions(organization_id,plan_code,status)
  values(v_org_id,'free','active')
  on conflict (organization_id)
  do update set plan_code='free', status='active', updated_at=now();

  raise notice 'Admin configurado. organization_id=%', v_org_id;
end $$;
