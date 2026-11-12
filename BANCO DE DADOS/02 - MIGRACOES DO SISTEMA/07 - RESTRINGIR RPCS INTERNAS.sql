-- G-Vitrine security hardening (safe to run more than once).
-- These functions are internal implementation details invoked by the organization
-- creation trigger. Public clients must not be able to clone legacy products into
-- arbitrary organizations by calling the RPC endpoints directly.
REVOKE EXECUTE ON FUNCTION public.initialize_organization_from_legacy(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.initialize_organization_from_legacy(uuid) FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.sync_products_from_main_store(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_products_from_main_store(uuid) FROM anon, authenticated;

-- Trigger function: it is only meant to execute as part of INSERT on organizations.
REVOKE EXECUTE ON FUNCTION public.organizations_after_insert() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.organizations_after_insert() FROM anon, authenticated;
