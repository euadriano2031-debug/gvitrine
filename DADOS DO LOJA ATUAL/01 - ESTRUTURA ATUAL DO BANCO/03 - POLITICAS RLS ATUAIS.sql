-- Políticas RLS observadas no Supabase em 2026-11-12.
-- Revise dependências em Auth/Storage antes de executar em outro projeto.

CREATE POLICY "Authenticated categories scoped to store" ON public."categorias" AS PERMISSIVE FOR SELECT TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_member(organization_id))));

CREATE POLICY "Category admins delete" ON public."categorias" AS PERMISSIVE FOR DELETE TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "Category admins insert" ON public."categorias" AS PERMISSIVE FOR INSERT TO "authenticated"
WITH CHECK (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "Category admins update" ON public."categorias" AS PERMISSIVE FOR UPDATE TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))))
WITH CHECK (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "Authenticated configs scoped to store" ON public."configuracoes" AS PERMISSIVE FOR SELECT TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_member(organization_id))));

CREATE POLICY "Config admins delete" ON public."configuracoes" AS PERMISSIVE FOR DELETE TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "Config admins insert" ON public."configuracoes" AS PERMISSIVE FOR INSERT TO "authenticated"
WITH CHECK (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "Config admins update" ON public."configuracoes" AS PERMISSIVE FOR UPDATE TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))))
WITH CHECK (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "CRM activities admins delete" ON public."crm_activities" AS PERMISSIVE FOR DELETE TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "CRM activities admins insert" ON public."crm_activities" AS PERMISSIVE FOR INSERT TO "authenticated"
WITH CHECK (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id)) AND ((created_by IS NULL) OR (created_by = auth.uid()))));

CREATE POLICY "CRM activities admins update" ON public."crm_activities" AS PERMISSIVE FOR UPDATE TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))))
WITH CHECK (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "CRM activities admins view" ON public."crm_activities" AS PERMISSIVE FOR SELECT TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "Lead admins delete" ON public."leads" AS PERMISSIVE FOR DELETE TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "Lead admins insert CRM" ON public."leads" AS PERMISSIVE FOR INSERT TO "authenticated"
WITH CHECK (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "Lead admins update CRM" ON public."leads" AS PERMISSIVE FOR UPDATE TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))))
WITH CHECK (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "Lead admins view" ON public."leads" AS PERMISSIVE FOR SELECT TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "Backup admins delete" ON public."loja_backups" AS PERMISSIVE FOR DELETE TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "Backup admins insert" ON public."loja_backups" AS PERMISSIVE FOR INSERT TO "authenticated"
WITH CHECK (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id)) AND ((criado_por IS NULL) OR (criado_por = auth.uid()))));

CREATE POLICY "Backup admins view" ON public."loja_backups" AS PERMISSIVE FOR SELECT TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "Organization admins manage member deletes" ON public."organization_members" AS PERMISSIVE FOR DELETE TO "authenticated"
USING ((has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id)));

CREATE POLICY "Organization admins manage member inserts" ON public."organization_members" AS PERMISSIVE FOR INSERT TO "authenticated"
WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id)));

CREATE POLICY "Organization admins manage member updates" ON public."organization_members" AS PERMISSIVE FOR UPDATE TO "authenticated"
USING ((has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id)))
WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id)));

CREATE POLICY "Organization members can view members" ON public."organization_members" AS PERMISSIVE FOR SELECT TO "authenticated"
USING ((has_role(auth.uid(), 'admin'::app_role) OR is_organization_member(organization_id)));

CREATE POLICY "Members can view their subscription" ON public."organization_subscriptions" AS PERMISSIVE FOR SELECT TO "authenticated"
USING ((has_role(auth.uid(), 'admin'::app_role) OR is_organization_member(organization_id)));

CREATE POLICY "Active organizations are public" ON public."organizations" AS PERMISSIVE FOR SELECT TO "anon", "authenticated"
USING ((status = 'active'::text));

CREATE POLICY "Organization owners and admins can update" ON public."organizations" AS PERMISSIVE FOR UPDATE TO "authenticated"
USING (((owner_user_id = auth.uid()) OR is_organization_admin(id)))
WITH CHECK (((owner_user_id = auth.uid()) OR is_organization_admin(id)));

CREATE POLICY "Organization owners can delete" ON public."organizations" AS PERMISSIVE FOR DELETE TO "authenticated"
USING ((owner_user_id = auth.uid()));

CREATE POLICY "Users can create their own organization" ON public."organizations" AS PERMISSIVE FOR INSERT TO "authenticated"
WITH CHECK ((owner_user_id = auth.uid()));

CREATE POLICY "Authenticated products scoped to store" ON public."produtos" AS PERMISSIVE FOR SELECT TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_member(organization_id))));

CREATE POLICY "Product admins delete" ON public."produtos" AS PERMISSIVE FOR DELETE TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "Product admins insert" ON public."produtos" AS PERMISSIVE FOR INSERT TO "authenticated"
WITH CHECK (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "Product admins update" ON public."produtos" AS PERMISSIVE FOR UPDATE TO "authenticated"
USING (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))))
WITH CHECK (((organization_id IS NOT NULL) AND (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin(organization_id))));

CREATE POLICY "SaaS plans are public" ON public."saas_plans" AS PERMISSIVE FOR SELECT TO "anon", "authenticated"
USING ((active = true));

CREATE POLICY "Users can view their own roles" ON public."user_roles" AS PERMISSIVE FOR SELECT TO "authenticated"
USING ((auth.uid() = user_id));