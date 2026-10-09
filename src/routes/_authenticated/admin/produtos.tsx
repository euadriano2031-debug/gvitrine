import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CheckCheck, Copy, Eye, EyeOff, MessageCircle, Palette, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { compartilharProdutoWhatsApp, fetchCategoriasAdmin, fetchProdutosAdmin, mensagemCompartilhamentoProduto, produtoCompartilhamentoUrl, produtoPublicUrl, uploadImagem, type Produto } from "@/lib/loja";
import { Button } from "@/components/ui/button";
import { getActiveOrganizationId, getActiveOrganizationSlug, listarMinhasOrganizacoes } from "@/lib/saas";
import { CardTextAppearanceEditor } from "@/components/admin/CardTextAppearanceEditor";
import { ProductBenefitsEditor } from "@/components/admin/ProductBenefitsEditor";
import { SectionHeadingEditor } from "@/components/admin/SectionHeadingEditor";
import { LoadMoreButtonEditor } from "@/components/admin/LoadMoreButtonEditor";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type SecaoFiltro = "todos" | "destaque" | "vitrine";
export type StatusFiltro = "todos" | "ativos" | "inativos";
export type FiltrosProdutos = { secao: SecaoFiltro; status: StatusFiltro };

const SECOES_VALIDAS: SecaoFiltro[] = ["todos", "destaque", "vitrine"];
const STATUS_VALIDOS: StatusFiltro[] = ["todos", "ativos", "inativos"];

function normalizarSecao(valor: unknown): SecaoFiltro {
  return SECOES_VALIDAS.includes(valor as SecaoFiltro) ? (valor as SecaoFiltro) : "todos";
}

function normalizarStatus(valor: unknown): StatusFiltro {
  return STATUS_VALIDOS.includes(valor as StatusFiltro) ? (valor as StatusFiltro) : "todos";
}

export const Route = createFileRoute("/_authenticated/admin/produtos")({
  head: () => ({ meta: [
    { title: "Gerenciar produtos — AP SISTEMAS" },
    { name: "description", content: "Cadastre e atualize os produtos da vitrine AP SISTEMAS." },
    { property: "og:title", content: "Gerenciar produtos — AP SISTEMAS" },
    { property: "og:description", content: "Cadastre e atualize os produtos da vitrine." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  validateSearch: (search: Record<string, unknown>): FiltrosProdutos => ({
    secao: normalizarSecao(search.secao),
    status: normalizarStatus(search.status),
  }),
  component: ProdutosAdmin,
});

const PROVEDORES = ["Checkout Pro", "Mercado Pago", "Hotmart", "Kiwify", "Perfect Pay", "Monetizze", "personalizado"];
const POR_PAGINA = 10;

type Form = Partial<Produto> & { tagsTexto?: string };

const BOTOES_POPUP = ["comprar", "video", "site", "whatsapp"] as const;
type BotaoPopup = (typeof BOTOES_POPUP)[number];

function normalizarOrdemBotoes(ordem?: readonly string[] | null): BotaoPopup[] {
  const itens = Array.isArray(ordem)
    ? ordem.filter((item): item is BotaoPopup => BOTOES_POPUP.includes(item as BotaoPopup))
    : [];
  const atual = Array.from(new Set(itens));
  const completa = [...atual, ...BOTOES_POPUP.filter((item) => !atual.includes(item))];
  return completa.slice(0, 4);
}

function trocarPosicaoBotoes(ordem: BotaoPopup[], posicao: number, escolhido: BotaoPopup) {
  const atual = [...ordem];
  const outraPosicao = atual.indexOf(escolhido);
  if (outraPosicao === -1 || outraPosicao === posicao) return atual;
  [atual[posicao], atual[outraPosicao]] = [atual[outraPosicao], atual[posicao]];
  return atual;
}

const vazio: Form = {
  titulo: "",
  descricao: "",
  preco: 0,
  secao: "vitrine",
  ativo: true,
  ordem: 0,
  comprar_texto: "Comprar",
  comprar_cor: "#3b82f6",
  comprar_provedor: "personalizado",
  comprar_ativo: true,
  demo_texto: "Ver Demo",
  demo_cor: "#dc2626",
  demo_ativo: true,
  desconto: "",
  desconto_cor: "#f97316",
  desconto_ativo: true,
  tagsTexto: "",
  pix_icone: "pix",
  site_url: "",
  site_texto: "Ver Site",
  site_cor: "#16a34a",
  site_ativo: true,
  whatsapp_compartilhar_ativo: true,
  whatsapp_compartilhar_cor: "#25D366",
  whatsapp_compartilhar_texto: "Compartilhar no WhatsApp",
  whatsapp_compartilhar_titulo: "",
  whatsapp_compartilhar_descricao: "",
  whatsapp_compartilhar_imagem_url: "",
  whatsapp_compartilhar_url: "",
  botoes_ordem: ["comprar", "video", "site", "whatsapp"],
};

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
  
function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M20.52 3.48A11.83 11.83 0 0 0 12.08 0C5.55 0 .24 5.31.24 11.84c0 2.09.55 4.13 1.6 5.93L.14 24l6.38-1.67a11.78 11.78 0 0 0 5.56 1.41h.01c6.52 0 11.83-5.31 11.83-11.84 0-3.16-1.23-6.13-3.4-8.42Zm-8.44 18.2h-.01a9.84 9.84 0 0 1-5.02-1.37l-.36-.21-3.78.99 1.01-3.69-.23-.38a9.85 9.85 0 0 1-1.51-5.17C2.18 6.41 6.62 1.97 12.08 1.97a9.85 9.85 0 0 1 7.02 2.92 9.88 9.88 0 0 1 2.9 7.03c0 5.47-4.45 9.91-9.92 9.91Zm5.43-7.43c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.34.22-.64.07-.3-.15-1.27-.47-2.42-1.5-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.38-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.21 5.1 4.51.71.31 1.27.5 1.7.64.71.23 1.35.2 1.85.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

function ProdutosAdmin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["produtos-admin"], queryFn: () => fetchProdutosAdmin() });
  const { data: categorias = [] } = useQuery({ queryKey: ["categorias-admin"], queryFn: () => fetchCategoriasAdmin() });
  const { data: minhasOrganizacoes = [] } = useQuery({
    queryKey: ["minhas-organizacoes"],
    queryFn: listarMinhasOrganizacoes,
  });
  const { secao, status } = Route.useSearch();
  const navegar = useNavigate({ from: Route.fullPath });
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");
  const [pagina, setPagina] = useState(1);
  const [form, setForm] = useState<Form | null>(null);
  const [enviando, setEnviando] = useState<null | "imagem" | "video" | "popup">(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editandoAparencia, setEditandoAparencia] = useState(false);
  const [editandoBeneficios, setEditandoBeneficios] = useState(false);
  const [editandoTitulosSecoes, setEditandoTitulosSecoes] = useState(false);
  const [editandoBotaoVerMais, setEditandoBotaoVerMais] = useState(false);
  const [produtoContexto, setProdutoContexto] = useState<Produto | null>(null);
  const [compartilhandoId, setCompartilhandoId] = useState<string | null>(null);
  const [statusCompartilhamento, setStatusCompartilhamento] = useState<string | null>(null);
  const [produtoCompartilhar, setProdutoCompartilhar] = useState<Produto | null>(null);
  const [shareTitulo, setShareTitulo] = useState("");
  const [shareDescricao, setShareDescricao] = useState("");
  const [shareImagemUrl, setShareImagemUrl] = useState("");
  const [shareTelefone, setShareTelefone] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [shareOrganizationSlug, setShareOrganizationSlug] = useState<string | null>(null);
  const [salvandoCompartilhamento, setSalvandoCompartilhamento] = useState(false);
  const [enviandoImagemCompartilhamento, setEnviandoImagemCompartilhamento] = useState(false);

  const definir = (patch: Partial<FiltrosProdutos>) => {
    setPagina(1);
    void navegar({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  };

  const invalidar = () => {
    void qc.invalidateQueries({ queryKey: ["produtos-admin"] });
    void qc.invalidateQueries({ queryKey: ["produtos-publicos"] });
  };

  const salvar = useMutation({
    mutationFn: async (f: Form) => {
      const { tagsTexto, id, created_at, updated_at, ...resto } = f;
      const payload = {
        ...resto,
        titulo: (resto.titulo ?? "").trim(),
        descricao: resto.descricao ?? "",
        imagem_url: resto.imagem_url?.trim() || null,
        video_url: resto.video_url?.trim() || null,
        popup_video_url: resto.popup_video_url?.trim() || null,
        popup_video_tipo: resto.popup_video_tipo || "auto",
        popup_imagem_url: resto.popup_imagem_url?.trim() || null,
        demo_url: resto.demo_url?.trim() || null,
        checkout_url: resto.checkout_url?.trim() || null,
        whatsapp_url: resto.whatsapp_url?.trim() || null,
        site_url: resto.site_url?.trim() || null,
        site_texto: (resto.site_texto ?? "Ver Site").trim() || "Ver Site",
        site_cor: resto.site_cor || "#16a34a",
        site_ativo: resto.site_ativo ?? true,
        whatsapp_compartilhar_ativo: resto.whatsapp_compartilhar_ativo ?? true,
        whatsapp_compartilhar_cor: resto.whatsapp_compartilhar_cor || "#25D366",
        whatsapp_compartilhar_texto: (resto.whatsapp_compartilhar_texto ?? "Compartilhar no WhatsApp").trim() || "Compartilhar no WhatsApp",
        whatsapp_compartilhar_titulo: resto.whatsapp_compartilhar_titulo?.trim() || null,
        whatsapp_compartilhar_descricao: resto.whatsapp_compartilhar_descricao?.trim() || null,
        whatsapp_compartilhar_imagem_url: resto.whatsapp_compartilhar_imagem_url?.trim() || null,
        whatsapp_compartilhar_url: resto.whatsapp_compartilhar_url?.trim() || null,
        botoes_ordem: normalizarOrdemBotoes(resto.botoes_ordem),
        secao: resto.secao ?? "vitrine",
        destaque: (resto.secao ?? "vitrine") === "destaque",
        preco: Number(resto.preco ?? 0),
        ordem: Number(resto.ordem ?? 0),
        preco_antigo: resto.preco_antigo != null && `${resto.preco_antigo}` !== "" ? Number(resto.preco_antigo) : null,
        tags: (tagsTexto ?? "").split(",").map((t) => t.trim()).filter(Boolean),
        categoria_id: resto.categoria_id || null,
      };
      if (!payload.titulo) throw new Error("Informe o nome do produto.");
      const organizationId = getActiveOrganizationId();

      if (id) {
        let query = supabase.from("produtos").update(payload).eq("id", id);
        query = organizationId ? query.eq("organization_id", organizationId) : query.is("organization_id", null);
        const { error } = await query;
        if (error) throw error;
      } else {
        const { error } = await supabase.from("produtos").insert({
          ...payload,
          organization_id: organizationId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setForm(null);
      invalidar();
    },
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const organizationId = getActiveOrganizationId();
      let query = supabase.from("produtos").delete().eq("id", id);
      query = organizationId ? query.eq("organization_id", organizationId) : query.is("organization_id", null);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: invalidar,
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : "Erro ao excluir"),
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Produto> }) => {
      const organizationId = getActiveOrganizationId();
      let query = supabase.from("produtos").update(patch).eq("id", id);
      query = organizationId ? query.eq("organization_id", organizationId) : query.is("organization_id", null);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: invalidar,
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : "Erro ao atualizar"),
  });

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return data.filter((p) => {
      const naSecao = secao === "todos" || (secao === "destaque" ? p.secao === "destaque" : p.secao !== "destaque");
      const naCategoria = categoriaFiltro === "todas" || p.categoria_id === categoriaFiltro;
      const noStatus = status === "todos" || (status === "ativos" ? p.ativo : !p.ativo);
      const naBusca = !q || p.titulo.toLowerCase().includes(q) || p.tags?.some((t) => t.toLowerCase().includes(q));
      return naSecao && naCategoria && noStatus && naBusca;
    });
  }, [data, busca, secao, status, categoriaFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  const abrirEdicao = (p: Produto) => {
    setErro(null);
    setForm({ ...p, tagsTexto: (p.tags ?? []).join(", ") });
  };

  const duplicarProduto = (p: Produto) => {
    setErro(null);
    setForm({
      ...p,
      id: undefined,
      slug: undefined,
      organization_id: getActiveOrganizationId(),
      created_at: undefined,
      updated_at: undefined,
      titulo: `${p.titulo} (cópia)`,
      tagsTexto: (p.tags ?? []).join(", "),
    });
  };

  const abrirCompartilhamento = (produto: Produto) => {
    setStatusCompartilhamento(null);
    setShareTitulo(produto.whatsapp_compartilhar_titulo?.trim() || produto.titulo);
    setShareDescricao(produto.whatsapp_compartilhar_descricao?.trim() || produto.descricao || "");
    setShareImagemUrl(produto.whatsapp_compartilhar_imagem_url?.trim() || "");
    setShareTelefone("");
    setShareUrl(produto.whatsapp_compartilhar_url?.trim() || "");
    const slugDaOrganizacao = produto.organization_id
      ? minhasOrganizacoes.find((loja) => loja.id === produto.organization_id)?.slug ?? getActiveOrganizationSlug()
      : null;
    setShareOrganizationSlug(slugDaOrganizacao);
    setProdutoCompartilhar(produto);
  };

  const enviarImagemParaCompartilhamento = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setStatusCompartilhamento("Selecione uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatusCompartilhamento("A imagem da oferta deve ter no máximo 10 MB.");
      return;
    }
    setEnviandoImagemCompartilhamento(true);
    setStatusCompartilhamento(null);
    try {
      const url = await uploadImagem(file, "whatsapp");
      setShareImagemUrl(url);
      setStatusCompartilhamento("Imagem da oferta carregada. Ela será usada no próximo compartilhamento.");
    } catch (e) {
      setStatusCompartilhamento(e instanceof Error ? e.message : "Não foi possível enviar a imagem.");
    } finally {
      setEnviandoImagemCompartilhamento(false);
    }
  };

  const compartilharNoWhatsApp = async (produto: Produto) => {
    setCompartilhandoId(produto.id);
    setStatusCompartilhamento(null);
    try {
      const resultado = await compartilharProdutoWhatsApp(produto, {
        titulo: shareTitulo,
        descricao: shareDescricao,
        imagem_url: shareImagemUrl,
        telefone: shareTelefone,
        url: shareUrl,
        organizationSlug: shareOrganizationSlug,
      });
      if (resultado === "compartilhado") {
        setStatusCompartilhamento("Oferta compartilhada com imagem, texto personalizado e link do produto.");
      } else if (resultado === "whatsapp-imagem-copiada") {
        setStatusCompartilhamento("WhatsApp aberto. Escolha o contato ou grupo e, quando a imagem tiver sido copiada, cole-a no chat antes de enviar.");
      } else if (resultado === "whatsapp") {
        setStatusCompartilhamento("WhatsApp Web aberto com a conversa e a oferta pronta para enviar.");
      }
    } catch (e) {
      setStatusCompartilhamento(e instanceof Error ? e.message : "Não foi possível compartilhar a oferta.");
    } finally {
      setCompartilhandoId(null);
    }
  };

  const salvarPersonalizacaoCompartilhamento = async () => {
    if (!produtoCompartilhar) return;
    setSalvandoCompartilhamento(true);
    setStatusCompartilhamento(null);
    try {
      await atualizar.mutateAsync({
        id: produtoCompartilhar.id,
        patch: {
          whatsapp_compartilhar_titulo: shareTitulo.trim() || null,
          whatsapp_compartilhar_descricao: shareDescricao.trim() || null,
          whatsapp_compartilhar_imagem_url: shareImagemUrl.trim() || null,
          whatsapp_compartilhar_url: shareUrl.trim() || null,
        },
      });
      setProdutoCompartilhar({
        ...produtoCompartilhar,
        whatsapp_compartilhar_titulo: shareTitulo.trim() || null,
        whatsapp_compartilhar_descricao: shareDescricao.trim() || null,
        whatsapp_compartilhar_imagem_url: shareImagemUrl.trim() || null,
        whatsapp_compartilhar_url: shareUrl.trim() || null,
      });
      setStatusCompartilhamento("Personalização da oferta salva neste produto.");
    } catch (e) {
      setStatusCompartilhamento(e instanceof Error ? e.message : "Não foi possível salvar a personalização.");
    } finally {
      setSalvandoCompartilhamento(false);
    }
  };

  const LIMITE_MB = { imagem: 10, video: 50, popup: 10 } as const;

  const enviarArquivo = async (
    file: File,
    tipo: "imagem" | "video" | "popup",
  ) => {
    setErro(null);
    const esperado = tipo === "video" ? "video/" : "image/";
    if (!file.type.startsWith(esperado)) {
      setErro(tipo === "video" ? "Envie um arquivo de vídeo (MP4, WebM ou OGG)." : "Envie um arquivo de imagem (JPG, PNG ou WebP).");
      return;
    }
    const limite = LIMITE_MB[tipo];
    if (file.size > limite * 1024 * 1024) {
      setErro(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). O limite é ${limite} MB.`);
      return;
    }
    setEnviando(tipo);
    try {
      const pasta = tipo === "imagem" ? "produtos" : tipo === "video" ? "videos" : "popup";
      const campo = tipo === "imagem" ? "imagem_url" : tipo === "video" ? "video_url" : "popup_imagem_url";
      const url = await uploadImagem(file, pasta);
      setForm((f) => (f ? { ...f, [campo]: url } : f));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha no upload do arquivo");
    } finally {
      setEnviando(null);
    }
  };



  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie os produtos em Destaque e da Vitrine Completa.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setEditandoBeneficios(true)}>
            <CheckCheck /> Personalizar benefícios
          </Button>
          <Button type="button" variant="outline" onClick={() => setEditandoTitulosSecoes(true)}>
            <Palette /> Personalizar títulos
          </Button>
          <Button type="button" variant="outline" onClick={() => setEditandoTitulosSecoes(true)}>
            <Pencil /> Editar “Produtos em Destaque”
          </Button>
          <Button type="button" variant="outline" onClick={() => setEditandoBotaoVerMais(true)}>
            <Palette /> Personalizar “Ver mais”
          </Button>
          <Button
            type="button"
            onClick={() => {
              setErro(null);
              setForm({ ...vazio });
            }}
          >
            <Plus /> Novo produto
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            placeholder="Pesquisar por nome ou tag..."
            className={inputCls + " pl-9"}
          />
        </div>
        <select
          value={secao}
          onChange={(e) => definir({ secao: e.target.value as SecaoFiltro })}
          className={inputCls + " w-auto"}
        >
          <option value="todos">Todas as seções</option>
          <option value="destaque">Produtos em Destaque</option>
          <option value="vitrine">Vitrine Completa</option>
        </select>
        <select
          value={status}
          onChange={(e) => definir({ status: e.target.value as StatusFiltro })}
          className={inputCls + " w-auto"}
        >
          <option value="todos">Todos os status</option>
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
        </select>
        <select
          value={categoriaFiltro}
          onChange={(e) => {
            setCategoriaFiltro(e.target.value);
            setPagina(1);
          }}
          className={inputCls + " w-auto"}
        >
          <option value="todas">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      {erro && !form && (
        <p className="mt-4 rounded-md bg-destructive/10 p-3 text-xs text-destructive">{erro}</p>
      )}
      {statusCompartilhamento && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-[#25D366]/10 p-3 text-xs font-medium text-[#15803D]" role="status">
          <WhatsAppIcon className="h-4 w-4 shrink-0" />
          {statusCompartilhamento}
        </div>
      )}



      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Seção</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Ordem</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Carregando...</td>
              </tr>
            )}
            {!isLoading && visiveis.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Nenhum produto encontrado.</td>
              </tr>
            )}
            {visiveis.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.imagem_url ? (
                      <img src={p.imagem_url} alt={p.titulo} className="h-10 w-14 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-14 rounded bg-muted" />
                    )}
                    <div>
                      <div className="font-medium">{p.titulo}</div>
                      <div className="text-xs text-muted-foreground">{(p.tags ?? []).join(", ")}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{p.secao === "destaque" ? "Destaque" : "Vitrine"}</td>
                <td className="px-4 py-3">
                  {categorias.find((c) => c.id === p.categoria_id)?.nome ?? "—"}
                </td>
                <td className="px-4 py-3">R$ {Number(p.preco).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => atualizar.mutate({ id: p.id, patch: { ordem: p.ordem - 1 } })} className="rounded p-1 hover:bg-muted" aria-label="Subir">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center">{p.ordem}</span>
                    <button onClick={() => atualizar.mutate({ id: p.id, patch: { ordem: p.ordem + 1 } })} className="rounded p-1 hover:bg-muted" aria-label="Descer">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => atualizar.mutate({ id: p.id, patch: { ativo: !p.ativo } })}
                    className={
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium " +
                      (p.ativo ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")
                    }
                  >
                    {p.ativo ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {p.ativo ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => abrirCompartilhamento(p)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#25D366]/40 bg-[#25D366]/10 px-2.5 py-1.5 text-xs font-semibold text-[#15803D] transition hover:bg-[#25D366]/20"
                      title={`Pré-visualizar e compartilhar ${p.titulo} no WhatsApp`}
                      aria-label={`Compartilhar ${p.titulo} no WhatsApp`}
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      WhatsApp
                    </button>
                    <button onClick={() => abrirEdicao(p)} className="rounded p-2 hover:bg-muted" aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => duplicarProduto(p)} className="rounded p-2 hover:bg-muted" aria-label="Duplicar" title="Duplicar produto">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir "${p.titulo}"?`)) excluir.mutate(p.id);
                      }}
                      className="rounded p-2 text-destructive hover:bg-destructive/10"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPaginas }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPagina(i + 1)}
              className={
                "h-9 w-9 rounded-md border text-sm " +
                (paginaAtual === i + 1 ? "border-transparent bg-primary text-primary-foreground" : "border-border hover:bg-muted")
              }
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(produtoCompartilhar)}
        onOpenChange={(aberto) => {
          if (!aberto && !compartilhandoId) setProdutoCompartilhar(null);
        }}
      >
        <DialogContent className="grid-rows-[auto_minmax(0,1fr)_auto] min-h-0 w-[calc(100%-1.5rem)] max-w-lg max-h-[88vh] overflow-hidden p-4 sm:p-5">
          <DialogHeader className="shrink-0">
            <DialogTitle>Pré-visualização do WhatsApp</DialogTitle>
            <DialogDescription>
              Revise a divulgação deste produto antes de enviar para um cliente ou grupo.
            </DialogDescription>
          </DialogHeader>

          {produtoCompartilhar && (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 scrollbar-thin">
              <div className="space-y-4 pb-2">
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted">
                  {shareImagemUrl || produtoCompartilhar.imagem_url ? (
                    <img
                      src={shareImagemUrl || produtoCompartilhar.imagem_url || undefined}
                      alt={shareTitulo || produtoCompartilhar.titulo}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                      Sem imagem do produto
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="text-base font-bold">{shareTitulo || produtoCompartilhar.titulo}</h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {shareDescricao || "Sem descrição cadastrada."}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {produtoCompartilhar.desconto_ativo && produtoCompartilhar.desconto && (
                      <span
                        className="rounded-md px-2 py-1 font-bold text-white"
                        style={{ backgroundColor: produtoCompartilhar.desconto_cor || "#f97316" }}
                      >
                        {produtoCompartilhar.desconto}
                      </span>
                    )}
                    <span className="rounded-md bg-muted px-2 py-1 font-semibold">
                      R$ {Number(produtoCompartilhar.preco).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Campo label="Título da oferta no WhatsApp">
                  <input
                    value={shareTitulo}
                    onChange={(e) => setShareTitulo(e.target.value)}
                    className={inputCls}
                    placeholder={produtoCompartilhar.titulo}
                  />
                </Campo>
                <Campo label="WhatsApp do cliente (opcional)">
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={shareTelefone}
                    onChange={(e) => setShareTelefone(e.target.value.replace(/[^0-9+() -]/g, ""))}
                    className={inputCls}
                    placeholder="(71) 99999-9999"
                  />
                </Campo>
                <Campo label="Link específico da oferta/produto">
                  <input
                    type="url"
                    value={shareUrl}
                    onChange={(e) => setShareUrl(e.target.value)}
                    className={inputCls}
                    placeholder={produtoPublicUrl(produtoCompartilhar, undefined, shareOrganizationSlug)}
                  />
                </Campo>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-semibold">Imagem que será enviada ao WhatsApp</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_auto]">
                  <Campo label="URL da imagem da oferta">
                    <input
                      type="url"
                      value={shareImagemUrl}
                      onChange={(e) => setShareImagemUrl(e.target.value)}
                      className={inputCls}
                      placeholder={produtoCompartilhar.imagem_url || "https://.../imagem-da-oferta.jpg"}
                    />
                  </Campo>
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                      <Upload className="h-4 w-4" /> {enviandoImagemCompartilhamento ? "Enviando..." : "Enviar imagem"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={enviandoImagemCompartilhamento}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void enviarImagemParaCompartilhamento(file);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShareImagemUrl("")}
                      className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                    >
                      Usar imagem do produto
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Deixe vazio para usar automaticamente a imagem principal deste produto. Uma URL personalizada substitui somente a imagem da oferta.
                </p>
              </div>

              <Campo label="Descrição da oferta no WhatsApp">
                <textarea
                  rows={6}
                  value={shareDescricao}
                  onChange={(e) => setShareDescricao(e.target.value)}
                  className={inputCls + " min-h-[150px] resize-y leading-relaxed"}
                  placeholder={produtoCompartilhar.descricao || "Descrição da oferta"}
                />
              </Campo>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">Prévia da mensagem que será enviada</span>
                <textarea
                  readOnly
                  value={mensagemCompartilhamentoProduto(produtoCompartilhar, undefined, {
                    titulo: shareTitulo,
                    descricao: shareDescricao,
                    url: shareUrl,
                    organizationSlug: shareOrganizationSlug,
                  })}
                  className={inputCls + " min-h-[170px] resize-y whitespace-pre-wrap bg-muted/30 leading-relaxed"}
                />
              </label>

              <div className="rounded-md border border-[#25D366]/30 bg-[#25D366]/10 p-3 text-xs text-[#166534]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">Link que o cliente vai abrir</p>
                    <p className="mt-1 break-all">{produtoCompartilhamentoUrl(produtoCompartilhar, undefined, shareUrl || undefined, shareOrganizationSlug)}</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#25D366]/30 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-[#166534] hover:bg-white"
                    onClick={async () => {
                      const link = produtoCompartilhamentoUrl(produtoCompartilhar, undefined, shareUrl, shareOrganizationSlug);
                      try {
                        await navigator.clipboard.writeText(link);
                        setStatusCompartilhamento("Link do produto copiado.");
                      } catch {
                        setStatusCompartilhamento("Não foi possível copiar o link automaticamente.");
                      }
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Copiar link
                  </button>
                </div>
                <p className="mt-2">
                  Deixe o campo de link vazio para usar automaticamente a página exclusiva deste produto ({produtoPublicUrl(produtoCompartilhar, undefined, shareOrganizationSlug)}).
                </p>
              </div>
              </div>
            </div>
          )}

          <DialogFooter className="shrink-0 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProdutoCompartilhar(null)}
              disabled={Boolean(compartilhandoId) || salvandoCompartilhamento || enviandoImagemCompartilhamento}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!produtoCompartilhar || Boolean(compartilhandoId) || salvandoCompartilhamento || enviandoImagemCompartilhamento}
              onClick={() => void salvarPersonalizacaoCompartilhamento()}
            >
              {salvandoCompartilhamento ? "Salvando..." : "Salvar personalização"}
            </Button>
            <Button
              type="button"
              className="bg-[#25D366] text-white hover:bg-[#1ebe5d]"
              disabled={!produtoCompartilhar || Boolean(compartilhandoId) || salvandoCompartilhamento || enviandoImagemCompartilhamento}
              onClick={async () => {
                if (!produtoCompartilhar) return;
                await compartilharNoWhatsApp(produtoCompartilhar);
                setProdutoCompartilhar(null);
              }}
            >
              <WhatsAppIcon className="h-4 w-4" />
              {compartilhandoId ? "Abrindo WhatsApp..." : "Compartilhar no WhatsApp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
          <div className="my-8 w-full max-w-3xl rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{form.id ? "Editar produto" : "Novo produto"}</h2>
              <button onClick={() => setForm(null)} className="rounded p-2 hover:bg-muted" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              className="mt-5 space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                setErro(null);
                salvar.mutate(form);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Nome do produto">
                  <input required value={form.titulo ?? ""} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className={inputCls} />
                </Campo>
                <Campo label="Seção">
                  <select value={form.secao ?? "vitrine"} onChange={(e) => setForm({ ...form, secao: e.target.value, destaque: e.target.value === "destaque" })} className={inputCls}>
                    <option value="destaque">Produtos em Destaque</option>
                    <option value="vitrine">Vitrine Completa</option>
                  </select>
                </Campo>
                <Campo label="Categoria">
                  <select value={form.categoria_id ?? ""} onChange={(e) => setForm({ ...form, categoria_id: e.target.value || null })} className={inputCls}>
                    <option value="">Sem categoria</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Tags (separadas por vírgula)">
                  <input value={form.tagsTexto ?? ""} onChange={(e) => setForm({ ...form, tagsTexto: e.target.value })} className={inputCls} placeholder="IA, Sites, Automação" />
                </Campo>
                <Campo label="Selo (ex: NOVO)">
                  <input value={form.selo ?? ""} onChange={(e) => setForm({ ...form, selo: e.target.value })} className={inputCls} />
                </Campo>
                <Campo label="Valor (R$)">
                  <input type="number" step="0.01" value={String(form.preco ?? 0)} onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })} className={inputCls} />
                </Campo>
                <Campo label="Valor antigo (R$)">
                  <input type="number" step="0.01" value={form.preco_antigo != null ? String(form.preco_antigo) : ""} onChange={(e) => setForm({ ...form, preco_antigo: e.target.value === "" ? null : Number(e.target.value) })} className={inputCls} />
                </Campo>
                <Campo label="Parcelamento">
                  <input value={form.parcelamento ?? ""} onChange={(e) => setForm({ ...form, parcelamento: e.target.value })} className={inputCls} placeholder="12x de R$ 29,70" />
                </Campo>
                <Campo label="Ícone do preço">
                  <select
                    value={form.pix_icone ?? "pix"}
                    onChange={(e) => setForm({ ...form, pix_icone: e.target.value })}
                    className={inputCls}
                  >
                    <option value="pix">Ícone PIX</option>
                    <option value="cartao">Ícone Cartão</option>
                    <option value="raio">Ícone Raio</option>
                    <option value="carrinho">Ícone Carrinho de compra</option>
                  </select>
                </Campo>
                <Campo label="Ordem">
                  <input type="number" value={String(form.ordem ?? 0)} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} className={inputCls} />
                </Campo>
              </div>

              <Campo label="Descrição do produto (aparece no popup Detalhes)">
                <textarea
                  rows={12}
                  value={form.descricao ?? ""}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className={inputCls + " min-h-[220px] resize-y leading-relaxed"}
                  placeholder={"Escreva a descrição completa.\n\nQuebras de linha e listas são preservadas no popup.\nEx.: ✅ Código-fonte completo"}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {(form.descricao ?? "").length} caracteres — este texto aparece no card e no popup "Detalhes".
                </p>
              </Campo>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Imagem de capa do card (URL)">
                  <input value={form.imagem_url ?? ""} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} className={inputCls} placeholder="https://..." />
                </Campo>
                <div>
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Upload da imagem de capa</span>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                    <Upload className="h-4 w-4" /> {enviando === "imagem" ? "Enviando..." : "Escolher arquivo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void enviarArquivo(f, "imagem");
                      }}
                    />
                  </label>
                  {form.imagem_url && <img src={form.imagem_url} alt="Prévia" className="mt-2 h-20 w-32 rounded object-cover" />}
                </div>
              </div>

              <fieldset className="rounded-lg border border-border p-4">
                <legend className="px-1 text-sm font-semibold">Vídeo do card (abre ao clicar na imagem)</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo label="Link do vídeo (YouTube ou MP4)">
                    <input
                      value={form.video_url ?? ""}
                      onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                      className={inputCls}
                      placeholder="https://youtu.be/... ou https://.../video.mp4"
                    />
                  </Campo>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Upload de vídeo MP4</span>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                      <Upload className="h-4 w-4" /> {enviando === "video" ? "Enviando..." : "Escolher arquivo"}
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void enviarArquivo(f, "video");
                        }}
                      />
                    </label>
                    {form.video_url && (
                      <p className="mt-2 break-all text-[11px] text-muted-foreground">{form.video_url}</p>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Sem vídeo, o selo "Clique Aqui" abre o link de demonstração.
                </p>
              </fieldset>

              <fieldset className="rounded-lg border border-border p-4">
                <legend className="px-1 text-sm font-semibold">Popup "Ver Demo"</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo label="Link do vídeo do popup (YouTube, MP4 ou iframe)">
                    <input
                      value={form.popup_video_url ?? ""}
                      onChange={(e) => setForm({ ...form, popup_video_url: e.target.value })}
                      className={inputCls}
                      placeholder="Deixe vazio para usar o vídeo do card"
                    />
                  </Campo>
                  <Campo label="Tipo do vídeo">
                    <select
                      value={form.popup_video_tipo ?? "auto"}
                      onChange={(e) => setForm({ ...form, popup_video_tipo: e.target.value })}
                      className={inputCls}
                    >
                      <option value="auto">Detectar automaticamente</option>
                      <option value="youtube">YouTube</option>
                      <option value="mp4">MP4 / vídeo</option>
                      <option value="iframe">Iframe / outro</option>
                    </select>
                  </Campo>
                  <Campo label="Imagem de capa do popup (URL)">
                    <input
                      value={form.popup_imagem_url ?? ""}
                      onChange={(e) => setForm({ ...form, popup_imagem_url: e.target.value })}
                      className={inputCls}
                      placeholder="Deixe vazio para usar a capa do card"
                    />
                  </Campo>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Upload da capa do popup</span>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                      <Upload className="h-4 w-4" /> {enviando === "popup" ? "Enviando..." : "Escolher arquivo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void enviarArquivo(f, "popup");
                        }}
                      />
                    </label>
                    {form.popup_imagem_url && (
                      <img src={form.popup_imagem_url} alt="Prévia" className="mt-2 h-20 w-32 rounded object-cover" />
                    )}
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Estes campos alimentam automaticamente o popup aberto pelo botão "Ver Demo".
                </p>
              </fieldset>



              <fieldset className="rounded-lg border border-border p-4">
                <legend className="px-2 text-sm font-semibold">Botão Ver Site</legend>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Campo label="Texto">
                    <input
                      value={form.site_texto ?? "Ver Site"}
                      maxLength={30}
                      onChange={(e) => setForm({ ...form, site_texto: e.target.value })}
                      className={inputCls}
                      placeholder="Ver Site"
                    />
                  </Campo>
                  <Campo label="Cor">
                    <input
                      type="color"
                      value={form.site_cor ?? "#16a34a"}
                      onChange={(e) => setForm({ ...form, site_cor: e.target.value })}
                      className={inputCls + " h-10 p-1"}
                    />
                  </Campo>
                  <Campo label="Ativo no popup">
                    <select
                      value={form.site_ativo === false ? "0" : "1"}
                      onChange={(e) => setForm({ ...form, site_ativo: e.target.value === "1" })}
                      className={inputCls}
                    >
                      <option value="1">Sim</option>
                      <option value="0">Não</option>
                    </select>
                  </Campo>
                </div>

                <div className="mt-4">
                  <Campo label="Link do site deste produto">
                    <input
                      type="url"
                      value={form.site_url ?? ""}
                      onChange={(e) => setForm({ ...form, site_url: e.target.value })}
                      className={inputCls}
                      placeholder="https://seusite.com.br"
                    />
                  </Campo>
                </div>

                <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold">Pré-visualização</p>
                  <div className="mt-2">
                    <span
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold text-white"
                      style={{
                        backgroundColor: form.site_cor ?? "#16a34a",
                        borderColor: form.site_cor ?? "#16a34a",
                        opacity: form.site_ativo === false ? 0.55 : 1,
                      }}
                    >
                      <span aria-hidden="true">🌐</span>
                      {form.site_texto || "Ver Site"}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    O botão aparece no popup de detalhes somente quando estiver ativo e houver um link preenchido.
                  </p>
                </div>
              </fieldset>

              <fieldset className="rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 p-4">
                <legend className="px-2 text-sm font-semibold">Botão WhatsApp</legend>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Campo label="Texto">
                    <input
                      value={form.whatsapp_compartilhar_texto ?? "Compartilhar no WhatsApp"}
                      maxLength={40}
                      onChange={(e) => setForm({ ...form, whatsapp_compartilhar_texto: e.target.value })}
                      className={inputCls}
                      placeholder="Compartilhar no WhatsApp"
                    />
                  </Campo>
                  <Campo label="Cor">
                    <input
                      type="color"
                      value={form.whatsapp_compartilhar_cor ?? "#25D366"}
                      onChange={(e) => setForm({ ...form, whatsapp_compartilhar_cor: e.target.value })}
                      className={inputCls + " h-10 p-1"}
                    />
                  </Campo>
                  <Campo label="Ativo no popup">
                    <select
                      value={form.whatsapp_compartilhar_ativo === false ? "0" : "1"}
                      onChange={(e) => setForm({ ...form, whatsapp_compartilhar_ativo: e.target.value === "1" })}
                      className={inputCls}
                    >
                      <option value="1">Sim</option>
                      <option value="0">Não</option>
                    </select>
                  </Campo>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Campo label="Título da oferta no WhatsApp">
                    <input
                      value={form.whatsapp_compartilhar_titulo ?? ""}
                      maxLength={120}
                      onChange={(e) => setForm({ ...form, whatsapp_compartilhar_titulo: e.target.value })}
                      className={inputCls}
                      placeholder={form.titulo || "Título da oferta"}
                    />
                  </Campo>
                  <Campo label="Link específico da oferta/produto">
                    <input
                      type="url"
                      value={form.whatsapp_compartilhar_url ?? ""}
                      onChange={(e) => setForm({ ...form, whatsapp_compartilhar_url: e.target.value })}
                      className={inputCls}
                      placeholder={form.id ? produtoPublicUrl({ id: form.id, slug: form.slug ?? null }) : "https://seusite.com.br/produto"}
                    />
                  </Campo>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Campo label="Imagem específica da oferta (URL)">
                    <input
                      type="url"
                      value={form.whatsapp_compartilhar_imagem_url ?? ""}
                      onChange={(e) => setForm({ ...form, whatsapp_compartilhar_imagem_url: e.target.value })}
                      className={inputCls}
                      placeholder="Deixe vazio para usar a imagem do produto"
                    />
                  </Campo>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Imagem de compartilhamento</span>
                    <p className="text-[11px] text-muted-foreground">
                      No compartilhamento, esta imagem será anexada quando o navegador/dispositivo suportar envio de arquivos pelo WhatsApp.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Campo label="Descrição da oferta no WhatsApp">
                    <textarea
                      rows={5}
                      value={form.whatsapp_compartilhar_descricao ?? ""}
                      onChange={(e) => setForm({ ...form, whatsapp_compartilhar_descricao: e.target.value })}
                      className={inputCls + " min-h-[130px] resize-y leading-relaxed"}
                      placeholder={form.descricao || "Deixe vazio para usar a descrição do produto"}
                    />
                  </Campo>
                </div>

                <div className="mt-4 rounded-md border border-[#25D366]/20 bg-background p-3">
                  <p className="text-xs font-semibold">Link público exclusivo deste produto</p>
                  <p className="mt-1 break-all text-[11px] text-muted-foreground">
                    {form.id
                      ? produtoPublicUrl({ id: form.id, slug: form.slug ?? null })
                      : "O link exclusivo será gerado automaticamente depois que o produto for salvo."}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    O campo "Link específico da oferta/produto" sobrescreve este endereço somente para a divulgação no WhatsApp. Deixe vazio para usar o link exclusivo do próprio produto.
                  </p>
                </div>

                <div className="mt-4 rounded-md border border-[#25D366]/20 bg-background p-3">
                  <p className="text-xs font-semibold">Pré-visualização</p>
                  <div className="mt-2">
                    <span
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold text-white"
                      style={{
                        backgroundColor: form.whatsapp_compartilhar_cor ?? "#25D366",
                        borderColor: form.whatsapp_compartilhar_cor ?? "#25D366",
                        opacity: form.whatsapp_compartilhar_ativo === false ? 0.55 : 1,
                      }}
                    >
                      <span aria-hidden="true">💬</span>
                      {form.whatsapp_compartilhar_texto || "Compartilhar no WhatsApp"}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    No celular, quando o navegador permitir compartilhamento de arquivos, a imagem do produto também acompanha a mensagem.
                  </p>
                </div>
              </fieldset>

              <fieldset className="rounded-lg border border-border bg-muted/20 p-4">
                <legend className="px-2 text-sm font-semibold">Ordem dos botões no popup</legend>
                <p className="mb-4 text-xs text-muted-foreground">
                  Escolha a posição dos botões <strong>Comprar</strong>, <strong>Ver vídeo</strong>, <strong>Ver Site</strong> e <strong>WhatsApp</strong> neste produto.
                </p>

                <div className="grid gap-3 sm:grid-cols-4">
                  {[0, 1, 2, 3].map((posicao) => {
                    const ordem = normalizarOrdemBotoes(form.botoes_ordem as string[] | undefined);
                    return (
                      <Campo key={posicao} label={
                            posicao === 0
                              ? "1º — Superior"
                              : posicao === 1
                                ? "2º — Segundo"
                                : posicao === 2
                                  ? "3º — Terceiro"
                                  : "4º — Inferior"
                          }>
                        <select
                          value={ordem[posicao]}
                          onChange={(e) => {
                            const escolhido = e.target.value as BotaoPopup;
                            setForm({
                              ...form,
                              botoes_ordem: trocarPosicaoBotoes(ordem, posicao, escolhido),
                            });
                          }}
                          className={inputCls}
                        >
                          <option value="comprar">Comprar</option>
                          <option value="video">Ver vídeo</option>
                          <option value="site">Ver Site</option>
                          <option value="whatsapp">WhatsApp</option>
                        </select>
                      </Campo>
                    );
                  })}
                </div>

                <div className="mt-4 grid gap-2">
                  {normalizarOrdemBotoes(form.botoes_ordem as string[] | undefined).map((botao, indice) => (
                    <div key={botao} className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {indice + 1}
                      </span>
                      <span className="font-medium">
                        {botao === "comprar" ? "Botão Comprar" : botao === "video" ? "Botão Ver vídeo" : botao === "site" ? "Botão Ver Site" : "Botão WhatsApp"}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-[11px] text-muted-foreground">
                  A ordem salva aqui é usada somente no popup deste produto.
                </p>
              </fieldset>

              <fieldset className="rounded-lg border border-border bg-muted/20 p-4">
                <legend className="px-2 text-sm font-semibold">Personalização de textos</legend>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full justify-center gap-2"
                  onClick={() => {
                    setProdutoContexto(form.id ? ({ ...form } as Produto) : null);
                    setEditandoAparencia(true);
                  }}
                >
                  <Palette className="h-4 w-4" /> Personalizar textos
                </Button>
              </fieldset>

              <fieldset className="rounded-lg border border-border p-4">
                <legend className="px-2 text-sm font-semibold">Botão Comprar</legend>
                <div className="grid gap-4 sm:grid-cols-4">
                  <Campo label="Texto"><input value={form.comprar_texto ?? ""} onChange={(e) => setForm({ ...form, comprar_texto: e.target.value })} className={inputCls} /></Campo>
                  <Campo label="Cor"><input type="color" value={form.comprar_cor ?? "#3b82f6"} onChange={(e) => setForm({ ...form, comprar_cor: e.target.value })} className={inputCls + " h-10 p-1"} /></Campo>
                  <Campo label="Plataforma">
                    <select value={form.comprar_provedor ?? "personalizado"} onChange={(e) => setForm({ ...form, comprar_provedor: e.target.value })} className={inputCls}>
                      {PROVEDORES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Campo>
                  <Campo label="Ativo">
                    <select value={form.comprar_ativo ? "1" : "0"} onChange={(e) => setForm({ ...form, comprar_ativo: e.target.value === "1" })} className={inputCls}>
                      <option value="1">Sim</option><option value="0">Não</option>
                    </select>
                  </Campo>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo label="Link de checkout"><input value={form.checkout_url ?? ""} onChange={(e) => setForm({ ...form, checkout_url: e.target.value })} className={inputCls} placeholder="https://..." /></Campo>
                  <Campo label="Link do WhatsApp"><input value={form.whatsapp_url ?? ""} onChange={(e) => setForm({ ...form, whatsapp_url: e.target.value })} className={inputCls} placeholder="https://wa.me/55..." /></Campo>
                </div>
              </fieldset>

              <fieldset className="rounded-lg border border-border p-4">
                <legend className="px-2 text-sm font-semibold">Botão Ver Demonstração</legend>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Campo label="Texto"><input value={form.demo_texto ?? ""} onChange={(e) => setForm({ ...form, demo_texto: e.target.value })} className={inputCls} /></Campo>
                  <Campo label="Cor"><input type="color" value={form.demo_cor ?? "#dc2626"} onChange={(e) => setForm({ ...form, demo_cor: e.target.value })} className={inputCls + " h-10 p-1"} /></Campo>
                  <Campo label="Ativo">
                    <select value={form.demo_ativo ? "1" : "0"} onChange={(e) => setForm({ ...form, demo_ativo: e.target.value === "1" })} className={inputCls}>
                      <option value="1">Sim</option><option value="0">Não</option>
                    </select>
                  </Campo>
                </div>
                <Campo label="Link (site, landing page ou página de vendas)"><input value={form.demo_url ?? ""} onChange={(e) => setForm({ ...form, demo_url: e.target.value })} className={inputCls} /></Campo>
              </fieldset>

              <fieldset className="rounded-lg border border-border p-4">
                <legend className="px-2 text-sm font-semibold">Selo de desconto na imagem</legend>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Campo label="Texto (ex: 30% OFF)"><input value={form.desconto ?? ""} onChange={(e) => setForm({ ...form, desconto: e.target.value })} className={inputCls} /></Campo>
                  <Campo label="Cor"><input type="color" value={form.desconto_cor ?? "#f97316"} onChange={(e) => setForm({ ...form, desconto_cor: e.target.value })} className={inputCls + " h-10 p-1"} /></Campo>
                  <Campo label="Ativo">
                    <select value={form.desconto_ativo ? "1" : "0"} onChange={(e) => setForm({ ...form, desconto_ativo: e.target.value === "1" })} className={inputCls}>
                      <option value="1">Sim</option><option value="0">Não</option>
                    </select>
                  </Campo>
                </div>
              </fieldset>

              <Campo label="Produto visível na loja">
                <select value={form.ativo ? "1" : "0"} onChange={(e) => setForm({ ...form, ativo: e.target.value === "1" })} className={inputCls}>
                  <option value="1">Mostrar</option><option value="0">Ocultar</option>
                </select>
              </Campo>

              {erro && <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{erro}</p>}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setForm(null)} className="rounded-md border border-border px-4 py-2 text-sm">Cancelar</button>
                <button type="submit" disabled={salvar.isPending || !!enviando} className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                  {enviando ? "Aguarde o upload..." : salvar.isPending ? "Salvando..." : "Salvar produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editandoAparencia && <CardTextAppearanceEditor onClose={() => { setEditandoAparencia(false); setProdutoContexto(null); }} produtoNome={produtoContexto?.titulo} />}
      {editandoBeneficios && <ProductBenefitsEditor onClose={() => setEditandoBeneficios(false)} />}
      {editandoBotaoVerMais && <LoadMoreButtonEditor onClose={() => setEditandoBotaoVerMais(false)} />}
      {editandoTitulosSecoes && <SectionHeadingEditor onClose={() => setEditandoTitulosSecoes(false)} />}
    </div>
  );
}
