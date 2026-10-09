import { supabase } from "@/integrations/supabase/client";

export type AdminOrganization = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  primary_color: string;
  status: string;
};

export type AdminAccess = {
  admin: boolean;
  organizations: AdminOrganization[];
};

/**
 * Loads the current user's access using the user's own Supabase session.
 *
 * This intentionally runs in the browser: the app stores the Supabase session in
 * localStorage, which does not automatically attach an Authorization header to a
 * TanStack server-function request. All reads here are restricted by Supabase RLS;
 * this helper only controls UI navigation and is not an authorization boundary.
 */
export async function ensureAdminRole(): Promise<AdminAccess> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Sua sessão expirou. Entre novamente para continuar.");
  }

  const userId = userData.user.id;
  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) throw roleError;
  const admin = role?.role === "admin";

  if (admin) {
    const { data: organizations, error } = await supabase
      .from("organizations")
      .select("id,name,slug,description,logo_url,primary_color,status")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) throw error;
    return { admin: true, organizations: (organizations ?? []) as AdminOrganization[] };
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId);

  if (membershipError) throw membershipError;

  const organizationIds = (memberships ?? []).map((item) => item.organization_id);
  if (organizationIds.length === 0) {
    return { admin: false, organizations: [] };
  }

  const { data: organizations, error: organizationError } = await supabase
    .from("organizations")
    .select("id,name,slug,description,logo_url,primary_color,status")
    .in("id", organizationIds)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (organizationError) throw organizationError;

  return { admin: false, organizations: (organizations ?? []) as AdminOrganization[] };
}
