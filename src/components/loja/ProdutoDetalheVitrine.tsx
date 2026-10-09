import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, CreditCard, Globe, Headphones, MessageCircle, Play, Send, ShieldCheck, ShoppingCart, Zap } from "lucide-react";
import { useState } from "react";
import { PixIcon } from "@/components/loja/PixIcon";
import { WhatsAppIcon } from "@/components/loja/WhatsAppIcon";
import {
  ajudaPadrao,
  comParams,
  criarLead,
  fetchCategorias,
  fetchConfig,
  formatBRL,
  linkExterno,
  mensagemLeadWhatsapp,
  productBenefitsPadrao,
  produtoPublicUrl,
  whatsappLink,
  youtubeEmbed,
  type AjudaConfig,
  type Categoria,
  type Produto,
  type ProductBenefitsConfig,
} from "@/lib/loja";

const BOTOES_POPUP = ["comprar", "video", "site", "whatsapp"] as const;
type BotaoPopup = (typeof BOTOES_POPUP)[number];

function normalizarOrdemBotoes(ordem?: readonly string[] | null): BotaoPopup[] {
  const itens = Array.isArray(ordem)
    ? ordem.filter((item): item is BotaoPopup => BOTOES_POPUP.includes(item as BotaoPopup))
    : [];
  const atual = Array.from(new Set(itens));
  return [...atual, ...BOTOES_POPUP.filter((item) => !atual.includes(item))];
}

function ProdutoNaoEncontrado({ organizationSlug }: { organizationSlug?: string | null }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold">Produto não encontrado</h1>
      <p className="mt-3 text-muted-foreground">O produto que você procura não está mais disponível.</p>
      <a href={organizationSlug ? `/loja/${encodeURIComponent(organizationSlug)}` : "/"} className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
        <ArrowLeft className="h-4 w-4" /> Voltar para a loja
      </a>
    </div>
  );
}

function Midia({ p, parte }: { p: Produto; parte: "imagem" | "video" }) {
  const bruto = linkExterno(p.popup_video_url) || linkExterno(p.video_url);
  const tipo = p.popup_video_tipo || "auto";
  const ehMp4 = tipo === "mp4" || (tipo === "auto" && /\.(mp4|webm|ogg)(\?|$)/i.test(bruto));
  const capa = linkExterno(p.popup_imagem_url) || linkExterno(p.imagem_url);
  const src = bruto ? (ehMp4 || tipo === "iframe" ? bruto : comParams(youtubeEmbed(bruto), { rel: 0 })) : "";
  if (parte === "imagem") {
    return (
      <div className="aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted">
        {capa ? <img src={capa} alt={p.titulo} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Sem imagem</div>}
      </div>
    );
  }
  if (!src) return null;
  return (
    <div id="produto-video" className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black scroll-mt-6">
      {ehMp4 ? <video src={src} controls poster={capa || undefined} className="h-full w-full object-contain" /> : <iframe src={src} title={p.titulo} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full border-0" />}
    </div>
  );
}
function FormularioInteresse({ produto, organizationId }: { produto: Produto; organizationId?: string | null }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [linkWhats, setLinkWhats] = useState("");

  const ajuda = useQuery<AjudaConfig>({ queryKey: ["cfg", "ajuda", organizationId ?? "legacy"], queryFn: () => fetchConfig("ajuda", ajudaPadrao, organizationId ?? null) });
  const enviar = useMutation({
    mutationFn: async () => {
      const dados = {
        nome: nome.trim(),
        email: email.trim() || null,
        telefone: telefone.trim() || null,
        mensagem: `Interesse no produto: ${produto.titulo}`,
        produto_id: produto.id,
      };
      await criarLead(dados, organizationId ?? null);
      return dados;
    },
    onSuccess: (dados) => {
      setOk(true);
      const link = whatsappLink(
        ajuda.data?.numero ?? ajudaPadrao.numero,
        mensagemLeadWhatsapp({ ...dados, produto: produto.titulo }),
      );
      setLinkWhats(link);
      if (typeof window !== "undefined") window.open(link, "_blank", "noopener,noreferrer");
      setNome("");
      setEmail("");
      setTelefone("");
    },
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : "Não foi possível enviar."),
  });

  if (ok) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm">
        <p className="font-semibold">Recebemos seu contato! 🎉</p>
        <p className="mt-1 text-muted-foreground">
          Seu contato foi registrado no painel e a mensagem foi aberta no WhatsApp.
        </p>
        {linkWhats && (
          <a
            href={linkWhats}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Send className="h-4 w-4" /> Abrir no WhatsApp
          </a>
        )}
      </div>
    );
  }


  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErro(null);
        if (!nome.trim()) return setErro("Informe seu nome.");
        if (!email.trim() && !telefone.trim()) return setErro("Informe e-mail ou telefone.");
        enviar.mutate();
      }}
      className="space-y-3 rounded-xl border border-border bg-card p-5"
    >
      <p className="text-sm font-semibold">Ficou com dúvida sobre este produto?</p>
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Seu nome"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <input
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
        placeholder="(11) 99999-9999"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      {erro && <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{erro}</p>}
      <button
        type="submit"
        disabled={enviar.isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        <Send className="h-4 w-4" /> {enviar.isPending ? "Enviando..." : "Quero falar com um especialista"}
      </button>
    </form>
  );
}

export type ProdutoDetalheVitrineProps = {
  produto: Produto | null;
  organizationId?: string | null;
  organizationSlug?: string | null;
  organizationName?: string | null;
};

export function ProdutoDetalheVitrine({
  produto: p,
  organizationId = null,
  organizationSlug = null,
  organizationName = null,
}: ProdutoDetalheVitrineProps) {

  const categorias = useQuery<Categoria[]>({ queryKey: ["categorias-publicas", organizationId ?? "legacy"], queryFn: () => fetchCategorias(organizationId ?? null) });
  const beneficios = useQuery<ProductBenefitsConfig>({
    queryKey: ["cfg", "produto_beneficios", organizationId ?? "legacy"],
    queryFn: () => fetchConfig("produto_beneficios", productBenefitsPadrao, organizationId ?? null),
  });
  if (!p) return <ProdutoNaoEncontrado organizationSlug={organizationSlug} />;

  const categoriaNome = categorias.data?.find((c) => c.id === p.categoria_id)?.nome;
  const preco = Number(p.preco);
  const precoAntigo = p.preco_antigo != null ? Number(p.preco_antigo) : null;
  const cor = p.comprar_cor || "#16a34a";
  const checkoutHref = linkExterno(p.checkout_url);
  const demoHref = linkExterno(p.demo_url);
  const whatsHref = linkExterno(p.whatsapp_url);
  const siteHref = linkExterno(p.site_url);
  const siteTexto = p.site_texto?.trim() || "Ver Site";
  const siteCor = p.site_cor || "#16a34a";
  const whatsappTexto = p.whatsapp_compartilhar_texto?.trim() || "Compartilhar no WhatsApp";
  const whatsappCor = p.whatsapp_compartilhar_cor || "#25D366";
  const ordemBotoes = normalizarOrdemBotoes(p.botoes_ordem);
  const IconePreco =
    p.pix_icone === "cartao" ? CreditCard :
    p.pix_icone === "raio" ? Zap :
    p.pix_icone === "carrinho" ? ShoppingCart : PixIcon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <a href={organizationSlug ? `/loja/${encodeURIComponent(organizationSlug)}` : "/"} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar para a loja
        </a>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <Midia p={p} parte="imagem" />

            <Midia p={p} parte="video" />

            <div className="flex flex-wrap items-center gap-2">
              {categoriaNome && (
                <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                  {categoriaNome}
                </span>
              )}
              {p.selo && (
                <span className="rounded-md bg-foreground/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-background">
                  {p.selo}
                </span>
              )}
              {p.desconto_ativo && p.desconto && (
                <span className="rounded-md px-2 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: p.desconto_cor }}>
                  {p.desconto}
                </span>
              )}
              {p.tags?.map((t) => (
                <span key={t} className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{p.titulo}</h1>
            </div>

            <div className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
              {p.descricao || "Descrição em breve."}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, t: "Garantia de 7 dias", d: "Devolução incondicional." },
                { icon: Zap, t: "Acesso imediato", d: "Entrega logo após o pagamento." },
                { icon: Headphones, t: "Suporte dedicado", d: "Time pronto para ajudar." },
              ].map((b) => (
                <div key={b.t} className="rounded-xl border border-border bg-card p-4">
                  <b.icon className="h-5 w-5 text-primary" />
                  <p className="mt-2 text-sm font-bold">{b.t}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{b.d}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              {precoAntigo != null && precoAntigo > 0 && (
                <p className="text-sm font-bold text-destructive">
                  de <span className="line-through">{formatBRL(precoAntigo)}</span> por:
                </p>
              )}
              <div
                className="mt-2 flex items-center justify-between gap-2 rounded-xl border px-5 py-4"
                style={{
                  borderColor: `color-mix(in oklab, ${cor} 30%, transparent)`,
                  backgroundColor: `color-mix(in oklab, ${cor} 10%, transparent)`,
                }}
              >
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: cor }}>
                   <IconePreco className="h-5 w-5" /> No Pix
                </span>
                <span className="text-3xl font-extrabold" style={{ color: cor }}>{formatBRL(preco)}</span>
              </div>
              {p.parcelamento && <p className="mt-2 text-xs text-muted-foreground">{p.parcelamento}</p>}

              <div className="mt-5 space-y-3">
                {ordemBotoes.map((botao) => {
                  if (botao === "comprar" && p.comprar_ativo && checkoutHref) return <a key="comprar" href={checkoutHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-sm transition hover:opacity-90" style={{ backgroundColor: cor }}><ShoppingCart className="h-4 w-4" /> {p.comprar_texto}</a>;
                  if (botao === "video" && (linkExterno(p.popup_video_url) || linkExterno(p.video_url))) return <a key="video" href="#produto-video" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold text-white shadow-sm transition hover:opacity-90" style={{ backgroundColor: "#dc2626", borderColor: "#dc2626", color: "#ffffff" }}><Play className="h-4 w-4" /> Ver vídeo</a>;
                  if (botao === "site" && p.site_ativo && siteHref) return <a key="site" href={siteHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-sm transition hover:opacity-90" style={{ backgroundColor: siteCor }}><Globe className="h-4 w-4" /> {siteTexto}</a>;
                  if (botao === "whatsapp" && p.whatsapp_compartilhar_ativo) {
                    const url = produtoPublicUrl(p, undefined, organizationSlug);
                    return <a key="whatsapp" href={"https://wa.me/?text=" + encodeURIComponent("Confira " + p.titulo + ": " + url)} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-sm transition hover:opacity-90" style={{ backgroundColor: whatsappCor }}><WhatsAppIcon className="h-4 w-4" /> {whatsappTexto}</a>;
                  }
                  return null;
                })}
                {whatsHref && <a href={whatsHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold transition hover:bg-muted"><MessageCircle className="h-4 w-4" /> Falar no WhatsApp</a>}
                {p.demo_ativo && demoHref && <a href={demoHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#dc2626] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90" style={{ backgroundColor: "#dc2626", borderColor: "#dc2626", color: "#ffffff" }}><Globe className="h-4 w-4" /> {p.demo_texto}</a>}
              </div>

              <ul className="mt-5 space-y-2 text-xs">
                {(beneficios.data ?? productBenefitsPadrao).itens.map((i, indice) => (
                  <li key={`${i}-${indice}`} className="flex items-center gap-2" style={{ color: (beneficios.data ?? productBenefitsPadrao).texto_cor }}>
                    <Check className="h-3.5 w-3.5 shrink-0" style={{ color: (beneficios.data ?? productBenefitsPadrao).icone_cor }} /> {i}
                  </li>
                ))}
              </ul>
            </div>

            <FormularioInteresse produto={p} organizationId={organizationId} />
          </aside>
        </div>
      </div>
    </div>
  );
}
