import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getActiveOrganizationId } from "@/lib/saas";

export type Produto = Tables<"produtos">;
export type Categoria = Tables<"categorias">;

export type CompartilhamentoConfig = {
  imagem_url: string;
  titulo: string;
  descricao: string;
  site_url: string;
};

export const compartilhamentoPadrao: CompartilhamentoConfig = {
  imagem_url: "",
  titulo: "G-Vitrine",
  descricao: "Loja digital com produtos e soluções prontas para você.",
  site_url: "https://g-vitrine.lovable.app/",
};

export type IconeTituloSecaoConfig = {
  modo: "icone" | "imagem";
  texto: string;
  texto_cor: string;
  texto_tamanho: number;
  icone_cor: string;
  icone_tamanho: number;
  icone_imagem_url: string;
};

export type TitulosSecoesConfig = {
  destaque: IconeTituloSecaoConfig;
  vitrine: IconeTituloSecaoConfig;
};

export const iconosTitulosSecoesPadrao: TitulosSecoesConfig = {
  destaque: {
    modo: "icone",
    texto: "Produtos em Destaque",
    texto_cor: "",
    texto_tamanho: 24,
    icone_cor: "#f97316",
    icone_tamanho: 24,
    icone_imagem_url: "",
  },
  vitrine: {
    modo: "icone",
    texto: "Vitrine Completa",
    texto_cor: "",
    texto_tamanho: 24,
    icone_cor: "#f97316",
    icone_tamanho: 24,
    icone_imagem_url: "",
  },
};

export function normalizarTitulosSecoes(valor?: Partial<TitulosSecoesConfig> | null): TitulosSecoesConfig {
  return {
    destaque: {
      ...iconosTitulosSecoesPadrao.destaque,
      ...(valor?.destaque ?? {}),
    },
    vitrine: {
      ...iconosTitulosSecoesPadrao.vitrine,
      ...(valor?.vitrine ?? {}),
    },
  };
}

export type CategoriaBotaoTamanho = "pequeno" | "medio" | "grande";
export type CategoriaBotaoModo = "botao" | "imagem";

export type CategoriaBotaoConfig = {
  modo: CategoriaBotaoModo;
  texto: string;
  texto_cor: string;
  fundo_cor: string;
  tamanho: CategoriaBotaoTamanho;
  imagem_url: string;
  imagem_alt: string;
};

export type CategoriaBotoesConfig = Record<string, CategoriaBotaoConfig>;

export const categoriaBotaoPadrao: CategoriaBotaoConfig = {
  modo: "botao",
  texto: "",
  texto_cor: "",
  fundo_cor: "",
  tamanho: "medio",
  imagem_url: "",
  imagem_alt: "",
};

export const categoriaBotoesPadrao: CategoriaBotoesConfig = {};

export type BotaoVerMaisModo = "botao" | "imagem";
export type BotaoVerMaisTamanho = "pequeno" | "medio" | "grande";

export type BotaoVerMaisConfig = {
  modo: BotaoVerMaisModo;
  texto: string;
  texto_cor: string;
  fundo_cor: string;
  tamanho: BotaoVerMaisTamanho;
  imagem_url: string;
  imagem_alt: string;
};

export const botaoVerMaisPadrao: BotaoVerMaisConfig = {
  modo: "botao",
  texto: "Ver mais",
  texto_cor: "",
  fundo_cor: "",
  tamanho: "medio",
  imagem_url: "",
  imagem_alt: "Ver mais produtos",
};

export type RodapeConfig = {
  texto: string;
};

export const rodapePadrao: RodapeConfig = {
  texto: "© {{ANO}} {{LOJA}} — Todos os direitos reservados.",
};

export function textoRodape(
  texto: string,
  nomeLoja: string,
  ano = new Date().getFullYear(),
) {
  const base = texto?.trim() || rodapePadrao.texto;
  return base
    .replace(/\{\{ANO\}\}/g, String(ano))
    .replace(/\{\{LOJA\}\}/g, nomeLoja?.trim() || "Loja Vitrine");
}

export type FaviconConfig = {
  url: string;
};

export const faviconPadrao: FaviconConfig = {
  url: "/favicon.ico",
};

export type AdminHeaderConfig = {
  titulo: string;
  titulo_cor: string;
  titulo_tamanho: number;
  menu_fundo_cor: string;
  menu_icone_cor: string;
  loja_texto: string;
  loja_texto_cor: string;
  loja_texto_tamanho: number;
  loja_fundo_cor: string;
  loja_icone_cor: string;
  sidebar_titulo: string;
  sidebar_subtitulo: string;
  sidebar_titulo_cor: string;
  sidebar_titulo_tamanho: number;
  sidebar_subtitulo_cor: string;
  sidebar_subtitulo_tamanho: number;
  sidebar_fundo_cor: string;
  sidebar_icone_cor: string;
  sidebar_icone: string;
};

export const adminHeaderPadrao: AdminHeaderConfig = {
  titulo: "Painel da Loja",
  titulo_cor: "#16a34a",
  titulo_tamanho: 18,
  menu_fundo_cor: "#16a34a",
  menu_icone_cor: "#ffffff",
  loja_texto: "LOJA",
  loja_texto_cor: "#ffffff",
  loja_texto_tamanho: 12,
  loja_fundo_cor: "#16a34a",
  loja_icone_cor: "#ffffff",
  sidebar_titulo: "Administração",
  sidebar_subtitulo: "Loja digital",
  sidebar_titulo_cor: "#0f172a",
  sidebar_titulo_tamanho: 15,
  sidebar_subtitulo_cor: "#64748b",
  sidebar_subtitulo_tamanho: 11,
  sidebar_fundo_cor: "#16a34a",
  sidebar_icone_cor: "#ffffff",
  sidebar_icone: "store",
};

export type CardTextConfig = {
  titulo_cor: string;
  titulo_tamanho: number;
  descricao_cor: string;
  descricao_tamanho: number;
  preco_antigo_cor: string;
  preco_antigo_tamanho: number;
  pix_cor: string;
  pix_tamanho: number;
  preco_cor: string;
  preco_tamanho: number;
  parcelamento_cor: string;
  parcelamento_tamanho: number;
};

export const cardTextPadrao: CardTextConfig = {
  titulo_cor: "",
  titulo_tamanho: 15,
  descricao_cor: "",
  descricao_tamanho: 12,
  preco_antigo_cor: "",
  preco_antigo_tamanho: 12,
  pix_cor: "",
  pix_tamanho: 11,
  preco_cor: "",
  preco_tamanho: 24,
  parcelamento_cor: "",
  parcelamento_tamanho: 10,
};

export type ProductBenefitsConfig = {
  itens: string[];
  texto_cor: string;
  icone_cor: string;
};

export const productBenefitsPadrao: ProductBenefitsConfig = {
  itens: ["Código-fonte completo", "Licença para uso comercial", "Atualizações gratuitas"],
  texto_cor: "#6b7280",
  icone_cor: "#16a34a",
};

export type BannerConfig = {
  ativo: boolean;
  tipo: "youtube" | "mp4" | "iframe";
  video_url: string;
  mp4_url: string;
  capa_url: string;
  autoplay: boolean;
  controles: boolean;
  selo_tipo: "texto" | "imagem";
  selo_imagem_url: string;
  selo_tamanho_fonte: number;
  selo_cor_texto: string;
  selo_cor_fundo: string;
  selo_icone_modo: "icone" | "imagem";
  selo_icone_cor: string;
  selo_icone_imagem_url: string;
  selo_icone_tamanho: number;
  titulo: string;
  subtitulo: string;
  descricao: string;
  cor_fundo: string;
  cor_texto: string;
  posicao: "left" | "center" | "right";
};

export type AjudaConfig = {
  ativo: boolean;
  numero: string;
  mensagem: string;
  texto: string;
  icone: "whatsapp" | "chat" | "ajuda" | "telefone";
  imagem_url: string;
  cor_fundo: string;
  cor_texto: string;
  tamanho: "pequeno" | "medio" | "grande";
  posicao: "bottom-right" | "bottom-left";
  destino_tipo: "whatsapp" | "link";
  url_destino: string;
};

export const bannerPadrao: BannerConfig = {
  ativo: true,
  tipo: "youtube",
  video_url: "https://www.youtube.com/embed/xFLaqcsRP40",
  mp4_url: "",
  capa_url: "",
  autoplay: false,
  controles: true,
  selo_tipo: "texto",
  selo_imagem_url: "",
  selo_tamanho_fonte: 14,
  selo_cor_texto: "#111827",
  selo_cor_fundo: "#ffffff",
  selo_icone_modo: "icone",
  selo_icone_cor: "#16a34a",
  selo_icone_imagem_url: "",
  selo_icone_tamanho: 18,
  titulo: "Códigos-fonte, automações e IA prontos para vender",
  subtitulo: "Lançamento",
  descricao:
    "Marketplace de produtos digitais premium para você lançar seu próprio negócio em minutos.",
  cor_fundo: "",
  cor_texto: "",
  posicao: "center",
};

export const ajudaPadrao: AjudaConfig = {
  ativo: true,
  numero: "5511999999999",
  mensagem: "Olá! 👋 Preciso de ajuda para escolher um produto da loja. Poderia me atender?",
  texto: "Precisa de Ajuda?",
  icone: "whatsapp",
  imagem_url: "",
  cor_fundo: "#25D366",
  cor_texto: "#ffffff",
  tamanho: "medio",
  posicao: "bottom-right",
  destino_tipo: "whatsapp",
  url_destino: "",
};

function escopoOrganizacao<T>(query: T, organizationId = getActiveOrganizationId()) {
  const q = query as {
    eq: (column: string, value: unknown) => T;
    is: (column: string, value: null) => T;
  };
  return organizationId ? q.eq("organization_id", organizationId) : q.is("organization_id", null);
}

export async function fetchConfig<T>(
  chave: string,
  padrao: T,
  organizationId = getActiveOrganizationId(),
): Promise<T> {
  let query = supabase.from("configuracoes").select("valor").eq("chave", chave);
  query = escopoOrganizacao(query, organizationId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data?.valor) return padrao;
  return { ...padrao, ...(data.valor as object) } as T;
}

export async function salvarConfig(
  chave: string,
  valor: unknown,
  organizationId = getActiveOrganizationId(),
) {
  if (organizationId) {
    const { error } = await supabase
      .from("configuracoes")
      .upsert(
        {
          chave,
          valor: valor as never,
          organization_id: organizationId,
        },
        { onConflict: "organization_id,chave" },
      );

    if (error) throw error;
    return;
  }

  // Mantém compatibilidade com o modo legado sem organização.
  const { data: existente, error: selectError } = await supabase
    .from("configuracoes")
    .select("id")
    .eq("chave", chave)
    .is("organization_id", null)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existente?.id) {
    const { error } = await supabase
      .from("configuracoes")
      .update({ valor: valor as never })
      .eq("id", existente.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("configuracoes").insert({
    chave,
    valor: valor as never,
    organization_id: null,
  });
  if (error) throw error;
}
export async function fetchProdutosPublicos(organizationId = getActiveOrganizationId()) {
  let query = supabase
    .from("produtos")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  query = escopoOrganizacao(query, organizationId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Produto[];
}

export async function fetchProdutosAdmin(organizationId = getActiveOrganizationId()) {
  let query = supabase.from("produtos").select("*").order("ordem", { ascending: true });
  query = escopoOrganizacao(query, organizationId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Produto[];
}

/** Slug público do produto (fallback para o id quando ainda não gerado). */
export function produtoSlug(p: Pick<Produto, "id" | "slug">) {
  return p.slug || p.id;
}

export async function fetchCategorias(organizationId = getActiveOrganizationId()): Promise<Categoria[]> {
  let query = supabase
    .from("categorias")
    .select("*")
    .order("ordem", { ascending: true })
    .order("nome", { ascending: true });
  query = escopoOrganizacao(query, organizationId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Categoria[];
}

export async function fetchCategoriasAdmin(organizationId = getActiveOrganizationId()): Promise<Categoria[]> {
  return fetchCategorias(organizationId);
}

export async function criarCategoria(
  input: { nome: string; slug: string; ordem?: number },
  organizationId = getActiveOrganizationId(),
) {
  const { error } = await supabase.from("categorias").insert({
    nome: input.nome.trim(),
    slug: input.slug.trim(),
    ordem: input.ordem ?? 0,
    organization_id: organizationId,
  });
  if (error) throw error;
}

export async function atualizarCategoria(
  id: string,
  input: { nome?: string; slug?: string; ordem?: number },
  organizationId = getActiveOrganizationId(),
) {
  let query = supabase.from("categorias").update({
    nome: input.nome?.trim(),
    slug: input.slug?.trim(),
    ordem: input.ordem,
  }).eq("id", id);
  query = escopoOrganizacao(query, organizationId);
  const { error } = await query;
  if (error) throw error;
}

export async function excluirCategoria(id: string, organizationId = getActiveOrganizationId()) {
  let query = supabase.from("categorias").delete().eq("id", id);
  query = escopoOrganizacao(query, organizationId);
  const { error } = await query;
  if (error) throw error;
}

export async function fetchProdutoPublicoPorLoja(
  organizationSlug: string,
  productSlug: string,
): Promise<Produto | null> {
  const { data, error } = await supabase.rpc("public_produto_por_loja", {
    _organization_slug: organizationSlug,
    _product_slug: productSlug,
  });
  if (error) throw error;
  return data ? (data as unknown as Produto) : null;
}

export async function fetchProdutoPorSlug(
  slug: string,
  organizationId = getActiveOrganizationId(),
): Promise<Produto | null> {
  let query = supabase.from("produtos").select("*").eq("ativo", true).eq("slug", slug);
  query = escopoOrganizacao(query, organizationId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (data) return data as Produto;

  const ehUuid = /^[0-9a-f-]{36}$/i.test(slug);
  if (!ehUuid) return null;

  let idQuery = supabase.from("produtos").select("*").eq("ativo", true).eq("id", slug);
  idQuery = escopoOrganizacao(idQuery, organizationId);
  const { data: porId, error: erroId } = await idQuery.maybeSingle();
  if (erroId) throw erroId;
  return (porId as Produto) ?? null;
}

/** Faz upload no bucket privado e devolve um link assinado de longa duração. */
export async function uploadImagem(file: File, pasta = "produtos") {
  const ext = file.name.split(".").pop() ?? "jpg";
  const organizationId = getActiveOrganizationId();
  const path = organizationId
    ? `${organizationId}/${pasta}/${crypto.randomUUID()}.${ext}`
    : `${pasta}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("loja").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("loja")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signErr) throw signErr;
  return data.signedUrl;
}

export function youtubeEmbed(url: string) {
  const limpo = (url || "").trim();
  if (!limpo) return "";
  // aceita link colado dentro de um <iframe src="...">
  const doIframe = limpo.match(/src=["']([^"']+)["']/i);
  const base = doIframe ? doIframe[1] : limpo;
  const match = base.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([\w-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : base;
}

/** Junta parâmetros à URL respeitando query string já existente. */
export function comParams(url: string, params: Record<string, string | number>) {
  if (!url) return "";
  const query = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  if (!query) return url;
  return url + (url.includes("?") ? "&" : "?") + query;
}

/** Garante que links externos abram corretamente (adiciona https:// quando faltar). */
export function linkExterno(url?: string | null) {
  const limpo = (url || "").trim();
  if (!limpo) return "";
  if (/^(https?:|mailto:|tel:)/i.test(limpo)) return limpo;
  return `https://${limpo}`;
}

export function whatsappLink(numero?: string | null, mensagem?: string | null) {
  const num = (numero || "").replace(/\D/g, "");
  const texto = encodeURIComponent(mensagem || "Olá! Tenho interesse neste produto.");
  return `https://wa.me/${num}?text=${texto}`;
}

/** Monta a mensagem organizada de um lead para envio no WhatsApp. */
export function mensagemLeadWhatsapp(l: {
  nome: string;
  email?: string | null;
  telefone?: string | null;
  mensagem?: string | null;
  produto?: string | null;
}) {
  const linhas = [
    "*Novo contato pela Loja Vitrine*",
    "",
    `*Nome:* ${l.nome}`,
    `*E-mail:* ${l.email?.trim() || "não informado"}`,
    `*Telefone:* ${l.telefone?.trim() || "não informado"}`,
  ];
  if (l.produto) linhas.push(`*Produto:* ${l.produto}`);
  linhas.push(`*Mensagem:* ${l.mensagem?.trim() || "não informada"}`);
  linhas.push("", `_Enviado em ${new Date().toLocaleString("pt-BR")}_`);
  return linhas.join("\n");
}


export function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export type Lead = Tables<"leads">;

export type LeadComProduto = Lead & {
  produtos?: { titulo: string } | null;
  status?: string | null;
  source?: string | null;
  page_url?: string | null;
};

export async function fetchLeadsAdmin(organizationId = getActiveOrganizationId()): Promise<LeadComProduto[]> {
  let query = supabase
    .from("leads")
    .select("*, produtos:produto_id(titulo)")
    .order("created_at", { ascending: false });
  query = escopoOrganizacao(query, organizationId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as LeadComProduto[];
}

export async function criarLead(
  input: {
    nome: string;
    email?: string | null;
    telefone?: string | null;
    mensagem?: string | null;
    produto_id?: string | null;
  },
  organizationId = getActiveOrganizationId(),
) {
  const { error } = await supabase.from("leads").insert({
    ...input,
    organization_id: organizationId,
  });
  if (error) throw error;
}

export async function excluirLead(id: string, organizationId = getActiveOrganizationId()) {
  let query = supabase.from("leads").delete().eq("id", id);
  query = escopoOrganizacao(query, organizationId);
  const { error } = await query;
  if (error) throw error;
}

export function formatarData(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function whatsappLeadLink(telefone?: string | null, nome?: string | null) {
  const num = (telefone || "").replace(/\D/g, "");
  const texto = encodeURIComponent(`Olá${nome ? ` ${nome}` : ""}! Recebemos seu contato pela loja. 😊`);
  return num ? `https://wa.me/${num}?text=${texto}` : "";
}

export function produtoPublicUrl(
  p: Pick<Produto, "id" | "slug">,
  origin?: string,
  organizationSlug: string | null = null,
) {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "https://g-vitrine.lovable.app");
  const path = organizationSlug
    ? `/loja/${encodeURIComponent(organizationSlug)}/produto/${encodeURIComponent(produtoSlug(p))}`
    : `/produto/${encodeURIComponent(produtoSlug(p))}`;
  return new URL(path, base).href;
}

export type PersonalizacaoCompartilhamentoProduto = {
  titulo?: string | null;
  descricao?: string | null;
  url?: string | null;
  imagem_url?: string | null;
  telefone?: string | null;
  organizationSlug?: string | null;
};

export function produtoCompartilhamentoUrl(
  p: Pick<Produto, "id" | "slug" | "whatsapp_compartilhar_url">,
  origin?: string,
  urlOverride?: string | null,
  organizationSlug?: string | null,
) {
  return (
    linkExterno(urlOverride) ||
    linkExterno(p.whatsapp_compartilhar_url) ||
    produtoPublicUrl(p, origin, organizationSlug ?? null)
  );
}

export function mensagemCompartilhamentoProduto(
  p: Pick<
    Produto,
    | "id"
    | "slug"
    | "titulo"
    | "descricao"
    | "preco"
    | "preco_antigo"
    | "desconto"
    | "desconto_ativo"
    | "whatsapp_compartilhar_titulo"
    | "whatsapp_compartilhar_descricao"
    | "whatsapp_compartilhar_url"
  >,
  origin?: string,
  overrides?: PersonalizacaoCompartilhamentoProduto,
) {
  const titulo =
    overrides?.titulo?.trim() ||
    p.whatsapp_compartilhar_titulo?.trim() ||
    p.titulo;
  const descricao =
    overrides?.descricao?.trim() ||
    p.whatsapp_compartilhar_descricao?.trim() ||
    p.descricao?.trim() ||
    "Confira este produto na nossa vitrine.";
  const url = overrides?.url?.trim() || produtoPublicUrl(p, origin, overrides?.organizationSlug ?? null);
  const preco = Number(p.preco);
  const precoAntigo = p.preco_antigo != null ? Number(p.preco_antigo) : null;
  const linhas = [
    "🔥 *OFERTA NA G-VITRINE*",
    "",
    `*📦 ${titulo}*`,
    "",
    descricao,
  ];

  if (p.desconto_ativo && p.desconto?.trim()) {
    linhas.push("", `🏷️ *${p.desconto.trim()}*`);
  }

  if (precoAntigo != null && precoAntigo > 0 && preco > 0 && precoAntigo > preco) {
    linhas.push("", `💰 De ${formatBRL(precoAntigo)} por *${formatBRL(preco)}*`);
  } else if (preco > 0) {
    linhas.push("", `💰 *${formatBRL(preco)}*`);
  }

  linhas.push("", `🔗 ${url}`);
  return linhas.join("\n");
}

export async function compartilharProdutoWhatsApp(
  p: Pick<
    Produto,
    | "id"
    | "slug"
    | "titulo"
    | "descricao"
    | "preco"
    | "preco_antigo"
    | "desconto"
    | "desconto_ativo"
    | "imagem_url"
    | "whatsapp_compartilhar_titulo"
    | "whatsapp_compartilhar_descricao"
    | "whatsapp_compartilhar_imagem_url"
    | "whatsapp_compartilhar_url"
  >,
  overrides?: PersonalizacaoCompartilhamentoProduto,
): Promise<"compartilhado" | "whatsapp" | "whatsapp-imagem-copiada" | "cancelado"> {
  if (typeof window === "undefined") return "whatsapp";

  const titulo =
    overrides?.titulo?.trim() ||
    p.whatsapp_compartilhar_titulo?.trim() ||
    p.titulo;
  const imagemUrl =
    linkExterno(overrides?.imagem_url) ||
    linkExterno(p.whatsapp_compartilhar_imagem_url) ||
    linkExterno(p.imagem_url);
  const texto = mensagemCompartilhamentoProduto(p, undefined, overrides);
  const telefone = (overrides?.telefone || "").replace(/\D/g, "");
  const ehMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // No celular, prioriza o compartilhamento nativo para levar a imagem junto.
  if (ehMobile && imagemUrl && typeof navigator.share === "function") {
    try {
      const resposta = await fetch(imagemUrl, { mode: "cors" });
      if (resposta.ok) {
        const blob = await resposta.blob();
        const tipo = blob.type || "image/jpeg";
        const extensao = tipo.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
        const arquivo = new File([blob], `${produtoSlug(p)}.${extensao}`, { type: tipo });
        if (typeof navigator.canShare === "function" && navigator.canShare({ files: [arquivo] })) {
          try {
            await navigator.share({ title: titulo, text: texto, files: [arquivo] });
            return "compartilhado";
          } catch (erro) {
            if (erro instanceof DOMException && erro.name === "AbortError") return "cancelado";
          }
        }
      }
    } catch {
      // fallback para abrir o WhatsApp diretamente.
    }
  }

  // Desktop: usa o Click to Chat oficial do WhatsApp.
  // Sem telefone, o próprio WhatsApp mostra a lista de contatos/conversas para escolher o destinatário.
  // Com telefone, abre diretamente a conversa desse cliente.
  const destino = telefone
    ? `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/?text=${encodeURIComponent(texto)}`;
  const novaAba = window.open(destino, "_blank", "noopener,noreferrer");

  // O navegador não permite anexar uma imagem automaticamente pela URL do WhatsApp Web.
  // Quando possível, copiamos a imagem para a área de transferência para o usuário colar (Ctrl+V) no chat.
  if (imagemUrl && navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      const resposta = await fetch(imagemUrl, { mode: "cors" });
      if (resposta.ok) {
        const blob = await resposta.blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]);
        return "whatsapp-imagem-copiada";
      }
    } catch {
      // segue com o WhatsApp Web aberto normalmente
    }
  }

  if (!novaAba) window.location.href = destino;
  return "whatsapp";
}
export function leadsParaCsv(leads: LeadComProduto[]): string {
  const cabecalho = ["Data", "Nome", "E-mail", "Telefone", "Produto", "Mensagem"];
  const linhas = leads.map((l) => [
    formatarData(l.created_at),
    l.nome,
    l.email ?? "",
    l.telefone ?? "",
    l.produtos?.titulo ?? "",
    (l.mensagem ?? "").replace(/\s+/g, " "),
  ]);
  const esc = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
  return [cabecalho, ...linhas].map((row) => row.map(esc).join(",")).join("\n");
}

export type MarcaConfig = {
  nome: string;
  logo_url: string;
  mostrar_nome: boolean;
  altura_logo: number;
};

export const marcaPadrao: MarcaConfig = {
  nome: "Loja Vitrine",
  logo_url: "",
  mostrar_nome: true,
  altura_logo: 40,
};
