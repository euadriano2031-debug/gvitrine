-- Better CRM money model:
-- catalog product price, estimated opportunity amount, and closed deal value
-- remain distinct. The product price suggests a default estimate, never
-- overwriting an estimate explicitly entered by a store operator.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS crm_final_value numeric(12,2);

CREATE OR REPLACE FUNCTION public.crm_preencher_valores_lead()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.crm_estimated_value IS NULL AND NEW.produto_id IS NOT NULL THEN
    SELECT p.preco
      INTO NEW.crm_estimated_value
    FROM public.produtos p
    WHERE p.id = NEW.produto_id
      AND p.organization_id = NEW.organization_id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS leads_crm_auto_preco ON public.leads;
CREATE TRIGGER leads_crm_auto_preco
BEFORE INSERT OR UPDATE OF produto_id, organization_id, crm_estimated_value
ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.crm_preencher_valores_lead();

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

  IF NEW.crm_final_value IS NOT NULL AND NEW.crm_final_value < 0 THEN
    RAISE EXCEPTION 'O valor fechado não pode ser negativo.';
  END IF;

  -- When a deal is marked won, initialize the closed amount from the estimate
  -- unless the operator supplied an explicit closing amount.
  IF NEW.crm_stage = 'ganho' AND NEW.crm_final_value IS NULL THEN
    NEW.crm_final_value := NEW.crm_estimated_value;
  END IF;

  NEW.crm_updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS leads_normalizar_campos_crm ON public.leads;
CREATE TRIGGER leads_normalizar_campos_crm
BEFORE INSERT OR UPDATE OF
  crm_stage, crm_priority, crm_notes, crm_follow_up_at,
  crm_estimated_value, crm_final_value
ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.normalizar_campos_crm_lead();

-- Fill only missing values on existing linked leads; never replace explicit prices.
UPDATE public.leads l
SET crm_estimated_value = p.preco
FROM public.produtos p
WHERE l.produto_id = p.id
  AND l.organization_id = p.organization_id
  AND l.crm_estimated_value IS NULL;

UPDATE public.leads
SET crm_final_value = crm_estimated_value
WHERE crm_stage = 'ganho'
  AND crm_final_value IS NULL
  AND crm_estimated_value IS NOT NULL;
