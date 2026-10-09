import { CreditCard, Globe, MessageCircle, Play, Zap, X, ShoppingCart, ShieldCheck, Clock, Award } from "lucide-react";
import { useRef, useState } from "react";
import { cardTextPadrao, comParams, formatBRL, linkExterno, youtubeEmbed, compartilharProdutoWhatsApp, produtoPublicUrl, produtoSlug, type CardTextConfig, type Produto } from "@/lib/loja";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PixIcon } from "@/components/loja/PixIcon";
import { WhatsAppIcon } from "@/components/loja/WhatsAppIcon";
import cliqueAsset from "@/assets/clique.webp.asset.json";

const btnCls =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition hover:opacity-85";

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

export function ProductCard({
  p,
  textos = cardTextPadrao,
  organizationSlug,
}: {
  p: Produto;
  textos?: CardTextConfig;
  organizationSlug?: string;
}) {
  const preco = Number(p.preco);
  const precoAntigo = p.preco_antigo != null ? Number(p.preco_antigo) : null;
  const cor = p.comprar_cor || "#16a34a";
  const produtoPath = organizationSlug
    ? `/loja/${encodeURIComponent(organizationSlug)}/produto/${encodeURIComponent(produtoSlug(p))}`
    : `/produto/${encodeURIComponent(produtoSlug(p))}`;

  const demoHref = linkExterno(p.demo_url);
  const checkoutHref = linkExterno(p.checkout_url);

  const siteHref = linkExterno(p.site_url);
  const siteTexto = p.site_texto?.trim() || "Ver Site";
  const siteCor = p.site_cor || "#16a34a";
  const whatsappTexto = p.whatsapp_compartilhar_texto?.trim() || "Compartilhar no WhatsApp";
  const whatsappCor = p.whatsapp_compartilhar_cor || "#25D366";
  const ordemBotoes = normalizarOrdemBotoes(p.botoes_ordem);

  const [modalAberto, setModalAberto] = useState(false);
  const [videoNoModal, setVideoNoModal] = useState(false);
  const [compartilhandoWhatsApp, setCompartilhandoWhatsApp] = useState(false);
  const videoSectionRef = useRef<HTMLDivElement>(null);

  const abrirVideoNoModal = () => {
    setVideoNoModal(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        videoSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const videoBruto = linkExterno(p.popup_video_url) || linkExterno(p.video_url) || demoHref;
  const tipoVideo = p.popup_video_tipo || "auto";
  const ehMp4 =
    tipoVideo === "mp4" || (tipoVideo === "auto" && /\.(mp4|webm|ogg)(\?|$)/i.test(videoBruto));
  const embedSrc =
    ehMp4
      ? videoBruto
      : tipoVideo === "iframe"
        ? videoBruto
        : comParams(youtubeEmbed(videoBruto), { autoplay: 1, rel: 0 });
  const temVideo = Boolean(videoBruto);
  const capaPopup = p.popup_imagem_url || p.imagem_url;
  const IconePreco =
    p.pix_icone === "cartao"
      ? CreditCard
      : p.pix_icone === "raio"
        ? Zap
        : p.pix_icone === "carrinho"
          ? ShoppingCart
          : PixIcon;

  const compartilharWhatsApp = async () => {
    if (compartilhandoWhatsApp) return;
    setCompartilhandoWhatsApp(true);
    try {
      await compartilharProdutoWhatsApp(p, {
        url:
          organizationSlug && typeof window !== "undefined"
            ? produtoPublicUrl(p, window.location.origin, organizationSlug ?? null)
            : undefined,
      });
    } finally {
      setCompartilhandoWhatsApp(false);
    }
  };

  const abrirModal = () => setModalAberto(true);
  const fecharModal = (aberto: boolean) => {
    if (!aberto) setVideoNoModal(false);
    setModalAberto(aberto);
  };

  const renderVideo = () => (
    ehMp4 ? (
      <video src={embedSrc} controls autoPlay className="h-full w-full bg-black object-contain" />
    ) : (
      <iframe
        src={embedSrc}
        title={p.titulo}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full border-0 bg-black"
      />
    )
  );

  return (
    <>
      <article data-testid="product-card" className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]">
        <div className="relative aspect-square overflow-hidden rounded-t-xl bg-muted">
          {p.imagem_url ? (
            <img
              src={p.imagem_url}
              alt={p.titulo}
              loading="lazy"
              data-testid="card-image"
              onClick={() => {
                if (temVideo) {
                  setModalAberto(true);
                  setVideoNoModal(true);
                }
              }}
              className={
                "h-full w-full object-cover transition group-hover:scale-105 " + (temVideo ? "cursor-pointer" : "")
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Sem imagem</div>
          )}
          {p.desconto_ativo && p.desconto && (
            <span
              className="absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold tracking-wide text-white"
              style={{ backgroundColor: p.desconto_cor }}
            >
              {p.desconto}
            </span>
          )}
          {p.selo && !p.desconto && (
            <span className="absolute left-3 top-3 rounded-md bg-foreground/85 px-2 py-1 text-[10px] font-bold tracking-wide text-background">
              {p.selo}
            </span>
          )}
          {(temVideo || demoHref) && (
            temVideo ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalAberto(true);
                  setVideoNoModal(true);
                }}
                data-testid="card-video-badge"
                className="animate-soft-pulse absolute right-3 top-3 w-28 transition hover:opacity-90"
                aria-label="Clique aqui para ver o vídeo"
              >
                <img src={cliqueAsset.url} alt="Clique Aqui" className="h-auto w-full object-contain" />
              </button>
            ) : (
              <a
                href={demoHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="animate-soft-pulse absolute right-3 top-3 w-28 transition hover:opacity-90"
                aria-label="Clique aqui para abrir a demonstração"
              >
                <img src={cliqueAsset.url} alt="Clique Aqui" className="h-auto w-full object-contain" />
              </a>
            )
          )}

        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-bold leading-tight line-clamp-2" style={{ color: textos.titulo_cor || undefined, fontSize: `${textos.titulo_tamanho}px` }}>
            <a
              href={produtoPath}
              className="block w-full text-left transition hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={`Abrir página de ${p.titulo}`}
            >
              {p.titulo}
            </a>
          </h3>
          <button
            type="button"
            onClick={abrirModal}
            className="mt-1 flex w-full max-h-[calc(1.625em*3)] overflow-hidden text-left leading-relaxed text-muted-foreground line-clamp-3 transition hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={{ color: textos.descricao_cor || undefined, fontSize: `${textos.descricao_tamanho}px` }}
            aria-label={`Ver descrição completa de ${p.titulo}`}
          >
            {p.descricao}
          </button>

          <div className="mt-4 min-h-[18px] font-semibold text-red-600 dark:text-red-400" style={{ color: textos.preco_antigo_cor || undefined, fontSize: `${textos.preco_antigo_tamanho}px` }}>
            {precoAntigo != null && precoAntigo > 0 && (
              <>
                de <span className="line-through">{formatBRL(precoAntigo)}</span> por:
              </>
            )}
          </div>

          <div
            className="mt-2 flex items-center justify-between gap-2 rounded-2xl border px-5 py-4"
            style={{
              borderColor: `color-mix(in oklab, ${cor} 30%, transparent)`,
              backgroundColor: `color-mix(in oklab, ${cor} 10%, transparent)`,
            }}
          >
            <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wide" style={{ color: textos.pix_cor || cor, fontSize: `${textos.pix_tamanho}px` }}>
              <IconePreco className="h-4 w-4" /> No Pix
            </span>
            <span className="font-extrabold" style={{ color: textos.preco_cor || cor, fontSize: `${textos.preco_tamanho}px` }}>{formatBRL(preco)}</span>
          </div>
          <div className="mt-1.5 min-h-[14px] text-muted-foreground" style={{ color: textos.parcelamento_cor || undefined, fontSize: `${textos.parcelamento_tamanho}px` }}>{p.parcelamento}</div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {p.comprar_ativo && (
              <a
                href={checkoutHref || "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                data-testid="card-comprar"
                className={btnCls + " text-white shadow-sm"}
                style={{ backgroundColor: cor, borderColor: cor }}
              >
                <Zap className="h-4 w-4" /> {p.comprar_texto}
              </a>
            )}
            {p.demo_ativo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  abrirModal();
                }}
                data-testid="card-detalhes"
                className={btnCls + " border-transparent bg-red-600 text-white shadow-sm hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-500"}
              >
                <Globe className="h-4 w-4" /> {p.demo_texto}
              </button>
            )}
          </div>


        </div>
      </article>

      {/* Modal de detalhes do produto */}
      <Dialog open={modalAberto} onOpenChange={fecharModal}>
        <DialogContent hideClose className="max-h-[92vh] max-w-5xl overflow-y-auto p-0">
          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-foreground/70 text-background shadow-md transition hover:bg-foreground focus:outline-none"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogClose>

          <div className="grid gap-0 md:grid-cols-2">
            <div ref={videoSectionRef} className="relative min-h-[240px] w-full scroll-mt-4 overflow-hidden bg-muted">
              {videoNoModal ? (
                <div className="relative aspect-video h-full w-full bg-black">
                  {renderVideo()}
                  <button
                    type="button"
                    onClick={() => setVideoNoModal(false)}
                    className="absolute right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:scale-105 hover:bg-red-700 focus:outline-none"
                    aria-label="Fechar vídeo"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : capaPopup ? (
                <img src={capaPopup} alt={p.titulo} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">Sem imagem</div>
              )}
            </div>

            <div className="space-y-4 p-6">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="text-2xl font-bold leading-tight">{p.titulo}</DialogTitle>
              </DialogHeader>

              {precoAntigo != null && precoAntigo > 0 && (
                <div className="text-sm font-bold text-destructive">
                  de <span className="line-through">{formatBRL(precoAntigo)}</span> por:
                </div>
              )}

              <div
                className="flex items-center justify-between gap-2 rounded-xl border px-5 py-4"
                style={{
                  borderColor: `color-mix(in oklab, ${cor} 30%, transparent)`,
                  backgroundColor: `color-mix(in oklab, ${cor} 10%, transparent)`,
                }}
              >
                <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: cor }}>
                  <IconePreco className="h-5 w-5" /> No Pix
                </span>
                <span className="text-3xl font-extrabold" style={{ color: cor }}>{formatBRL(preco)}</span>
              </div>
              {p.parcelamento && <div className="text-xs text-muted-foreground">{p.parcelamento}</div>}

              <div className="space-y-3">
                {ordemBotoes.map((botao) => {
                  if (botao === "comprar" && p.comprar_ativo) {
                    return (
                      <a
                        key="comprar"
                        href={checkoutHref || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={btnCls + " text-white shadow-sm"}
                        style={{ backgroundColor: cor, borderColor: cor }}
                      >
                        <ShoppingCart className="h-4 w-4" /> {p.comprar_texto}
                      </a>
                    );
                  }

                  if (botao === "video" && temVideo) {
                    return (
                      <button
                        key="video"
                        type="button"
                        onClick={abrirVideoNoModal}
                        className={btnCls + " border-transparent bg-[#d93a1f] text-white shadow-sm"}
                      >
                        <Play className="h-4 w-4" /> Ver vídeo
                      </button>
                    );
                  }

                  if (botao === "site" && p.site_ativo && siteHref) {
                    return (
                      <a
                        key="site"
                        href={siteHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={btnCls + " text-white shadow-sm"}
                        style={{ backgroundColor: siteCor, borderColor: siteCor }}
                        aria-label={siteTexto + " — " + p.titulo}
                      >
                        <Globe className="h-4 w-4" /> {siteTexto}
                      </a>
                    );
                  }

                  if (botao === "whatsapp" && p.whatsapp_compartilhar_ativo) {
                    return (
                      <button
                        key="whatsapp"
                        type="button"
                        onClick={() => void compartilharWhatsApp()}
                        disabled={compartilhandoWhatsApp}
                        className={btnCls + " text-white shadow-sm disabled:cursor-wait disabled:opacity-70"}
                        style={{ backgroundColor: whatsappCor, borderColor: whatsappCor }}
                        aria-label={whatsappTexto + " — " + p.titulo}
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                        {compartilhandoWhatsApp ? "Preparando..." : whatsappTexto}
                      </button>
                    );
                  }

                  return null;
                })}
              </div>

              <ul className="space-y-4 rounded-xl border border-border p-4">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: cor }} />
                  <div>
                    <p className="text-sm font-bold">Compra Segura</p>
                    <p className="text-xs text-muted-foreground">Protegida por criptografia SSL</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0" style={{ color: cor }} />
                  <div>
                    <p className="text-sm font-bold">Entrega automática</p>
                    <p className="text-xs text-muted-foreground">Receba imediatamente após pagamento</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Award className="mt-0.5 h-5 w-5 shrink-0" style={{ color: cor }} />
                  <div>
                    <p className="text-sm font-bold">Produto de qualidade</p>
                    <p className="text-xs text-muted-foreground">Garantia de produto digital original</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-8 border-t border-border p-6 md:p-8">
            <section className="space-y-3">
              <h4 className="text-base font-bold">Descrição do produto</h4>
              <DialogDescription className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                {p.descricao?.trim() || "Descrição em breve."}
              </DialogDescription>
            </section>


            {demoHref && (
              <a
                href={demoHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Globe className="h-4 w-4" /> Acessar demonstração externa
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
