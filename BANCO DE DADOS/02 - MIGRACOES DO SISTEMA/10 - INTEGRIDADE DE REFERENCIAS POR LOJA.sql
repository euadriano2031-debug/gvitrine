-- Guarantees structural tenancy and prevents cross-store foreign references.
-- Data audit before this migration showed no rows with NULL organization_id
-- and no product/category or lead/product relationship crossing organizations.

ALTER TABLE public.produtos
  ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.categorias
  ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.configuracoes
  ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.leads
  ALTER COLUMN organization_id SET NOT NULL;

CREATE OR REPLACE FUNCTION public.validar_categoria_da_mesma_loja()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Todo produto precisa pertencer a uma loja.';
  END IF;

  IF NEW.categoria_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.categorias c
       WHERE c.id = NEW.categoria_id
         AND c.organization_id = NEW.organization_id
     ) THEN
    RAISE EXCEPTION 'A categoria selecionada não pertence a esta loja.';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS produtos_categoria_mesma_loja ON public.produtos;
CREATE TRIGGER produtos_categoria_mesma_loja
BEFORE INSERT OR UPDATE OF organization_id, categoria_id
ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.validar_categoria_da_mesma_loja();

CREATE OR REPLACE FUNCTION public.validar_produto_do_lead_mesma_loja()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Todo contato precisa estar associado a uma loja.';
  END IF;

  IF NEW.produto_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.produtos p
       WHERE p.id = NEW.produto_id
         AND p.organization_id = NEW.organization_id
     ) THEN
    RAISE EXCEPTION 'O produto associado ao contato não pertence a esta loja.';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS leads_produto_mesma_loja ON public.leads;
CREATE TRIGGER leads_produto_mesma_loja
BEFORE INSERT OR UPDATE OF organization_id, produto_id
ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.validar_produto_do_lead_mesma_loja();
