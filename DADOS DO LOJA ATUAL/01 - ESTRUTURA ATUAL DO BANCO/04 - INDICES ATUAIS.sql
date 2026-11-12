-- Índices atuais não criados automaticamente por PRIMARY KEY/UNIQUE constraints.
-- Capturados em 2026-11-12. IF NOT EXISTS evita duplicar em restauração parcial.

CREATE UNIQUE INDEX IF NOT EXISTS categorias_organization_id_slug_uidx ON public.categorias USING btree (organization_id, slug);

CREATE UNIQUE INDEX IF NOT EXISTS configuracoes_organization_chave_uidx ON public.configuracoes USING btree (organization_id, chave);

CREATE UNIQUE INDEX IF NOT EXISTS configuracoes_organization_id_chave_uidx ON public.configuracoes USING btree (organization_id, chave);

CREATE INDEX IF NOT EXISTS crm_activities_open_tasks_idx ON public.crm_activities USING btree (organization_id, due_at) WHERE ((type = 'tarefa'::text) AND (completed_at IS NULL));

CREATE INDEX IF NOT EXISTS crm_activities_tenant_lead_created_idx ON public.crm_activities USING btree (organization_id, lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS leads_org_created_idx ON public.leads USING btree (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS leads_organization_follow_up_idx ON public.leads USING btree (organization_id, crm_follow_up_at) WHERE (crm_follow_up_at IS NOT NULL);

CREATE INDEX IF NOT EXISTS leads_organization_stage_created_idx ON public.leads USING btree (organization_id, crm_stage, created_at DESC);

CREATE INDEX IF NOT EXISTS loja_backups_expira_idx ON public.loja_backups USING btree (expira_em);

CREATE INDEX IF NOT EXISTS loja_backups_org_gerado_idx ON public.loja_backups USING btree (organization_id, gerado_em DESC);

CREATE INDEX IF NOT EXISTS produtos_categoria_idx ON public.produtos USING btree (categoria_id);

CREATE INDEX IF NOT EXISTS produtos_org_ordem_idx ON public.produtos USING btree (organization_id, ordem);

CREATE UNIQUE INDEX IF NOT EXISTS produtos_org_slug_uidx ON public.produtos USING btree (organization_id, slug) WHERE (slug IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS produtos_organization_id_slug_uidx ON public.produtos USING btree (organization_id, slug);
