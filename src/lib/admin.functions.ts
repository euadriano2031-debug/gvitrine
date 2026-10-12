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
  /** True only for a platform administrator who is not attached to any store. */
  admin: boolean;
  organizations: AdminOrganization[];
};

/**
 * Resolves the organizations this user is allowed to administer.
 *
 * A global "admin" role is platform-level only. A user who owns or belongs to
 * any store must use explicit organization membership and must not receive a
 * cross-store list through this UI. Supabase RLS remains the authorization
 * boundary even if localStorage is edited.
 */
export async function ensureAdminRole(): Promise<AdminAccess> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Sua sessão expirou. Entre novamente para continuar.");
  }

  const userId = userData.user.id;
  const [roleResponse, membershipResponse, ownedResponse] = await Promise.all([
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle(),
    supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId),
    supabase
      .from("organizations")
      .select("id")
      .eq("owner_user_id", userId)
      .limit(1),
  ]);

  if (roleResponse.error) throw roleResponse.error;
  if (membershipResponse.error) throw membershipResponse.error;
  if (ownedResponse.error) throw ownedResponse.error;

  const memberships = membershipResponse.data ?? [];
  const ownsStore = (ownedResponse.data ?? []).length > 0;
  const linkedToStore = memberships.length > 0 || ownsStore;
  const platformAdmin = roleResponse.data?.role === "admin" && !linkedToStore;

  // Only a dedicated platform account without tenant relationships can use
  // the global view. Store owners/admins always receive their member-scoped list.
  if (platformAdmin) {
    const { data: organizations, error } = await supabase
      .from("organizations")
      .select("id,name,slug,description,logo_url,primary_color,status")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) throw error;
    return { admin: true, organizations: (organizations ?? []) as AdminOrganization[] };
  }

  const organizationIds = [...new Set(memberships.map((item) => item.organization_id))];
  if (organizationIds.length === 0) {
    return { admin: false, organizations: [] };
  }

  const { data: organizations, error } = await supabase
    .from("organizations")
    .select("id,name,slug,description,logo_url,primary_color,status")
    .in("id", organizationIds)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) throw error;

  return { admin: false, organizations: (organizations ?? []) as AdminOrganization[] };
}
