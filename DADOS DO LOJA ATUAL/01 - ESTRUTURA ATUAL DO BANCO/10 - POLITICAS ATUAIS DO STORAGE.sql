-- Política de Storage observada em 2026-11-12.
-- O schema storage é gerenciado pelo Supabase; este arquivo é referência.

CREATE POLICY "Admins gerenciam arquivos da loja" ON storage."objects" AS PERMISSIVE FOR ALL TO "authenticated"
USING (((bucket_id = 'loja'::text) AND
CASE
    WHEN (split_part(name, '/'::text, 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) THEN (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin((split_part(name, '/'::text, 1))::uuid))
    ELSE false
END))
WITH CHECK (((bucket_id = 'loja'::text) AND
CASE
    WHEN (split_part(name, '/'::text, 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) THEN (has_role(auth.uid(), 'admin'::app_role) OR is_organization_admin((split_part(name, '/'::text, 1))::uuid))
    ELSE false
END));