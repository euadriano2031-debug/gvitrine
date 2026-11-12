CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categorias TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categorias sao publicas" ON public.categorias FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins gerenciam categorias" ON public.categorias FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  imagem_url text,
  preco numeric(10,2) NOT NULL DEFAULT 0,
  parcelamento text,
  selo text,
  desconto text,
  categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  checkout_url text,
  video_url text,
  demo_url text,
  whatsapp_url text,
  destaque boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.produtos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Produtos ativos sao publicos" ON public.produtos FOR SELECT TO anon, authenticated USING (ativo = true);
CREATE POLICY "Admins veem todos os produtos" ON public.produtos FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins gerenciam produtos" ON public.produtos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX produtos_categoria_idx ON public.produtos(categoria_id);

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  telefone text,
  produto_id uuid REFERENCES public.produtos(id) ON DELETE SET NULL,
  mensagem text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um pode enviar contato" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins veem leads" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.categorias (nome, slug, ordem) VALUES
  ('Sites','sites',1),('Streaming','streaming',2),('WhatsApp','whatsapp',3),('IA','ia',4),
  ('Trading','trading',5),('Painéis','paineis',6),('Apps','apps',7),('E-commerce','ecommerce',8),
  ('Marketing','marketing',9);

INSERT INTO public.produtos (titulo, descricao, preco, parcelamento, selo, desconto, categoria_id, checkout_url, destaque, ordem)
VALUES
 ('Streaming Pro','Plataforma completa de streaming estilo Netflix e Apple TV. Código-fonte completo, pronto para uso.',297.00,'12x de R$ 29,70','DESTAQUE','GANHE ATÉ 70% OFF',(SELECT id FROM public.categorias WHERE slug='streaming'),'https://checkout.exemplo.com/streaming-pro',true,1),
 ('Zap Modelo Pro','Disparos automáticos, transparentes e seguros em grupos do WhatsApp com painel completo.',197.00,'12x de R$ 19,70','POPULAR','60% OFF',(SELECT id FROM public.categorias WHERE slug='whatsapp'),'https://checkout.exemplo.com/zap-modelo-pro',true,2),
 ('Lovable Boost','Extraia o máximo do seu editor de IA: prompts, templates e boosters para seus projetos.',97.00,'6x de R$ 16,17','NOVO','LANÇAMENTO',(SELECT id FROM public.categorias WHERE slug='ia'),'https://checkout.exemplo.com/lovable-boost',true,3),
 ('Crypto Trader Dash','Painel de trading com gráficos avançados, alertas e integrações com as principais corretoras.',397.00,'12x de R$ 39,70','PREMIUM','50% OFF',(SELECT id FROM public.categorias WHERE slug='trading'),'https://checkout.exemplo.com/crypto-trader-dash',true,4);REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;