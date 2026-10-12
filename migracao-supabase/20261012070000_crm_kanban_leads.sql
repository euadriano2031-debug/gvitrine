-- CRM/Kanban per tenant for the Leads area.
-- Existing data is preserved; current leads are assigned to the "novo" stage.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS crm_stage text DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS crm_priority text DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS crm_notes text,
  ADD COLUMN IF NOT EXISTS crm_follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS crm_estimated_value numeric(12,2),
  ADD COLUMN IF NOT EXISTS crm_updated_at timestamptz DEFAULT now();

-- Keep older backups restorable: older JSON payloads do not contain the
-- crm_* keys, so a trigger restores sensible defaults whenever fields are null.
CREATE OR REPLACE FUNCTION public.normalizar_campos_crm_lead()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.crm_stage := COALESCE(NULLIF(trim(NEW.crm_stage), ''), 'novo');
  IF NEW.crm_stage NOT IN ('novo','contato','qualificado','proposta','negociacao','ganho','perdido') THEN
    RAISE EXCEPTION 'Etapa de CRM inválida.';
  END IF;

  NEW.crm_priority := COALESCE(NULLIF(trim(NEW.crm_priority), ''), 'media');
  IF NEW.crm_priority NOT IN ('baixa','media','alta','urgente') THEN
    RAISE EXCEPTION 'Prioridade de CRM inválida.';
  END IF;

  IF NEW.crm_estimated_value IS NOT NULL AND NEW.crm_estimated_value < 0 THEN
    RAISE EXCEPTION 'O valor estimado não pode ser negativo.';
  END IF;

  NEW.crm_updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS leads_normalizar_campos_crm ON public.leads;
CREATE TRIGGER leads_normalizar_campos_crm
BEFORE INSERT OR UPDATE OF crm_stage, crm_priority, crm_notes, crm_follow_up_at, crm_estimated_value
ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.normalizar_campos_crm_lead();

CREATE INDEX IF NOT EXISTS leads_organization_stage_created_idx
  ON public.leads (organization_id, crm_stage, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_organization_follow_up_idx
  ON public.leads (organization_id, crm_follow_up_at)
  WHERE crm_follow_up_at IS NOT NULL;

-- CRM activity timeline (notes, calls, emails, meetings, tasks and stage changes).
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'nota'
    CHECK (type IN ('nota','ligacao','email','reuniao','tarefa','etapa')),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 180),
  description text,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_activities_tenant_lead_created_idx
  ON public.crm_activities (organization_id, lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_activities_open_tasks_idx
  ON public.crm_activities (organization_id, due_at)
  WHERE type = 'tarefa' AND completed_at IS NULL;

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM activities admins view" ON public.crm_activities;
CREATE POLICY "CRM activities admins view"
ON public.crm_activities FOR SELECT TO authenticated
USING (
  organization_id IS NOT NULL
  AND (public.has_role(auth.uid(), 'admin'::public.app_role)
       OR public.is_organization_admin(organization_id))
);

DROP POLICY IF EXISTS "CRM activities admins insert" ON public.crm_activities;
CREATE POLICY "CRM activities admins insert"
ON public.crm_activities FOR INSERT TO authenticated
WITH CHECK (
  organization_id IS NOT NULL
  AND (public.has_role(auth.uid(), 'admin'::public.app_role)
       OR public.is_organization_admin(organization_id))
  AND (created_by IS NULL OR created_by = auth.uid())
);

DROP POLICY IF EXISTS "CRM activities admins update" ON public.crm_activities;
CREATE POLICY "CRM activities admins update"
ON public.crm_activities FOR UPDATE TO authenticated
USING (
  organization_id IS NOT NULL
  AND (public.has_role(auth.uid(), 'admin'::public.app_role)
       OR public.is_organization_admin(organization_id))
)
WITH CHECK (
  organization_id IS NOT NULL
  AND (public.has_role(auth.uid(), 'admin'::public.app_role)
       OR public.is_organization_admin(organization_id))
);

DROP POLICY IF EXISTS "CRM activities admins delete" ON public.crm_activities;
CREATE POLICY "CRM activities admins delete"
ON public.crm_activities FOR DELETE TO authenticated
USING (
  organization_id IS NOT NULL
  AND (public.has_role(auth.uid(), 'admin'::public.app_role)
       OR public.is_organization_admin(organization_id))
);

-- Activities may only be connected to a lead in the same organization.
CREATE OR REPLACE FUNCTION public.validar_atividade_crm_mesma_loja()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = NEW.lead_id
      AND l.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'O contato selecionado não pertence a esta loja.';
  END IF;

  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS crm_activities_mesma_loja ON public.crm_activities;
CREATE TRIGGER crm_activities_mesma_loja
BEFORE INSERT OR UPDATE OF lead_id, organization_id
ON public.crm_activities
FOR EACH ROW
EXECUTE FUNCTION public.validar_atividade_crm_mesma_loja();

-- CRM fields can be edited only by an authorized admin for that lead's tenant.
DROP POLICY IF EXISTS "Lead admins update CRM" ON public.leads;
CREATE POLICY "Lead admins update CRM"
ON public.leads FOR UPDATE TO authenticated
USING (
  organization_id IS NOT NULL
  AND (public.has_role(auth.uid(), 'admin'::public.app_role)
       OR public.is_organization_admin(organization_id))
)
WITH CHECK (
  organization_id IS NOT NULL
  AND (public.has_role(auth.uid(), 'admin'::public.app_role)
       OR public.is_organization_admin(organization_id))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_activities TO authenticated;
