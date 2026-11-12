-- ============================================================
-- PASSO 1 — ESTRUTURA COMPLETA DO BANCO (rode primeiro)
-- Projeto: Loja Vitrine
-- Execute o arquivo INTEIRO no SQL Editor do novo projeto Supabase.
-- Reproduz exatamente o estado atual: tipos, funções, tabelas,
-- GRANTs, RLS, políticas, triggers e índices.
-- ============================================================

-- ---------- 1.1 Tipos ----------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- 1.2 Funções utilitárias ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Remove acentos sem depender da extensão unaccent
CREATE OR REPLACE FUNCTION public.unaccent_fallback(_txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT translate(_txt,
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')
$$;

CREATE OR REPLACE FUNCTION public.slugify(_txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from regexp_replace(lower(public.unaccent_fallback(_txt)), '[^a-z0-9]+', '-', 'g'))
$$;

-- ---------- 1.3 Papéis de usuário (NUNCA guardar role no perfil) ----------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL    ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Verificação de papel isolada em SECURITY DEFINER (evita recursão de RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT  USAGE  ON TYPE public.app_role TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.set_updated_at()  FROM PUBLIC, anon, authenticated;

-- ---------- 1.4 Categorias ----------
CREATE TABLE IF NOT EXISTS public.categorias (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  ordem      integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT                         ON public.categorias TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL                            ON public.categorias TO service_role;

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorias sao publicas"
  ON public.categorias FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins gerenciam categorias"
  ON public.categorias FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER categorias_updated_at
  BEFORE UPDATE ON public.categorias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 1.5 Produtos ----------
CREATE TABLE IF NOT EXISTS public.produtos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo           text NOT NULL,
  slug             text UNIQUE,
  descricao        text NOT NULL DEFAULT '',
  imagem_url       text,
  preco            numeric(10,2) NOT NULL DEFAULT 0,
  preco_antigo     numeric(10,2),
  parcelamento     text,
  selo             text,
  desconto         text,
  desconto_cor     text NOT NULL DEFAULT '#f97316',
  desconto_ativo   boolean NOT NULL DEFAULT true,
  categoria_id     uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  checkout_url     text,
  video_url        text,
  demo_url         text,
  whatsapp_url     text,
  popup_video_url  text,
  popup_video_tipo text NOT NULL DEFAULT 'auto',
  popup_imagem_url text,
  secao            text NOT NULL DEFAULT 'vitrine',
  tags             text[] NOT NULL DEFAULT '{}',
  comprar_texto    text NOT NULL DEFAULT 'Comprar',
  comprar_cor      text NOT NULL DEFAULT '#3b82f6',
  comprar_provedor text NOT NULL DEFAULT 'personalizado',
  comprar_ativo    boolean NOT NULL DEFAULT true,
  demo_texto       text NOT NULL DEFAULT 'Ver Demo',
  demo_cor         text NOT NULL DEFAULT '#dc2626',
  demo_ativo       boolean NOT NULL DEFAULT true,
  destaque         boolean NOT NULL DEFAULT false,
  ativo            boolean NOT NULL DEFAULT true,
  ordem            integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT                         ON public.produtos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL                            ON public.produtos TO service_role;

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produtos ativos sao publicos"
  ON public.produtos FOR SELECT TO anon, authenticated USING (ativo = true);

CREATE POLICY "Admins veem todos os produtos"
  ON public.produtos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins gerenciam produtos"
  ON public.produtos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Gera o slug público (/produto/:slug) a partir do título, evitando duplicados
CREATE OR REPLACE FUNCTION public.produtos_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  candidato text;
  i int := 1;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := public.slugify(coalesce(NEW.titulo, 'produto'));
    IF base = '' THEN base := 'produto'; END IF;
    candidato := base;
    WHILE EXISTS (SELECT 1 FROM public.produtos p WHERE p.slug = candidato AND p.id <> NEW.id) LOOP
      i := i + 1;
      candidato := base || '-' || i;
    END LOOP;
    NEW.slug := candidato;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.produtos_set_slug() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER produtos_slug_trigger
  BEFORE INSERT OR UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.produtos_set_slug();

CREATE TRIGGER produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS produtos_categoria_idx ON public.produtos(categoria_id);

-- ---------- 1.6 Configurações (banner, botão de ajuda) ----------
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave      text NOT NULL UNIQUE,
  valor      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT                         ON public.configuracoes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes TO authenticated;
GRANT ALL                            ON public.configuracoes TO service_role;

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Configuracoes sao publicas"
  ON public.configuracoes FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins gerenciam configuracoes"
  ON public.configuracoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER configuracoes_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 1.7 Leads (formulário de contato) ----------
CREATE TABLE IF NOT EXISTS public.leads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  email      text,
  telefone   text,
  produto_id uuid REFERENCES public.produtos(id) ON DELETE SET NULL,
  mensagem   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT                 ON public.leads TO anon;
GRANT SELECT, INSERT, DELETE ON public.leads TO authenticated;
GRANT ALL                    ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode enviar contato"
  ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins veem leads"
  ON public.leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins excluem leads"
  ON public.leads FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- FIM DO PASSO 1
