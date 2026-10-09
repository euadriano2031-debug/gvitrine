import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PixIcon } from "@/components/loja/PixIcon";
import {
  cardTextPadrao,
  fetchConfig,
  salvarConfig,
  type CardTextConfig,
} from "@/lib/loja";

const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

const campos: Array<{
  nome: string;
  cor: keyof CardTextConfig;
  tamanho: keyof CardTextConfig;
  minimo: number;
  maximo: number;
}> = [
  { nome: "Nome do produto", cor: "titulo_cor", tamanho: "titulo_tamanho", minimo: 10, maximo: 36 },
  { nome: "Descrição", cor: "descricao_cor", tamanho: "descricao_tamanho", minimo: 9, maximo: 28 },
  { nome: "Preço antigo", cor: "preco_antigo_cor", tamanho: "preco_antigo_tamanho", minimo: 9, maximo: 28 },
  { nome: "Texto No Pix", cor: "pix_cor", tamanho: "pix_tamanho", minimo: 9, maximo: 28 },
  { nome: "Preço principal", cor: "preco_cor", tamanho: "preco_tamanho", minimo: 14, maximo: 48 },
  { nome: "Parcelamento", cor: "parcelamento_cor", tamanho: "parcelamento_tamanho", minimo: 9, maximo: 28 },
];

const coresPadrao: Record<string, string> = {
  titulo_cor: "#1f2937",
  descricao_cor: "#6b7280",
  preco_antigo_cor: "#dc2626",
  pix_cor: "#16a34a",
  preco_cor: "#16a34a",
  parcelamento_cor: "#6b7280",
};

function estilo(cor: string, tamanho: number) {
  return { color: cor || undefined, fontSize: `${tamanho}px` };
}

export function CardTextAppearanceEditor({ onClose, produtoNome }: { onClose: () => void; produtoNome?: string }) {
  const qc = useQueryClient();
  const { data } = useQuery<CardTextConfig>({
    queryKey: ["cfg", "card_textos"],
    queryFn: () => fetchConfig("card_textos", cardTextPadrao),
  });
  const [cfg, setCfg] = useState<CardTextConfig>(cardTextPadrao);
  const [status, setStatus] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (data) setCfg(data);
  }, [data]);

  const salvar = async () => {
    setSalvando(true);
    setStatus(null);
    try {
      await salvarConfig("card_textos", cfg);
      await qc.invalidateQueries({ queryKey: ["cfg", "card_textos"] });
      setStatus("Aparência salva com sucesso!");
    } catch (erro) {
      setStatus(erro instanceof Error ? erro.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/60 p-4">
      <div className="mx-auto my-6 w-full max-w-5xl rounded-lg border border-border bg-card p-5 shadow-xl md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{produtoNome ? `Personalizar textos — ${produtoNome}` : "Aparência dos textos do card"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">As escolhas serão aplicadas a todos os produtos da loja.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Fechar</Button>
        </div>

        <div className="mt-6 grid gap-7 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4 sm:grid-cols-2">
            {campos.map((campo) => {
              const cor = String(cfg[campo.cor] ?? "");
              const tamanho = Number(cfg[campo.tamanho]);
              return (
                <fieldset key={campo.nome} className="rounded-md border border-border p-3">
                  <legend className="px-1 text-sm font-semibold">{campo.nome}</legend>
                  <div className="grid grid-cols-[1fr_110px] gap-3">
                    <label>
                      <span className="mb-1 block text-xs text-muted-foreground">Cor</span>
                      <input
                        type="color"
                        value={cor || coresPadrao[String(campo.cor)]}
                        onChange={(e) => setCfg((atual) => ({ ...atual, [campo.cor]: e.target.value }))}
                        className={inputCls + " h-10 p-1"}
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs text-muted-foreground">Tamanho (px)</span>
                      <input
                        type="number"
                        min={campo.minimo}
                        max={campo.maximo}
                        value={tamanho}
                        onChange={(e) => setCfg((atual) => ({ ...atual, [campo.tamanho]: Number(e.target.value) }))}
                        className={inputCls}
                      />
                    </label>
                  </div>
                </fieldset>
              );
            })}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-muted-foreground">Pré-visualização</p>
            <article className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="aspect-video bg-muted" />
              <div className="p-4">
                <h3 className="font-bold leading-tight" style={estilo(cfg.titulo_cor, cfg.titulo_tamanho)}>Agenda GRUPOS</h3>
                <p className="mt-1 leading-relaxed text-muted-foreground" style={estilo(cfg.descricao_cor, cfg.descricao_tamanho)}>
                  Disparos automáticos e seguros em grupos do WhatsApp.
                </p>
                <div className="mt-4 font-semibold text-destructive" style={estilo(cfg.preco_antigo_cor, cfg.preco_antigo_tamanho)}>
                  de <span className="line-through">R$ 397,00</span> por:
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
                  <span className="inline-flex items-center gap-1 font-bold uppercase" style={estilo(cfg.pix_cor, cfg.pix_tamanho)}>
                    <PixIcon className="h-4 w-4" /> No Pix
                  </span>
                  <span className="font-extrabold" style={estilo(cfg.preco_cor, cfg.preco_tamanho)}>R$ 197,00</span>
                </div>
                <div className="mt-1.5 text-muted-foreground" style={estilo(cfg.parcelamento_cor, cfg.parcelamento_tamanho)}>12x de R$ 19,70</div>
              </div>
            </article>
          </div>
        </div>

        {status && <p className="mt-5 rounded-md bg-primary/10 p-3 text-sm text-primary">{status}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => { setCfg(cardTextPadrao); setStatus(null); }}>
            <RotateCcw /> Restaurar padrão
          </Button>
          <Button type="button" onClick={() => void salvar()} disabled={salvando}>
            <Save /> {salvando ? "Salvando..." : "Salvar aparência"}
          </Button>
        </div>
      </div>
    </div>
  );
}