-- Isolamento multi-tenant dos painéis, arquivos e backups.
-- Uma conta ligada a uma loja (membro ou proprietária) não pode usar o papel
-- global "admin" como atalho para atravessar a separação entre organizações.
-- O papel global fica reservado a contas de plataforma sem vínculo a lojas.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT _user_id = auth.uid()
     AND EXISTS (
       SELECT 1
       FROM public.user_roles ur
       WHERE ur.user_id = _user_id
         AND ur.role = _role
     )
     AND (
       _role <> 'admin'::public.app_role
       OR (
         NOT EXISTS (
           SELECT 1 FROM public.organization_members m
           WHERE m.user_id = _user_id
         )
         AND NOT EXISTS (
           SELECT 1 FROM public.organizations o
           WHERE o.owner_user_id = _user_id
         )
       )
     );
$function$;

-- Remove o papel de plataforma de contas que já pertencem a alguma loja.
-- Essas contas continuam administrando suas próprias lojas pelo vínculo owner/admin.
DELETE FROM public.user_roles ur
WHERE ur.role = 'admin'::public.app_role
  AND (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.user_id = ur.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.owner_user_id = ur.user_id
    )
  );

-- PRODUTOS: leituras administrativas limitadas à organização relacionada;
-- conteúdo ativo continua público na vitrine, inclusive para usuários autenticados.
ALTER POLICY "Authenticated products scoped to store"
  ON public.produtos
  USING (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_member(organization_id)
    )
  );

ALTER POLICY "Product admins delete"
  ON public.produtos
  USING (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  );

ALTER POLICY "Product admins insert"
  ON public.produtos
  WITH CHECK (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  );

ALTER POLICY "Product admins update"
  ON public.produtos
  USING (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  );

ALTER POLICY "Public active products of active stores"
  ON public.produtos
  TO anon, authenticated
  USING (
    ativo = true
    AND organization_id IS NOT NULL
    AND public.is_organization_active(organization_id)
  );

-- CATEGORIAS.
ALTER POLICY "Authenticated categories scoped to store"
  ON public.categorias
  USING (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_member(organization_id)
    )
  );

ALTER POLICY "Category admins delete"
  ON public.categorias
  USING (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  );

ALTER POLICY "Category admins insert"
  ON public.categorias
  WITH CHECK (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  );

ALTER POLICY "Category admins update"
  ON public.categorias
  USING (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  );

ALTER POLICY "Public categories of active stores"
  ON public.categorias
  TO anon, authenticated
  USING (
    organization_id IS NOT NULL
    AND public.is_organization_active(organization_id)
  );

-- CONFIGURAÇÕES: configurações administrativas são privadas; só as chaves
-- listadas continuam visíveis na parte pública de uma loja ativa.
ALTER POLICY "Authenticated configs scoped to store"
  ON public.configuracoes
  USING (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_member(organization_id)
    )
  );

ALTER POLICY "Config admins delete"
  ON public.configuracoes
  USING (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  );

ALTER POLICY "Config admins insert"
  ON public.configuracoes
  WITH CHECK (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  );

ALTER POLICY "Config admins update"
  ON public.configuracoes
  USING (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  );

ALTER POLICY "Public configs of active stores"
  ON public.configuracoes
  TO anon, authenticated
  USING (
    organization_id IS NOT NULL
    AND public.is_organization_active(organization_id)
    AND chave = ANY (ARRAY[
      'banner','ajuda','marca','card_textos','compartilhamento',
      'produto_beneficios','categoria_botoes','botao_ver_mais',
      'titulos_secoes','rodape','favicon'
    ]::text[])
  );

-- LEADS: leitura e remoção exclusivamente por administradores da loja
-- (ou por conta de plataforma sem vínculo a qualquer loja).
ALTER POLICY "Lead admins delete"
  ON public.leads
  USING (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  );

ALTER POLICY "Lead admins view"
  ON public.leads
  USING (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  );

-- Nunca mais permitir leads sem loja associada.
DROP POLICY IF EXISTS "Public legacy lead inserts" ON public.leads;

ALTER POLICY "Public store lead inserts"
  ON public.leads
  WITH CHECK (
    organization_id IS NOT NULL
    AND public.is_organization_active(organization_id)
  );

-- BACKUPS.
ALTER POLICY "Backup admins delete"
  ON public.loja_backups
  USING (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  );

ALTER POLICY "Backup admins insert"
  ON public.loja_backups
  WITH CHECK (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
    AND (criado_por IS NULL OR criado_por = auth.uid())
  );

ALTER POLICY "Backup admins view"
  ON public.loja_backups
  USING (
    organization_id IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_organization_admin(organization_id)
    )
  );

-- MEMBROS E ASSINATURAS: sem atalho global para contas vinculadas a lojas.
ALTER POLICY "Organization admins manage member deletes"
  ON public.organization_members
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_organization_admin(organization_id)
  );

ALTER POLICY "Organization admins manage member inserts"
  ON public.organization_members
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_organization_admin(organization_id)
  );

ALTER POLICY "Organization admins manage member updates"
  ON public.organization_members
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_organization_admin(organization_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_organization_admin(organization_id)
  );

ALTER POLICY "Organization members can view members"
  ON public.organization_members
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_organization_member(organization_id)
  );

ALTER POLICY "Members can view their subscription"
  ON public.organization_subscriptions
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_organization_member(organization_id)
  );

-- ARQUIVOS: o primeiro segmento do caminho é o UUID da loja.
-- CASE impede cast de caminho inválido para UUID.
ALTER POLICY "Admins gerenciam arquivos da loja"
  ON storage.objects
  USING (
    bucket_id = 'loja'
    AND CASE
      WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.is_organization_admin(split_part(name, '/', 1)::uuid)
      )
      ELSE false
    END
  )
  WITH CHECK (
    bucket_id = 'loja'
    AND CASE
      WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.is_organization_admin(split_part(name, '/', 1)::uuid)
      )
      ELSE false
    END
  );

-- Relatórios de uso são apenas para usuários autenticados e membros daquela loja.
CREATE OR REPLACE FUNCTION public.saas_usage(_organization_id uuid)
RETURNS TABLE(
  products_count bigint,
  leads_count bigint,
  members_count bigint,
  max_products integer,
  max_leads integer,
  max_members integer,
  plan_code text,
  plan_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    (SELECT count(*) FROM public.produtos p WHERE p.organization_id = _organization_id),
    (SELECT count(*) FROM public.leads l WHERE l.organization_id = _organization_id),
    (SELECT count(*) FROM public.organization_members m WHERE m.organization_id = _organization_id),
    p.max_products, p.max_leads, p.max_members, p.code, p.name
  FROM public.organization_subscriptions s
  JOIN public.saas_plans p ON p.code = s.plan_code
  WHERE s.organization_id = _organization_id
    AND (
      public.is_organization_member(_organization_id)
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    );
$function$;

REVOKE EXECUTE ON FUNCTION public.saas_usage(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.saas_usage(uuid) TO authenticated;

-- Uma restauração só pode repor dados da loja autorizada, e todas as linhas
-- do backup devem pertencer à mesma organização; referências cruzadas são recusadas.
CREATE OR REPLACE FUNCTION public.restaurar_backup_da_loja(
  _organization_id uuid,
  _payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_source_org_id uuid;
  v_source_slug text;
  v_org jsonb;
  v_categories integer := 0;
  v_products integer := 0;
  v_configs integer := 0;
  v_leads integer := 0;
BEGIN
  IF _organization_id IS NULL THEN
    RAISE EXCEPTION 'Loja inválida.';
  END IF;

  IF NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_organization_admin(_organization_id)
  ) THEN
    RAISE EXCEPTION 'Apenas administradores desta loja podem restaurar backups.';
  END IF;

  IF _payload IS NULL OR jsonb_typeof(_payload) <> 'object'
     OR jsonb_typeof(_payload->'organization') <> 'object' THEN
    RAISE EXCEPTION 'Arquivo de backup inválido: organização ausente.';
  END IF;

  IF _payload->>'organization_id' IS DISTINCT FROM _organization_id::text THEN
    RAISE EXCEPTION 'Este backup pertence a outra loja e não pode ser restaurado nesta loja.';
  END IF;

  v_source_org_id := NULLIF(_payload->'organization'->>'id', '')::uuid;
  v_source_slug := NULLIF(trim(_payload->'organization'->>'slug'), '');

  IF v_source_org_id IS DISTINCT FROM _organization_id THEN
    RAISE EXCEPTION 'Este backup pertence a outra loja e não pode ser restaurado nesta loja.';
  END IF;

  IF v_source_slug IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.slug = v_source_slug
      AND o.id <> _organization_id
  ) THEN
    RAISE EXCEPTION 'O slug do backup já pertence a outra loja.';
  END IF;

  IF NULLIF(trim(_payload->'organization'->>'custom_domain'), '') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM public.organizations o
       WHERE o.custom_domain = NULLIF(trim(_payload->'organization'->>'custom_domain'), '')
         AND o.id <> _organization_id
     ) THEN
    RAISE EXCEPTION 'O domínio personalizado do backup já pertence a outra loja.';
  END IF;

  IF jsonb_typeof(_payload->'categorias') <> 'array'
     OR jsonb_typeof(_payload->'produtos') <> 'array'
     OR jsonb_typeof(_payload->'configuracoes') <> 'array'
     OR jsonb_typeof(_payload->'leads') <> 'array' THEN
    RAISE EXCEPTION 'Arquivo de backup inválido: seções obrigatórias ausentes.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(_payload->'categorias') AS x(item)
    WHERE jsonb_typeof(x.item) <> 'object'
       OR x.item->>'organization_id' IS DISTINCT FROM _organization_id::text
  ) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(_payload->'produtos') AS x(item)
    WHERE jsonb_typeof(x.item) <> 'object'
       OR x.item->>'organization_id' IS DISTINCT FROM _organization_id::text
  ) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(_payload->'configuracoes') AS x(item)
    WHERE jsonb_typeof(x.item) <> 'object'
       OR x.item->>'organization_id' IS DISTINCT FROM _organization_id::text
  ) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(_payload->'leads') AS x(item)
    WHERE jsonb_typeof(x.item) <> 'object'
       OR x.item->>'organization_id' IS DISTINCT FROM _organization_id::text
  ) THEN
    RAISE EXCEPTION 'O backup contém registros que não pertencem a esta loja.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(_payload->'produtos') AS p(item)
    WHERE NULLIF(p.item->>'categoria_id', '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(_payload->'categorias') AS c(item)
        WHERE c.item->>'id' = p.item->>'categoria_id'
          AND c.item->>'organization_id' = _organization_id::text
      )
  ) THEN
    RAISE EXCEPTION 'O backup contém produtos vinculados a categorias de outra loja.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(_payload->'leads') AS l(item)
    WHERE NULLIF(l.item->>'produto_id', '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(_payload->'produtos') AS p(item)
        WHERE p.item->>'id' = l.item->>'produto_id'
          AND p.item->>'organization_id' = _organization_id::text
      )
  ) THEN
    RAISE EXCEPTION 'O backup contém contatos vinculados a produtos de outra loja.';
  END IF;

  v_org := _payload->'organization';

  UPDATE public.organizations
  SET name = COALESCE(v_org->>'name', name),
      slug = COALESCE(v_source_slug, slug),
      description = COALESCE(v_org->>'description', description),
      logo_url = CASE WHEN v_org ? 'logo_url' THEN v_org->>'logo_url' ELSE logo_url END,
      primary_color = COALESCE(v_org->>'primary_color', primary_color),
      custom_domain = CASE WHEN v_org ? 'custom_domain' THEN v_org->>'custom_domain' ELSE custom_domain END,
      updated_at = now()
  WHERE id = _organization_id;

  DELETE FROM public.leads WHERE organization_id = _organization_id;
  DELETE FROM public.produtos WHERE organization_id = _organization_id;
  DELETE FROM public.categorias WHERE organization_id = _organization_id;
  DELETE FROM public.configuracoes WHERE organization_id = _organization_id;

  INSERT INTO public.categorias
  SELECT * FROM jsonb_populate_recordset(NULL::public.categorias, _payload->'categorias');
  GET DIAGNOSTICS v_categories = ROW_COUNT;

  INSERT INTO public.produtos
  SELECT * FROM jsonb_populate_recordset(NULL::public.produtos, _payload->'produtos');
  GET DIAGNOSTICS v_products = ROW_COUNT;

  INSERT INTO public.configuracoes
  SELECT * FROM jsonb_populate_recordset(NULL::public.configuracoes, _payload->'configuracoes');
  GET DIAGNOSTICS v_configs = ROW_COUNT;

  INSERT INTO public.leads
  SELECT * FROM jsonb_populate_recordset(NULL::public.leads, _payload->'leads');
  GET DIAGNOSTICS v_leads = ROW_COUNT;

  RETURN jsonb_build_object(
    'restaurado', true,
    'organization_id', _organization_id,
    'categorias', v_categories,
    'produtos', v_products,
    'configuracoes', v_configs,
    'leads', v_leads,
    'restaurado_em', now()
  );
END;
$function$;
