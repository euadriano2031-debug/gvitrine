-- Allow authorized store admins to create CRM entries directly from the Leads board.
DROP POLICY IF EXISTS "Lead admins insert CRM" ON public.leads;
CREATE POLICY "Lead admins insert CRM"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (
  organization_id IS NOT NULL
  AND (public.has_role(auth.uid(), 'admin'::public.app_role)
       OR public.is_organization_admin(organization_id))
);
