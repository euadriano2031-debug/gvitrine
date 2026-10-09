import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { bannerPadrao, fetchConfig, salvarConfig, uploadImagem, type BannerConfig } from "@/lib/loja";
import { VideoBanner } from "@/components/loja/VideoBanner";

export const Route = createFileRoute("/_authenticated/admin/banner")({
  head: () => ({ meta: [
    { title: "Banner de vídeo — AP SISTEMAS" },
    { name: "description", content: "Configure o banner de vídeo exibido na vitrine." },
    { property: "og:title", content: "Banner de vídeo — AP SISTEMAS" },
    { property: "og:description", content: "Configure o banner de vídeo exibido na vitrine." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: BannerAdmin,
});

const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function BannerAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery<BannerConfig>({ queryKey: ["cfg", "banner"], queryFn: () => fetchConfig("banner", bannerPadrao) });
  const [cfg, setCfg] = useState<BannerConfig>(bannerPadrao);
  const [status, setStatus] = useState<string | null>(null);
  const [enviandoSelo, setEnviandoSelo] = useState(false);

  useEffect(() => {
    if (data) setCfg(data);
  }, [data]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      await salvarConfig("banner", cfg);
      void qc.invalidateQueries({ queryKey: ["cfg", "banner"] });
      setStatus("Banner salvo com sucesso!");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const enviar = async (
    file: File,
    campo: "capa_url" | "mp4_url" | "selo_imagem_url" | "selo_icone_imagem_url",
  ) => {
    if (campo === "selo_imagem_url" || campo === "selo_icone_imagem_url") setEnviandoSelo(true);
    setStatus(null);
    try {
      const pasta =
        campo === "selo_imagem_url"
          ? "banner/selos"
          : campo === "selo_icone_imagem_url"
            ? "banner/icones"
            : "banner";
      const url = await uploadImagem(file, pasta);
      setCfg((c) => ({ ...c, [campo]: url }));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Não foi possível enviar o arquivo.");
    } finally {
      if (campo === "selo_imagem_url" || campo === "selo_icone_imagem_url") setEnviandoSelo(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h1 className="text-2xl font-bold">Banner de Vídeo Principal</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure o vídeo de apresentação exibido no topo da loja.</p>

        <form onSubmit={salvar} className="mt-6 space-y-4">
          <Campo label="Banner ativo">
            <select value={cfg.ativo ? "1" : "0"} onChange={(e) => setCfg({ ...cfg, ativo: e.target.value === "1" })} className={inputCls}>
              <option value="1">Ativado</option><option value="0">Desativado</option>
            </select>
          </Campo>

          <Campo label="Tipo de vídeo">
            <select value={cfg.tipo} onChange={(e) => setCfg({ ...cfg, tipo: e.target.value as BannerConfig["tipo"] })} className={inputCls}>
              <option value="youtube">Link do YouTube</option>
              <option value="mp4">Upload de vídeo MP4</option>
              <option value="iframe">Vídeo incorporado (iframe)</option>
            </select>
          </Campo>

          {cfg.tipo === "mp4" ? (
            <>
              <Campo label="URL do MP4"><input value={cfg.mp4_url} onChange={(e) => setCfg({ ...cfg, mp4_url: e.target.value })} className={inputCls} /></Campo>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                <Upload className="h-4 w-4" /> Enviar vídeo MP4
                <input type="file" accept="video/mp4" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void enviar(f, "mp4_url"); }} />
              </label>
            </>
          ) : (
            <Campo label={cfg.tipo === "youtube" ? "Link do YouTube" : "URL do iframe"}>
              <input value={cfg.video_url} onChange={(e) => setCfg({ ...cfg, video_url: e.target.value })} className={inputCls} />
            </Campo>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Reprodução automática">
              <select value={cfg.autoplay ? "1" : "0"} onChange={(e) => setCfg({ ...cfg, autoplay: e.target.value === "1" })} className={inputCls}>
                <option value="0">Não</option><option value="1">Sim</option>
              </select>
            </Campo>
            <Campo label="Mostrar controles e botão Play/Pause">
              <select value={cfg.controles ? "1" : "0"} onChange={(e) => setCfg({ ...cfg, controles: e.target.value === "1" })} className={inputCls}>
                <option value="1">Sim</option><option value="0">Não</option>
              </select>
            </Campo>
          </div>

          <Campo label="Imagem de capa (URL)"><input value={cfg.capa_url} onChange={(e) => setCfg({ ...cfg, capa_url: e.target.value })} className={inputCls} /></Campo>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
            <Upload className="h-4 w-4" /> Enviar imagem de capa
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void enviar(f, "capa_url"); }} />
          </label>

          <fieldset className="space-y-4 rounded-lg border border-border p-4">
            <legend className="px-2 text-sm font-semibold">Selo acima do título</legend>
            <Campo label="Exibir como">
              <select value={cfg.selo_tipo} onChange={(e) => setCfg({ ...cfg, selo_tipo: e.target.value as BannerConfig["selo_tipo"] })} className={inputCls}>
                <option value="texto">Texto</option>
                <option value="imagem">Imagem</option>
              </select>
            </Campo>

            {cfg.selo_tipo === "texto" ? (
              <>
                <Campo label="Texto do selo"><input value={cfg.subtitulo} onChange={(e) => setCfg({ ...cfg, subtitulo: e.target.value })} className={inputCls} /></Campo>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Campo label="Tamanho da fonte">
                    <input type="number" min="10" max="48" value={cfg.selo_tamanho_fonte} onChange={(e) => setCfg({ ...cfg, selo_tamanho_fonte: Number(e.target.value) })} className={inputCls} />
                  </Campo>
                  <Campo label="Cor do texto">
                    <input type="color" value={cfg.selo_cor_texto} onChange={(e) => setCfg({ ...cfg, selo_cor_texto: e.target.value })} className={inputCls + " h-10 p-1"} />
                  </Campo>
                  <Campo label="Cor de fundo">
                    <input type="color" value={cfg.selo_cor_fundo} onChange={(e) => setCfg({ ...cfg, selo_cor_fundo: e.target.value })} className={inputCls + " h-10 p-1"} />
                  </Campo>
                </div>
              </>
            ) : (
              <>
                <Campo label="Imagem do selo (URL)">
                  <input value={cfg.selo_imagem_url} onChange={(e) => setCfg({ ...cfg, selo_imagem_url: e.target.value })} className={inputCls} placeholder="https://..." />
                </Campo>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                  <Upload className="h-4 w-4" /> {enviandoSelo ? "Enviando..." : "Enviar imagem do selo"}
                  <input type="file" accept="image/*" disabled={enviandoSelo} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void enviar(f, "selo_imagem_url"); }} />
                </label>
                {cfg.selo_imagem_url && <img src={cfg.selo_imagem_url} alt="Prévia do selo" className="max-h-24 max-w-full object-contain" />}
              </>
            )}
          </fieldset>

          <fieldset className="space-y-4 rounded-lg border border-border p-4">
            <legend className="px-2 text-sm font-semibold">Ícone do selo de lançamento</legend>
            <p className="text-xs text-muted-foreground">
              O ícone escolhido aparece dos dois lados do texto do selo, exatamente como no banner da loja.
            </p>

            <Campo label="Tipo de ícone">
              <select
                value={cfg.selo_icone_modo}
                onChange={(e) =>
                  setCfg({
                    ...cfg,
                    selo_icone_modo: e.target.value as BannerConfig["selo_icone_modo"],
                  })
                }
                className={inputCls}
              >
                <option value="icone">Ícone padrão do site</option>
                <option value="imagem">Imagem personalizada</option>
              </select>
            </Campo>

            {cfg.selo_icone_modo === "icone" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Cor do ícone">
                  <input
                    type="color"
                    value={cfg.selo_icone_cor || "#16a34a"}
                    onChange={(e) => setCfg({ ...cfg, selo_icone_cor: e.target.value })}
                    className={inputCls + " h-10 p-1"}
                  />
                </Campo>
                <Campo label="Tamanho do ícone (px)">
                  <input
                    type="number"
                    min="10"
                    max="64"
                    value={cfg.selo_icone_tamanho || 18}
                    onChange={(e) => setCfg({ ...cfg, selo_icone_tamanho: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Campo>
              </div>
            ) : (
              <>
                <Campo label="URL da imagem do ícone">
                  <input
                    value={cfg.selo_icone_imagem_url}
                    onChange={(e) => setCfg({ ...cfg, selo_icone_imagem_url: e.target.value })}
                    className={inputCls}
                    placeholder="https://..."
                  />
                </Campo>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                  <Upload className="h-4 w-4" /> Enviar imagem do ícone
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void enviar(f, "selo_icone_imagem_url");
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                <Campo label="Tamanho do ícone (px)">
                  <input
                    type="number"
                    min="10"
                    max="96"
                    value={cfg.selo_icone_tamanho || 18}
                    onChange={(e) => setCfg({ ...cfg, selo_icone_tamanho: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Campo>
                {cfg.selo_icone_imagem_url && (
                  <img
                    src={cfg.selo_icone_imagem_url}
                    alt="Prévia do ícone personalizado"
                    className="max-h-20 max-w-40 object-contain"
                  />
                )}
                <p className="text-[11px] text-muted-foreground">
                  Aceita PNG, JPG/JPEG, GIF, WebP e outros formatos de imagem compatíveis com o navegador.
                </p>
              </>
            )}
          </fieldset>

          <Campo label="Título principal"><input value={cfg.titulo} onChange={(e) => setCfg({ ...cfg, titulo: e.target.value })} className={inputCls} /></Campo>
          <Campo label="Descrição"><textarea rows={3} value={cfg.descricao} onChange={(e) => setCfg({ ...cfg, descricao: e.target.value })} className={inputCls} /></Campo>

          <div className="grid gap-4 sm:grid-cols-3">
            <Campo label="Cor de fundo"><input type="color" value={cfg.cor_fundo || "#0b1220"} onChange={(e) => setCfg({ ...cfg, cor_fundo: e.target.value })} className={inputCls + " h-10 p-1"} /></Campo>
            <Campo label="Cor dos textos"><input type="color" value={cfg.cor_texto || "#ffffff"} onChange={(e) => setCfg({ ...cfg, cor_texto: e.target.value })} className={inputCls + " h-10 p-1"} /></Campo>
            <Campo label="Posição dos elementos">
              <select value={cfg.posicao} onChange={(e) => setCfg({ ...cfg, posicao: e.target.value as BannerConfig["posicao"] })} className={inputCls}>
                <option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option>
              </select>
            </Campo>
          </div>

          {status && <p className="rounded-md bg-primary/10 p-2 text-xs text-primary">{status}</p>}
          <button className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Salvar banner</button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Pré-visualização</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <VideoBanner cfg={cfg} />
        </div>
      </div>
    </div>
  );
}
