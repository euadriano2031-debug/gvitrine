import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Resolve o acesso administrativo usando a role persistida no banco.
 * A consulta é limitada ao usuário autenticado pelo middleware e pelas políticas RLS;
 * não depende de um e-mail fixo, que poderia bloquear o administrador legítimo.
 */
export const ensureAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    // Falha fechada: um erro de consulta nunca concede privilégio administrativo.
    const admin = !roleError && role?.role === "admin";

    if (admin) {
      const { data: organizations, error } = await context.supabase
        .from("organizations")
        .select("id,name,slug,description,logo_url,primary_color,status")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) throw error;

      return {
        admin: true,
        organizations: organizations ?? [],
      };
    }

    const { data: memberships, error: membershipsError } = await context.supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", context.userId);

    if (membershipsError) throw membershipsError;

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

    if (organizationsError) throw organizationsError;

    return {
      admin: false,
      organizations: organizations ?? [],
    };
  });
