import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ajudaPadrao, fetchConfig, salvarConfig, uploadImagem, type AjudaConfig } from "@/lib/loja";
import { HelpButton } from "@/components/loja/HelpButton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/ajuda")({
  head: () => ({ meta: [
    { title: "Imagem de atendimento — AP SISTEMAS" },
    { name: "description", content: "Configure a imagem flutuante de atendimento da loja." },
    { property: "og:title", content: "Imagem de atendimento — AP SISTEMAS" },
    { property: "og:description", content: "Configure a imagem flutuante de atendimento da loja." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AjudaAdmin,
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

function AjudaAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery<AjudaConfig>({ queryKey: ["cfg", "ajuda"], queryFn: () => fetchConfig("ajuda", ajudaPadrao) });
  const [cfg, setCfg] = useState<AjudaConfig>(ajudaPadrao);
  const [status, setStatus] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (data) setCfg(data);
  }, [data]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      await salvarConfig("ajuda", cfg);
      void qc.invalidateQueries({ queryKey: ["cfg", "ajuda"] });
      setStatus("Botão salvo com sucesso!");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const enviarImagem = async (file?: File | null) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      setStatus("Envie uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setStatus("A imagem deve ter no máximo 3 MB.");
      return;
    }
    setEnviando(true);
    setStatus(null);
    try {
      const imagem_url = await uploadImagem(file, "ajuda");
      setCfg((atual) => ({ ...atual, imagem_url }));
      setStatus("Imagem enviada. Clique em salvar para publicar.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Erro ao enviar imagem");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Imagem flutuante de atendimento</h1>
      <p className="mt-1 text-sm text-muted-foreground">Envie a imagem que aparecerá na loja e levará o cliente ao WhatsApp.</p>

      <form onSubmit={salvar} className="mt-6 space-y-4">
        <Campo label="Botão ativo">
          <select value={cfg.ativo ? "1" : "0"} onChange={(e) => setCfg({ ...cfg, ativo: e.target.value === "1" })} className={inputCls}>
            <option value="1">Ativado</option><option value="0">Desativado</option>
          </select>
        </Campo>
        <Campo label="Ao clicar, o botão abre">
          <select value={cfg.destino_tipo} onChange={(e) => setCfg({ ...cfg, destino_tipo: e.target.value as AjudaConfig["destino_tipo"] })} className={inputCls}>
            <option value="whatsapp">WhatsApp</option>
            <option value="link">Link ou URL personalizada</option>
          </select>
        </Campo>
        {cfg.destino_tipo === "link" ? (
          <Campo label="Link ou URL de destino">
            <input value={cfg.url_destino} onChange={(e) => setCfg({ ...cfg, url_destino: e.target.value })} className={inputCls} placeholder="https://seusite.com/pagina" />
          </Campo>
        ) : (
          <>
            <Campo label="Número do WhatsApp (com DDI)">
              <input value={cfg.numero} onChange={(e) => setCfg({ ...cfg, numero: e.target.value })} className={inputCls} placeholder="5511999999999" />
            </Campo>
            <Campo label="Mensagem automática">
              <textarea rows={3} value={cfg.mensagem} onChange={(e) => setCfg({ ...cfg, mensagem: e.target.value })} className={inputCls} />
            </Campo>
          </>
        )}
        <Campo label="Imagem do atendimento (JPG, PNG ou WEBP — até 3 MB)">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => void enviarImagem(e.target.files?.[0])}
            className={inputCls}
          />
        </Campo>
        {cfg.imagem_url && (
          <div className="flex items-center gap-4 rounded-md border border-border bg-card p-4">
            <img src={cfg.imagem_url} alt="Pré-visualização do atendimento" className="size-20 rounded-full object-cover" />
            <div>
              <p className="text-sm font-medium">Imagem pronta</p>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setCfg({ ...cfg, imagem_url: "" })}>
                Remover imagem
              </Button>
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Tamanho">
            <select value={cfg.tamanho} onChange={(e) => setCfg({ ...cfg, tamanho: e.target.value as AjudaConfig["tamanho"] })} className={inputCls}>
              <option value="pequeno">Pequeno</option><option value="medio">Médio</option><option value="grande">Grande</option>
            </select>
          </Campo>
          <Campo label="Posição">
            <select value={cfg.posicao} onChange={(e) => setCfg({ ...cfg, posicao: e.target.value as AjudaConfig["posicao"] })} className={inputCls}>
              <option value="bottom-right">Canto inferior direito</option><option value="bottom-left">Canto inferior esquerdo</option>
            </select>
          </Campo>
        </div>

        {enviando && <p className="text-xs text-muted-foreground">Enviando imagem…</p>}
        {status && <p className="rounded-md bg-primary/10 p-2 text-xs text-primary">{status}</p>}
        <Button type="submit" disabled={enviando}>Salvar imagem de atendimento</Button>
      </form>

      <section className="mt-8 rounded-md border border-border bg-card p-5">
        <p className="mb-4 text-xs font-medium text-muted-foreground">Pré-visualização na loja</p>
        <HelpButton cfg={cfg} preview />
      </section>
    </div>
  );
}
