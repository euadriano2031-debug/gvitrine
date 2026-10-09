import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type LojaAdministrativa = Tables<"organizations">;
export type LojaResumo = Pick<
  LojaAdministrativa,
  "id" | "name" | "slug" | "description" | "logo_url" | "primary_color" | "status"
>;

const STORAGE_ORG_ID = "gvitrine_active_organization_id";
const STORAGE_ORG_SLUG = "gvitrine_active_organization_slug";

export function getActiveOrganizationId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_ORG_ID) || null;
}

export function getActiveOrganizationSlug() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_ORG_SLUG) || null;
}

export function setActiveOrganization(
  organization: Pick<LojaAdministrativa, "id" | "slug"> | null,
) {
  if (typeof window === "undefined") return;

  if (!organization) {
    window.localStorage.removeItem(STORAGE_ORG_ID);
    window.localStorage.removeItem(STORAGE_ORG_SLUG);
  } else {
    window.localStorage.setItem(STORAGE_ORG_ID, organization.id);
    window.localStorage.setItem(STORAGE_ORG_SLUG, organization.slug);
  }

  window.dispatchEvent(new CustomEvent("saas-organization-changed"));
}

export function slugifySaaS(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export function tenantStorePath(slug: string) {
  return `/loja/${encodeURIComponent(slug)}`;
}

export function tenantProductPath(orgSlug: string, productSlug: string) {
  return `/loja/${encodeURIComponent(orgSlug)}/produto/${encodeURIComponent(productSlug)}`;
}

export async function listarMinhasOrganizacoes(): Promise<LojaResumo[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return [];

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userData.user.id);

  if (membershipError || !memberships?.length) return [];

  const ids = memberships.map((item) => item.organization_id);
  const { data: organizations, error: organizationsError } = await supabase
    .from("organizations")
    .select("id,name,slug,description,logo_url,primary_color,status")
    .in("id", ids)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (organizationsError) throw organizationsError;
  return (organizations ?? []) as LojaResumo[];
}

/**
 * Cria automaticamente a primeira loja do administrador.
 * A trigger do banco inicializa categorias, produtos e configurações
 * com um snapshot da loja G-Vitrine legada.
 */
export async function atualizarMinhaLoja(
  organizationId: string,
  input: { name: string; slug: string },
): Promise<LojaAdministrativa> {
  const nome = input.name.trim().slice(0, 80);
  const slug = slugifySaaS(input.slug || nome);
  if (!nome) throw new Error("Informe o nome da loja.");
  if (!slug) throw new Error("Informe um nome de loja válido.");

  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario.user) throw new Error("Faça login para alterar sua loja.");

  const { data: membro, error: membroError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", usuario.user.id)
    .maybeSingle();

  if (membroError) throw membroError;
  if (!membro || !["owner", "admin"].includes(membro.role)) {
    throw new Error("Você não tem permissão para alterar esta loja.");
  }

  const { data: slugExistente, error: slugError } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .neq("id", organizationId)
    .maybeSingle();

  if (slugError) throw slugError;
  if (slugExistente) throw new Error("Esse endereço da loja já está em uso. Escolha outro.");

  const { data, error } = await supabase
    .from("organizations")
    .update({ name: nome, slug })
    .eq("id", organizationId)
    .select("*")
    .single();

  if (error) throw error;
  return data as LojaAdministrativa;
}

export async function garantirLojaDoUsuario(nomeLojaInformado?: string): Promise<LojaAdministrativa> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Faça login para acessar sua loja.");
  }

  const existentes = await listarMinhasOrganizacoes();
  if (existentes[0]) {
    return existentes[0] as LojaAdministrativa;
  }

  const email = userData.user.email ?? "";
  const metadata = userData.user.user_metadata as Record<string, unknown> | undefined;
  const nomeLojaMetadata =
    typeof metadata?.store_name === "string" ? metadata.store_name.trim() : "";
  const nomeMetadata =
    typeof metadata?.full_name === "string" ? metadata.full_name.trim() : "";
  const prefixoEmail = email.split("@")[0]?.trim() || "cliente";
  const nomeBase = nomeLojaInformado?.trim() || nomeLojaMetadata || nomeMetadata || "Minha Loja";
  const nomeLoja = nomeBase.replace(/^Loja\s+/i, "").trim().slice(0, 80) || "Minha Loja";
  const baseSlug = slugifySaaS(nomeLoja) || `loja-${userData.user.id.slice(0, 8)}`;
  const slugComIdentificador = `${baseSlug.slice(0, 58)}-${userData.user.id.slice(0, 8)}`;

  let slug = baseSlug;
  const { data: slugExistente, error: slugError } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (slugError) throw slugError;
  if (slugExistente) slug = slugComIdentificador;

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      owner_user_id: userData.user.id,
      name: nomeLoja,
      slug,
      description: "Loja criada automaticamente a partir da estrutura G-Vitrine.",
      primary_color: "#16a34a",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as LojaAdministrativa;
}

export async function buscarOrganizacaoPorSlug(slug: string) {
  const { data, error } = await supabase
    .from("organizations")
    .select("id,name,slug,description,logo_url,primary_color,custom_domain,status,created_at,updated_at")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return (data as LojaAdministrativa | null) ?? null;
}

export async function usuarioEhMembro(organizationId: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { data, error } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
