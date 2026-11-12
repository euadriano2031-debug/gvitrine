-- PASSO 2 — estrutura completa multi-loja
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text not null default '',
  logo_url text,
  primary_color text not null default '#16a34a',
  custom_domain text,
  status text not null default 'active' check (status in ('active','suspended','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.saas_plans (
  code text primary key,
  name text not null,
  description text not null default '',
  price_monthly numeric(10,2) not null default 0,
  max_products integer not null default 20,
  max_leads integer not null default 100,
  max_members integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer'
    check (role in ('owner','admin','editor','viewer')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_code text not null default 'free' references public.saas_plans(code),
  status text not null default 'active'
    check (status in ('trialing','active','past_due','cancelled')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  external_customer_id text,
  external_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid references public.organizations(id) on delete cascade,
  unique (organization_id, slug)
);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  slug text,
  descricao text not null default '',
  imagem_url text,
  preco numeric(10,2) not null default 0,
  preco_antigo numeric(10,2),
  parcelamento text,
  selo text,
  desconto text,
  desconto_cor text not null default '#f97316',
  desconto_ativo boolean not null default true,
  categoria_id uuid references public.categorias(id) on delete set null,
  checkout_url text,
  video_url text,
  demo_url text,
  whatsapp_url text,
  popup_video_url text,
  popup_video_tipo text not null default 'auto',
  popup_imagem_url text,
  secao text not null default 'vitrine',
  tags text[] not null default '{}',
  comprar_texto text not null default 'Comprar',
  comprar_cor text not null default '#3b82f6',
  comprar_provedor text not null default 'personalizado',
  comprar_ativo boolean not null default true,
  demo_texto text not null default 'Ver Demo',
  demo_cor text not null default '#dc2626',
  demo_ativo boolean not null default true,
  destaque boolean not null default false,
  ativo boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  pix_icone text not null default 'pix',
  site_url text,
  site_texto text not null default 'Ver Site',
  site_cor text not null default '#16a34a',
  site_ativo boolean not null default true,
  botoes_ordem text[] not null default array['comprar','video','site','whatsapp'],
  whatsapp_compartilhar_ativo boolean not null default true,
  whatsapp_compartilhar_cor text not null default '#25D366',
  whatsapp_compartilhar_texto text not null default 'Compartilhar no WhatsApp',
  whatsapp_compartilhar_url text,
  whatsapp_compartilhar_titulo text,
  whatsapp_compartilhar_descricao text,
  whatsapp_compartilhar_imagem_url text,
  organization_id uuid references public.organizations(id) on delete cascade,
  whatsapp_compartilhar_mensagem text,
  video_legenda_url text,
  video_legenda_ativa boolean not null default true
);

create unique index if not exists produtos_org_slug_uidx
  on public.produtos (organization_id, slug)
  where slug is not null;

create index if not exists produtos_categoria_idx on public.produtos(categoria_id);
create index if not exists produtos_org_ordem_idx on public.produtos(organization_id, ordem);

create table if not exists public.configuracoes (
  id uuid primary key default gen_random_uuid(),
  chave text not null,
  valor jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid references public.organizations(id) on delete cascade,
  unique (organization_id, chave)
);

create unique index if not exists configuracoes_organization_chave_uidx
  on public.configuracoes (organization_id, chave);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  telefone text,
  produto_id uuid references public.produtos(id) on delete set null,
  mensagem text,
  created_at timestamptz not null default now(),
  organization_id uuid references public.organizations(id) on delete cascade,
  status text,
  source text,
  page_url text
);

create index if not exists leads_org_created_idx on public.leads(organization_id, created_at desc);

create table if not exists public.loja_backups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  gerado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '60 days'),
  checksum text not null,
  origem text not null default 'manual'
    check (origem in ('automatico','manual','pre_restauracao')),
  criado_por uuid references auth.users(id) on delete set null,
  payload jsonb not null
);

create index if not exists loja_backups_org_gerado_idx
  on public.loja_backups(organization_id, gerado_em desc);
create index if not exists loja_backups_expira_idx
  on public.loja_backups(expira_em);
