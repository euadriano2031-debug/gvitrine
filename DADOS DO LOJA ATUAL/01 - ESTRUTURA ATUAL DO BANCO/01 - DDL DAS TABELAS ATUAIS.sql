-- SNAPSHOT DA ESTRUTURA ATUAL DO BANCO G-VITRINE
-- Gerado por introspecção do Supabase em 2026-11-12.
-- Este arquivo é documentação técnica de estrutura, não um backup completo.
-- Requer previamente os schemas/objetos gerenciados pelo Supabase (auth, storage)
-- e as funções de extensão referenciadas pelos scripts do projeto.
-- Não execute sobre produção existente. Restauração deve ocorrer em projeto novo,
-- com revisão de extensões, dependências de Auth/Storage e grants.

DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public."categorias" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "nome" text NOT NULL,
  "slug" text NOT NULL,
  "ordem" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "organization_id" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public."configuracoes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "chave" text NOT NULL,
  "valor" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "organization_id" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public."crm_activities" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "lead_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "type" text DEFAULT 'nota'::text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "due_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_by" uuid DEFAULT auth.uid(),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public."leads" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "nome" text NOT NULL,
  "email" text,
  "telefone" text,
  "produto_id" uuid,
  "mensagem" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "organization_id" uuid NOT NULL,
  "status" text,
  "source" text,
  "page_url" text,
  "crm_stage" text DEFAULT 'novo'::text,
  "crm_priority" text DEFAULT 'media'::text,
  "crm_notes" text,
  "crm_follow_up_at" timestamp with time zone,
  "crm_estimated_value" numeric(12,2),
  "crm_updated_at" timestamp with time zone DEFAULT now(),
  "crm_final_value" numeric(12,2)
);

CREATE TABLE IF NOT EXISTS public."loja_backups" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "gerado_em" timestamp with time zone DEFAULT now() NOT NULL,
  "expira_em" timestamp with time zone DEFAULT (now() + '60 days'::interval) NOT NULL,
  "checksum" text NOT NULL,
  "origem" text DEFAULT 'manual'::text NOT NULL,
  "criado_por" uuid,
  "payload" jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public."organization_members" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" text DEFAULT 'viewer'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public."organization_subscriptions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "plan_code" text DEFAULT 'free'::text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "current_period_start" timestamp with time zone DEFAULT now() NOT NULL,
  "current_period_end" timestamp with time zone,
  "external_customer_id" text,
  "external_subscription_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public."organizations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text DEFAULT ''::text NOT NULL,
  "logo_url" text,
  "primary_color" text DEFAULT '#16a34a'::text NOT NULL,
  "custom_domain" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public."produtos" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "titulo" text NOT NULL,
  "slug" text,
  "descricao" text DEFAULT ''::text NOT NULL,
  "imagem_url" text,
  "preco" numeric(10,2) DEFAULT 0 NOT NULL,
  "preco_antigo" numeric(10,2),
  "parcelamento" text,
  "selo" text,
  "desconto" text,
  "desconto_cor" text DEFAULT '#f97316'::text NOT NULL,
  "desconto_ativo" boolean DEFAULT true NOT NULL,
  "categoria_id" uuid,
  "checkout_url" text,
  "video_url" text,
  "demo_url" text,
  "whatsapp_url" text,
  "popup_video_url" text,
  "popup_video_tipo" text DEFAULT 'auto'::text NOT NULL,
  "popup_imagem_url" text,
  "secao" text DEFAULT 'vitrine'::text NOT NULL,
  "tags" text[] DEFAULT '{}'::text[] NOT NULL,
  "comprar_texto" text DEFAULT 'Comprar'::text NOT NULL,
  "comprar_cor" text DEFAULT '#3b82f6'::text NOT NULL,
  "comprar_provedor" text DEFAULT 'personalizado'::text NOT NULL,
  "comprar_ativo" boolean DEFAULT true NOT NULL,
  "demo_texto" text DEFAULT 'Ver Demo'::text NOT NULL,
  "demo_cor" text DEFAULT '#dc2626'::text NOT NULL,
  "demo_ativo" boolean DEFAULT true NOT NULL,
  "destaque" boolean DEFAULT false NOT NULL,
  "ativo" boolean DEFAULT true NOT NULL,
  "ordem" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "pix_icone" text DEFAULT 'pix'::text NOT NULL,
  "site_url" text,
  "site_texto" text DEFAULT 'Ver Site'::text NOT NULL,
  "site_cor" text DEFAULT '#16a34a'::text NOT NULL,
  "site_ativo" boolean DEFAULT true NOT NULL,
  "botoes_ordem" text[] DEFAULT ARRAY['comprar'::text, 'video'::text, 'site'::text, 'whatsapp'::text] NOT NULL,
  "whatsapp_compartilhar_ativo" boolean DEFAULT true NOT NULL,
  "whatsapp_compartilhar_cor" text DEFAULT '#25D366'::text NOT NULL,
  "whatsapp_compartilhar_texto" text DEFAULT 'Compartilhar no WhatsApp'::text NOT NULL,
  "whatsapp_compartilhar_url" text,
  "whatsapp_compartilhar_titulo" text,
  "whatsapp_compartilhar_descricao" text,
  "whatsapp_compartilhar_imagem_url" text,
  "organization_id" uuid NOT NULL,
  "whatsapp_compartilhar_mensagem" text,
  "video_legenda_url" text,
  "video_legenda_ativa" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS public."saas_plans" (
  "code" text NOT NULL,
  "name" text NOT NULL,
  "description" text DEFAULT ''::text NOT NULL,
  "price_monthly" numeric(10,2) DEFAULT 0 NOT NULL,
  "max_products" integer DEFAULT 20 NOT NULL,
  "max_leads" integer DEFAULT 100 NOT NULL,
  "max_members" integer DEFAULT 1 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public."user_roles" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "role" app_role NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Restrições (PK, UNIQUE, FK e CHECK)
ALTER TABLE public."categorias" ADD CONSTRAINT "categorias_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE public."categorias" ADD CONSTRAINT "categorias_organization_id_slug_key" UNIQUE (organization_id, slug);
ALTER TABLE public."categorias" ADD CONSTRAINT "categorias_pkey" PRIMARY KEY (id);
ALTER TABLE public."configuracoes" ADD CONSTRAINT "configuracoes_organization_id_chave_key" UNIQUE (organization_id, chave);
ALTER TABLE public."configuracoes" ADD CONSTRAINT "configuracoes_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE public."configuracoes" ADD CONSTRAINT "configuracoes_pkey" PRIMARY KEY (id);
ALTER TABLE public."crm_activities" ADD CONSTRAINT "crm_activities_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
ALTER TABLE public."crm_activities" ADD CONSTRAINT "crm_activities_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE public."crm_activities" ADD CONSTRAINT "crm_activities_pkey" PRIMARY KEY (id);
ALTER TABLE public."crm_activities" ADD CONSTRAINT "crm_activities_title_check" CHECK (length(TRIM(BOTH FROM title)) >= 1 AND length(TRIM(BOTH FROM title)) <= 180);
ALTER TABLE public."crm_activities" ADD CONSTRAINT "crm_activities_type_check" CHECK (type = ANY (ARRAY['nota'::text, 'ligacao'::text, 'email'::text, 'reuniao'::text, 'tarefa'::text, 'etapa'::text]));
ALTER TABLE public."leads" ADD CONSTRAINT "leads_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE public."leads" ADD CONSTRAINT "leads_pkey" PRIMARY KEY (id);
ALTER TABLE public."leads" ADD CONSTRAINT "leads_produto_id_fkey" FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL;
ALTER TABLE public."loja_backups" ADD CONSTRAINT "loja_backups_criado_por_fkey" FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."loja_backups" ADD CONSTRAINT "loja_backups_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE public."loja_backups" ADD CONSTRAINT "loja_backups_origem_check" CHECK (origem = ANY (ARRAY['automatico'::text, 'manual'::text, 'pre_restauracao'::text]));
ALTER TABLE public."loja_backups" ADD CONSTRAINT "loja_backups_pkey" PRIMARY KEY (id);
ALTER TABLE public."organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE public."organization_members" ADD CONSTRAINT "organization_members_organization_id_user_id_key" UNIQUE (organization_id, user_id);
ALTER TABLE public."organization_members" ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY (id);
ALTER TABLE public."organization_members" ADD CONSTRAINT "organization_members_role_check" CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'editor'::text, 'viewer'::text]));
ALTER TABLE public."organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE public."organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_organization_id_key" UNIQUE (organization_id);
ALTER TABLE public."organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_pkey" PRIMARY KEY (id);
ALTER TABLE public."organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_plan_code_fkey" FOREIGN KEY (plan_code) REFERENCES saas_plans(code);
ALTER TABLE public."organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_status_check" CHECK (status = ANY (ARRAY['trialing'::text, 'active'::text, 'past_due'::text, 'cancelled'::text]));
ALTER TABLE public."organizations" ADD CONSTRAINT "organizations_owner_user_id_fkey" FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."organizations" ADD CONSTRAINT "organizations_pkey" PRIMARY KEY (id);
ALTER TABLE public."organizations" ADD CONSTRAINT "organizations_slug_key" UNIQUE (slug);
ALTER TABLE public."organizations" ADD CONSTRAINT "organizations_status_check" CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'cancelled'::text]));
ALTER TABLE public."produtos" ADD CONSTRAINT "produtos_categoria_id_fkey" FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL;
ALTER TABLE public."produtos" ADD CONSTRAINT "produtos_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE public."produtos" ADD CONSTRAINT "produtos_pkey" PRIMARY KEY (id);
ALTER TABLE public."saas_plans" ADD CONSTRAINT "saas_plans_pkey" PRIMARY KEY (code);
ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY (id);
ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE (user_id, role);

-- RLS
ALTER TABLE public."categorias" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."configuracoes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."crm_activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."crm_activities" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."loja_backups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."organization_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."organization_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."produtos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."saas_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user_roles" ENABLE ROW LEVEL SECURITY;
