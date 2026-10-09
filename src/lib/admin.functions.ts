import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAILS = ["diano.baiano2015@gmail.com"];

/**
 * Concede o papel de administrador para os e-mails autorizados da loja.
 * Chamada logo após o login.
 */
export const ensureAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const claims = context.claims as { email?: string } | null;
    const email = claims?.email?.toLowerCase();
    const isGlobalAdminEmail = Boolean(email && ADMIN_EMAILS.includes(email));
    let admin = false;

    if (isGlobalAdminEmail) {
      const { data: role, error } = await context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .eq("role", "admin")
        .maybeSingle();

      admin = !error && role?.role === "admin";
    }

    if (admin) {
      const { data: organizations, error } = await context.supabase
        .from("organizations")
        .select("id,name,slug,description,logo_url,primary_color,status")
        .eq("status", "active")
        .order("name", { ascending: true });

      return {
        admin: true,
        organizations: error ? [] : organizations ?? [],
      };
    }

    const { data: memberships, error: membershipsError } = await context.supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", context.userId);

    if (membershipsError) {
      return { admin: false, organizations: [] };
    }

    const ids = memberships?.map((item) => item.organization_id) ?? [];
    if (ids.length === 0) {
      return { admin: false, organizations: [] };
    }

    const { data: organizations, error: organizationsError } = await context.supabase
      .from("organizations")
      .select("id,name,slug,description,logo_url,primary_color,status")
      .in("id", ids)
      .eq("status", "active")
      .order("name", { ascending: true });

    return {
      admin: false,
      organizations: organizationsError ? [] : organizations ?? [],
    };
  });
