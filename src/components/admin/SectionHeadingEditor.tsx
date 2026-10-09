import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Save, Tag, Star, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveOrganizationId } from "@/lib/saas";
import {
  iconosTitulosSecoesPadrao,
  fetchConfig,
  normalizarTitulosSecoes,
  salvarConfig,
  uploadImagem,
  type IconeTituloSecaoConfig,
  type TitulosSecoesConfig,
} from "@/lib/loja";

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

type Props = {
  onClose: () => void;
};

function EditorSecao({
  nome,
  cfg,
  onChange,
  onUpload,
  enviando,
  iconeAtual,
}: {
  nome: string;
  cfg: IconeTituloSecaoConfig;
  onChange: (next: IconeTituloSecaoConfig) => void;
  onUpload: (file: File) => void;
  enviando: boolean;
}) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-border p-4">
      <legend className="px-2 text-sm font-semibold">{nome}</legend>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Tipo do ícone</span>
        <select
          value={cfg.modo}
          onChange={(e) => onChange({ ...cfg, modo: e.target.value as IconeTituloSecaoConfig["modo"] })}
          className={inputCls}
        >
          <option value="icone">Ícone atual do site</option>
          <option value="imagem">Imagem personalizada</option>
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Texto do título</span>
          <input
            value={cfg.texto}
            onChange={(e) => onChange({ ...cfg, texto: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Tamanho do texto (px)</span>
          <input
            type="number"
            min="12"
            max="56"
            value={cfg.texto_tamanho}
            onChange={(e) => onChange({ ...cfg, texto_tamanho: Number(e.target.value) })}
            className={inputCls}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Cor do texto</span>
          <input
            type="color"
            value={cfg.texto_cor || "#111827"}
            onChange={(e) => onChange({ ...cfg, texto_cor: e.target.value })}
            className={inputCls + " h-10 p-1"}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Tamanho do ícone (px)</span>
          <input
            type="number"
            min="12"
            max="64"
            value={cfg.icone_tamanho}
            onChange={(e) => onChange({ ...cfg, icone_tamanho: Number(e.target.value) })}
            className={inputCls}
          />
        </label>
      </div>

      {cfg.modo === "icone" ? (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Cor do ícone</span>
          <input
            type="color"
            value={cfg.icone_cor || "#f97316"}
            onChange={(e) => onChange({ ...cfg, icone_cor: e.target.value })}
            className={inputCls + " h-10 p-1"}
          />
        </label>
      ) : (
        <>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">URL da imagem do ícone</span>
            <input
              value={cfg.icone_imagem_url}
              onChange={(e) => onChange({ ...cfg, icone_imagem_url: e.target.value })}
              className={inputCls}
              placeholder="https://..."
            />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
            <Upload className="h-4 w-4" />
            {enviando ? "Enviando..." : "Enviar imagem do ícone"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={enviando}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.currentTarget.value = "";
              }}
            />
          </label>
          <p className="text-[11px] text-muted-foreground">
            PNG, JPG/JPEG, GIF, WebP e outros formatos de imagem compatíveis com o navegador.
          </p>
        </>
      )}

      <div className="rounded-lg border border-border bg-background p-4">
        <p className="mb-3 text-xs font-semibold text-muted-foreground">Pré-visualização</p>
        <div className="flex items-center gap-3">
          {cfg.modo === "imagem" && cfg.icone_imagem_url ? (
            <img
              src={cfg.icone_imagem_url}
              alt=""
              aria-hidden="true"
              className="shrink-0 object-contain"
              style={{ width: cfg.icone_tamanho, height: cfg.icone_tamanho }}
            />
          ) : nome === "Vitrine Completa" ? (
            <Tag
              aria-hidden="true"
              className="shrink-0"
              style={{ color: cfg.icone_cor || "#f97316", width: cfg.icone_tamanho, height: cfg.icone_tamanho }}
            />
          ) : (
            <Star
              aria-hidden="true"
              className="shrink-0"
              style={{ color: cfg.icone_cor || "#f97316", width: cfg.icone_tamanho, height: cfg.icone_tamanho }}
            />
          )}
          <span
            className="font-bold tracking-tight"
            style={{ color: cfg.texto_cor || undefined, fontSize: cfg.texto_tamanho }}
          >
            {cfg.texto || nome}
          </span>
        </div>
      </div>
    </fieldset>
  );
}

export function SectionHeadingEditor({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState<string | null>(() => getActiveOrganizationId());
  const [cfg, setCfg] = useState<TitulosSecoesConfig>(normalizarTitulosSecoes(iconosTitulosSecoesPadrao));
  const [status, setStatus] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [uploading, setUploading] = useState<"destaque" | "vitrine" | null>(null);

  useEffect(() => {
    const atualizarOrganizacao = () => setOrganizationId(getActiveOrganizationId());
    window.addEventListener("saas-organization-changed", atualizarOrganizacao);
    return () => window.removeEventListener("saas-organization-changed", atualizarOrganizacao);
  }, []);

  useEffect(() => {
    let active = true;
    setStatus(null);
    void fetchConfig("titulos_secoes", iconosTitulosSecoesPadrao, organizationId)
      .then((value) => {
        if (active) setCfg(normalizarTitulosSecoes(value));
      })
      .catch((error) => {
        if (active) setStatus(error instanceof Error ? error.message : "Não foi possível carregar a configuração.");
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  const enviarImagem = async (secao: "destaque" | "vitrine", file: File) => {
    const extensao = file.name.split(".").pop()?.toLowerCase() || "";
    const tiposImagemAceitos = new Set([
      "png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif", "ico",
    ]);
    if (!file.type.startsWith("image/") && !tiposImagemAceitos.has(extensao)) {
      setStatus("Envie PNG, JPG/JPEG, GIF, WebP, SVG, BMP, AVIF ou outro formato de imagem compatível.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus("A imagem deve ter no máximo 10 MB.");
      return;
    }

    setUploading(secao);
    setStatus(null);
    try {
      const url = await uploadImagem(file, "icones-secoes");
      setCfg((atual) => ({
        ...atual,
        [secao]: {
          ...atual[secao],
          modo: "imagem",
          icone_imagem_url: url,
        },
      }));
      setStatus("Imagem carregada com sucesso.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível carregar a imagem.");
    } finally {
      setUploading(null);
    }
  };

  const salvar = async () => {
    setSalvando(true);
    setStatus(null);
    try {
      // As duas seções são gravadas juntas no mesmo registro:
      // "Produtos em Destaque" e "Vitrine Completa".
      const normalizado = normalizarTitulosSecoes(cfg);
      await salvarConfig("titulos_secoes", normalizado, organizationId);
      await queryClient.invalidateQueries({ queryKey: ["cfg", "titulos_secoes", organizationId ?? "legacy"] });

      // Confirma a persistência no Supabase antes de informar sucesso ao administrador.
      const salvo = normalizarTitulosSecoes(
        await fetchConfig("titulos_secoes", iconosTitulosSecoesPadrao, organizationId),
      );
      const persistiuDestaque = JSON.stringify(salvo.destaque) === JSON.stringify(normalizado.destaque);
      const persistiuVitrine = JSON.stringify(salvo.vitrine) === JSON.stringify(normalizado.vitrine);

      if (!persistiuDestaque || !persistiuVitrine) {
        throw new Error("As duas personalizações não foram confirmadas no banco. Tente salvar novamente.");
      }

      setCfg(salvo);
      setStatus("As duas personalizações foram salvas e confirmadas no Supabase: Produtos em Destaque e Vitrine Completa.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível salvar as duas personalizações.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-foreground/60 p-4">
      <div className="mx-auto my-6 w-full max-w-5xl rounded-2xl border border-border bg-card p-5 shadow-xl md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Personalizar títulos e ícones das seções</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Personalize separadamente “Produtos em Destaque” e “Vitrine Completa” sem alterar os produtos.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <EditorSecao
            nome="Produtos em Destaque"
            cfg={cfg.destaque}
            onChange={(next) => setCfg((atual) => ({ ...atual, destaque: next }))}
            onUpload={(file) => void enviarImagem("destaque", file)}
            enviando={uploading === "destaque"}
          />
          <EditorSecao
            nome="Vitrine Completa"
            cfg={cfg.vitrine}
            onChange={(next) => setCfg((atual) => ({ ...atual, vitrine: next }))}
            onUpload={(file) => void enviarImagem("vitrine", file)}
            enviando={uploading === "vitrine"}
          />
        </div>

        {status && <p className="mt-5 rounded-md bg-primary/10 p-3 text-sm text-primary">{status}</p>}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCfg(normalizarTitulosSecoes(iconosTitulosSecoesPadrao));
              setStatus("Padrão carregado. Clique em “Salvar personalização” para aplicar.");
            }}
          >
            <RotateCcw /> Restaurar padrão
          </Button>
          <Button type="button" onClick={() => void salvar()} disabled={salvando}>
            <Save /> {salvando ? "Salvando as duas..." : "Salvar as duas personalizações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
