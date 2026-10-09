import { useEffect, useState } from "react";
import { RotateCcw, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  botaoVerMaisPadrao,
  fetchConfig,
  salvarConfig,
  uploadImagem,
  type BotaoVerMaisConfig,
} from "@/lib/loja";

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function LoadMoreButtonEditor({ onClose }: { onClose: () => void }) {
  const [cfg, setCfg] = useState<BotaoVerMaisConfig>(botaoVerMaisPadrao);
  const [status, setStatus] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);

  useEffect(() => {
    let ativo = true;
    void fetchConfig("botao_ver_mais", botaoVerMaisPadrao)
      .then((valor) => {
        if (ativo) setCfg(valor);
      })
      .catch((erro) => {
        if (ativo) setStatus(erro instanceof Error ? erro.message : "Não foi possível carregar a configuração.");
      });
    return () => {
      ativo = false;
    };
  }, []);

  const salvar = async () => {
    setSalvando(true);
    setStatus(null);
    try {
      const proximo = {
        ...botaoVerMaisPadrao,
        ...cfg,
        texto: cfg.texto.trim() || botaoVerMaisPadrao.texto,
        imagem_alt: cfg.imagem_alt.trim() || botaoVerMaisPadrao.imagem_alt,
      };
      await salvarConfig("botao_ver_mais", proximo);
      setCfg(proximo);
      setStatus("Personalização do botão Ver mais salva com sucesso.");
    } catch (erro) {
      setStatus(erro instanceof Error ? erro.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const enviarImagem = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setStatus("Envie uma imagem PNG, JPG/JPEG, GIF, WebP ou outro formato de imagem aceito pelo navegador.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus("A imagem deve ter no máximo 10 MB.");
      return;
    }

    setEnviandoImagem(true);
    setStatus(null);
    try {
      const url = await uploadImagem(file, "botao-ver-mais");
      setCfg((atual) => ({
        ...atual,
        modo: "imagem",
        imagem_url: url,
        imagem_alt: atual.imagem_alt || atual.texto || botaoVerMaisPadrao.imagem_alt,
      }));
      setStatus("Imagem carregada com sucesso.");
    } catch (erro) {
      setStatus(erro instanceof Error ? erro.message : "Não foi possível carregar a imagem.");
    } finally {
      setEnviandoImagem(false);
    }
  };

  const tamanho = cfg.tamanho === "pequeno"
    ? { fontSize: 12, padding: "6px 14px", width: 128, height: 34 }
    : cfg.tamanho === "grande"
      ? { fontSize: 16, padding: "11px 24px", width: 176, height: 46 }
      : { fontSize: 14, padding: "9px 20px", width: 152, height: 40 };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-foreground/60 p-4">
      <div className="mx-auto my-6 w-full max-w-4xl rounded-2xl border border-border bg-card p-5 shadow-xl md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Personalizar botão “Ver mais”</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta configuração será usada no botão que aparece abaixo dos produtos da loja.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
        </div>

        <div className="mt-6 grid gap-7 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <fieldset className="rounded-lg border border-border p-4">
              <legend className="px-2 text-sm font-semibold">Visual do botão</legend>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Opção</span>
                <select
                  value={cfg.modo}
                  onChange={(e) => setCfg((atual) => ({ ...atual, modo: e.target.value as BotaoVerMaisConfig["modo"] }))}
                  className={inputCls}
                >
                  <option value="botao">Botão padrão (já presente no site)</option>
                  <option value="imagem">Imagem</option>
                </select>
              </label>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Texto do botão</span>
                  <input
                    value={cfg.texto}
                    onChange={(e) => setCfg((atual) => ({ ...atual, texto: e.target.value }))}
                    className={inputCls}
                    placeholder="Ver mais"
                    disabled={cfg.modo === "imagem"}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Tamanho</span>
                  <select
                    value={cfg.tamanho}
                    onChange={(e) => setCfg((atual) => ({ ...atual, tamanho: e.target.value as BotaoVerMaisConfig["tamanho"] }))}
                    className={inputCls}
                  >
                    <option value="pequeno">Pequeno</option>
                    <option value="medio">Médio</option>
                    <option value="grande">Grande</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Cor do texto</span>
                  <input
                    type="color"
                    value={cfg.texto_cor || "#ffffff"}
                    onChange={(e) => setCfg((atual) => ({ ...atual, texto_cor: e.target.value }))}
                    className={inputCls + " h-10 p-1"}
                    disabled={cfg.modo === "imagem"}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Cor do botão</span>
                  <input
                    type="color"
                    value={cfg.fundo_cor || "#16a34a"}
                    onChange={(e) => setCfg((atual) => ({ ...atual, fundo_cor: e.target.value }))}
                    className={inputCls + " h-10 p-1"}
                    disabled={cfg.modo === "imagem"}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="rounded-lg border border-border p-4">
              <legend className="px-2 text-sm font-semibold">Imagem</legend>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">URL da imagem</span>
                <input
                  value={cfg.imagem_url}
                  onChange={(e) => setCfg((atual) => ({ ...atual, imagem_url: e.target.value }))}
                  className={inputCls}
                  placeholder="https://..."
                />
              </label>

              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Texto alternativo</span>
                <input
                  value={cfg.imagem_alt}
                  onChange={(e) => setCfg((atual) => ({ ...atual, imagem_alt: e.target.value }))}
                  className={inputCls}
                  placeholder="Ver mais produtos"
                />
              </label>

              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                <Upload className="h-4 w-4" />
                {enviandoImagem ? "Enviando..." : "Enviar imagem"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={enviandoImagem}
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0];
                    if (arquivo) void enviarImagem(arquivo);
                    e.currentTarget.value = "";
                  }}
                />
              </label>

              <p className="mt-3 text-xs text-muted-foreground">
                PNG, JPG/JPEG, GIF, WebP e outros formatos de imagem reconhecidos pelo navegador.
              </p>

              {cfg.imagem_url && (
                <div className="mt-4 overflow-hidden rounded-lg border border-border bg-muted/20 p-3">
                  <img
                    src={cfg.imagem_url}
                    alt={cfg.imagem_alt || "Imagem do botão Ver mais"}
                    className="mx-auto max-h-40 max-w-full object-contain"
                  />
                </div>
              )}
            </fieldset>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-muted-foreground">Pré-visualização</p>
            <div className="flex min-h-64 items-center justify-center rounded-xl border border-border bg-background p-8">
              {cfg.modo === "imagem" && cfg.imagem_url ? (
                <button
                  type="button"
                  className="overflow-hidden rounded-xl border border-border transition hover:opacity-90"
                  style={{ width: tamanho.width, height: tamanho.height }}
                >
                  <img
                    src={cfg.imagem_url}
                    alt={cfg.imagem_alt || "Imagem do botão Ver mais"}
                    className="h-full w-full object-contain"
                  />
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-md font-semibold shadow-sm transition hover:opacity-90"
                  style={{
                    color: cfg.texto_cor || undefined,
                    backgroundColor: cfg.fundo_cor || undefined,
                    fontSize: tamanho.fontSize,
                    padding: tamanho.padding,
                    minWidth: tamanho.width,
                  }}
                >
                  {cfg.texto || "Ver mais"}
                </button>
              )}
            </div>
          </div>
        </div>

        {status && <p className="mt-5 rounded-md bg-primary/10 p-3 text-sm text-primary">{status}</p>}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCfg(botaoVerMaisPadrao);
              setStatus(null);
            }}
          >
            <RotateCcw /> Restaurar padrão
          </Button>
          <Button type="button" onClick={() => void salvar()} disabled={salvando}>
            <Save /> {salvando ? "Salvando..." : "Salvar personalização"}
          </Button>
        </div>
      </div>
    </div>
  );
}
