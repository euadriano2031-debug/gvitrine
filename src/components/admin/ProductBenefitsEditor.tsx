import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchConfig,
  productBenefitsPadrao,
  salvarConfig,
  type ProductBenefitsConfig,
} from "@/lib/loja";

const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function ProductBenefitsEditor({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery<ProductBenefitsConfig>({
    queryKey: ["cfg", "produto_beneficios"],
    queryFn: () => fetchConfig("produto_beneficios", productBenefitsPadrao),
  });
  const [cfg, setCfg] = useState<ProductBenefitsConfig>(productBenefitsPadrao);
  const [status, setStatus] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (data) setCfg(data);
  }, [data]);

  const alterarItem = (indice: number, texto: string) => {
    setCfg((atual) => ({ ...atual, itens: atual.itens.map((item, i) => (i === indice ? texto : item)) }));
  };

  const removerItem = (indice: number) => {
    setCfg((atual) => ({ ...atual, itens: atual.itens.filter((_, i) => i !== indice) }));
  };

  const salvar = async () => {
    setSalvando(true);
    setStatus(null);
    try {
      const ajustada = { ...cfg, itens: cfg.itens.map((item) => item.trim()).filter(Boolean).slice(0, 8) };
      await salvarConfig("produto_beneficios", ajustada);
      setCfg(ajustada);
      await qc.invalidateQueries({ queryKey: ["cfg", "produto_beneficios"] });
      setStatus("Benefícios salvos com sucesso!");
    } catch (erro) {
      setStatus(erro instanceof Error ? erro.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/60 p-4">
      <div className="mx-auto my-6 w-full max-w-3xl rounded-lg border border-border bg-card p-5 shadow-xl md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Personalizar benefícios</h2>
            <p className="mt-1 text-sm text-muted-foreground">Edite a lista mostrada abaixo dos botões nas páginas dos produtos.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Fechar</Button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs text-muted-foreground">Cor dos textos</span>
                <input type="color" value={cfg.texto_cor} onChange={(e) => setCfg({ ...cfg, texto_cor: e.target.value })} className={inputCls + " h-10 p-1"} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-muted-foreground">Cor dos ícones</span>
                <input type="color" value={cfg.icone_cor} onChange={(e) => setCfg({ ...cfg, icone_cor: e.target.value })} className={inputCls + " h-10 p-1"} />
              </label>
            </div>

            <div className="mt-5 space-y-2">
              {cfg.itens.map((item, indice) => (
                <div key={indice} className="flex items-center gap-2">
                  <input
                    value={item}
                    maxLength={80}
                    aria-label={`Benefício ${indice + 1}`}
                    onChange={(e) => alterarItem(indice, e.target.value)}
                    className={inputCls}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => removerItem(indice)} aria-label={`Remover benefício ${indice + 1}`} title="Remover">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              disabled={cfg.itens.length >= 8}
              onClick={() => setCfg((atual) => ({ ...atual, itens: [...atual.itens, "Novo benefício"] }))}
            >
              <Plus /> Adicionar benefício
            </Button>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-muted-foreground">Pré-visualização</p>
            <ul className="space-y-2 rounded-md border border-border bg-background p-4 text-xs">
              {cfg.itens.filter(Boolean).map((item, indice) => (
                <li key={`${item}-${indice}`} className="flex items-center gap-2" style={{ color: cfg.texto_cor }}>
                  <Check className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.icone_cor }} /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {status && <p className="mt-5 rounded-md bg-primary/10 p-3 text-sm text-primary">{status}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => { setCfg(productBenefitsPadrao); setStatus(null); }}>
            <RotateCcw /> Restaurar padrão
          </Button>
          <Button type="button" onClick={() => void salvar()} disabled={salvando}>
            <Save /> {salvando ? "Salvando..." : "Salvar benefícios"}
          </Button>
        </div>
      </div>
    </div>
  );
}