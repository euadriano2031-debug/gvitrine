import { Flame } from "lucide-react";
import { comParams, youtubeEmbed, type BannerConfig } from "@/lib/loja";

export function VideoBanner({ cfg }: { cfg: BannerConfig }) {
  if (!cfg.ativo) return null;

  const align =
    cfg.posicao === "left"
      ? "text-left items-start"
      : cfg.posicao === "right"
        ? "text-right items-end"
        : "text-center items-center";

  /*
   * Para links do YouTube, usamos o player oficial em iframe, sem camada
   * de controles própria. Isso preserva a experiência e os recursos que o
   * próprio YouTube disponibiliza no player incorporado: play/pause,
   * progresso, volume, configurações, qualidade, velocidade, PiP,
   * compartilhamento e tela cheia (conforme disponibilidade do vídeo/navegador).
   *
   * O player de YouTube mantém os controles oficiais sempre ativos no banner de apresentação,
   * para que todas as lojas recebam a mesma experiência base. O conteúdo e recursos efetivos
   * continuam sujeitos ao vídeo, à conta do usuário e às regras do próprio YouTube.
   *
   * Não adicionamos <track> nem forçamos legendas. cc_load_policy=0 mantém
   * as legendas desligadas por padrão, sem inserir uma legenda na vitrine.
   * O parâmetro modestbranding foi removido porque hoje é obsoleto e não tem efeito.
   */
  const youtubeParams = {
    autoplay: cfg.autoplay ? 1 : 0,
    controls: 1,
    rel: 0,
    fs: 1,
    playsinline: 1,
    disablekb: 0,
    hl: "pt-BR",
    iv_load_policy: 3,
    cc_load_policy: 0,
    enablejsapi: 1,
    ...(typeof window !== "undefined" ? { origin: window.location.origin } : {}),
  };
  const embedSrc = comParams(youtubeEmbed(cfg.video_url), youtubeParams);

  return (
    <section
      className="relative overflow-hidden border-b border-border"
      style={{
        background: cfg.cor_fundo || "var(--gradient-hero)",
        color: cfg.cor_texto || undefined,
      }}
    >
      <div className={`mx-auto flex max-w-5xl flex-col gap-6 px-6 py-14 ${align}`}>
        {cfg.selo_tipo === "imagem"
          ? cfg.selo_imagem_url && (
              <img
                src={cfg.selo_imagem_url}
                alt={cfg.subtitulo || "Destaque"}
                className="h-auto max-h-24 max-w-[min(100%,22rem)] object-contain"
              />
            )
          : cfg.subtitulo ? (
              <div
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary/50 px-6 py-2 font-black uppercase tracking-widest"
                style={{
                  fontSize: `${cfg.selo_tamanho_fonte || 14}px`,
                  color: cfg.selo_cor_texto || undefined,
                  backgroundColor: cfg.selo_cor_fundo || undefined,
                }}
              >
                {cfg.selo_icone_modo === "imagem" && cfg.selo_icone_imagem_url ? (
                  <img
                    src={cfg.selo_icone_imagem_url}
                    alt=""
                    aria-hidden="true"
                    className="shrink-0 object-contain"
                    style={{
                      width: `${cfg.selo_icone_tamanho || 18}px`,
                      height: `${cfg.selo_icone_tamanho || 18}px`,
                    }}
                  />
                ) : (
                  <Flame
                    className="shrink-0 fill-current"
                    style={{
                      width: `${cfg.selo_icone_tamanho || 18}px`,
                      height: `${cfg.selo_icone_tamanho || 18}px`,
                      color: cfg.selo_icone_cor || cfg.selo_cor_texto || undefined,
                    }}
                    aria-hidden="true"
                  />
                )}

                <span>{cfg.subtitulo}</span>

                {cfg.selo_icone_modo === "imagem" && cfg.selo_icone_imagem_url ? (
                  <img
                    src={cfg.selo_icone_imagem_url}
                    alt=""
                    aria-hidden="true"
                    className="shrink-0 object-contain"
                    style={{
                      width: `${cfg.selo_icone_tamanho || 18}px`,
                      height: `${cfg.selo_icone_tamanho || 18}px`,
                    }}
                  />
                ) : (
                  <Flame
                    className="shrink-0 fill-current"
                    style={{
                      width: `${cfg.selo_icone_tamanho || 18}px`,
                      height: `${cfg.selo_icone_tamanho || 18}px`,
                      color: cfg.selo_icone_cor || cfg.selo_cor_texto || undefined,
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
            ) : null}

        {cfg.titulo && (
          <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            {cfg.titulo}
          </h1>
        )}

        {cfg.descricao && (
          <p className="max-w-2xl text-base opacity-80 md:text-lg">
            {cfg.descricao}
          </p>
        )}

        <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-black shadow-[var(--shadow-card)]">
          <div className="aspect-video w-full">
            {cfg.tipo === "mp4" ? (
              <video
                src={cfg.mp4_url}
                poster={cfg.capa_url || undefined}
                controls={cfg.controles}
                autoPlay={cfg.autoplay}
                muted={cfg.autoplay}
                playsInline
                className="h-full w-full bg-black object-contain"
              />
            ) : (
              <iframe
                src={embedSrc}
                title={cfg.titulo || "Vídeo da loja"}
                className="h-full w-full border-0 bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
