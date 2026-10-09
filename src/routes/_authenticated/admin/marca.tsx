import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchConfig, marcaPadrao, salvarConfig, uploadImagem, type MarcaConfig } from "@/lib/loja";
import { getActiveOrganizationId, getActiveOrganizationSlug, atualizarMinhaLoja, setActiveOrganization } from "@/lib/saas";

export const Route = createFileRoute("/_authenticated/admin/marca")({
  head: () => ({ meta: [
    { title: "Marca da empresa — AP SISTEMAS" },
    { name: "description", content: "Atualize o nome e a logomarca exibidos na loja." },
    { property: "og:title", content: "Marca da empresa — AP SISTEMAS" },
    { property: "og:description", content: "Atualize o nome e a logomarca exibidos na loja." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: MarcaAdmin,
});

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function MarcaAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery<MarcaConfig>({
    queryKey: ["cfg", "marca"],
    queryFn: () => fetchConfig("marca", marcaPadrao),
  });
  const [cfg, setCfg] = useState<MarcaConfig>(marcaPadrao);
  const [status, setStatus] = useState<string | null>(null);
  const [nomeLoja, setNomeLoja] = useState("");
  const [slugLoja, setSlugLoja] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (data) setCfg(data);
  }, [data]);

  useEffect(() => {
    setNomeLoja(data?.nome?.trim() || "");
    setSlugLoja(getActiveOrganizationSlug() || "");
  }, [data]);

  const enviarLogo = async (file?: File | null) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp|svg\+xml)$/.test(file.type)) {
      setStatus("Envie um arquivo JPG, PNG, WEBP ou SVG.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setStatus("A imagem deve ter no máximo 3 MB.");
      return;
    }
    setEnviando(true);
    setStatus(null);
    try {
      const url = await uploadImagem(file, "marca");
      setCfg((c) => ({ ...c, logo_url: url }));
      setStatus("Logomarca enviada! Clique em salvar para aplicar.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Erro ao enviar imagem");
    } finally {
      setEnviando(false);
    }
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      const organizationId = getActiveOrganizationId();

      await salvarConfig("marca", { ...cfg, nome: cfg.nome.trim().slice(0, 60) });

      if (organizationId) {
        const loja = await atualizarMinhaLoja(organizationId, {
          name: nomeLoja.trim() || cfg.nome.trim(),
          slug: slugLoja.trim() || nomeLoja.trim() || cfg.nome.trim(),
        });
        setActiveOrganization(loja);
        setNomeLoja(loja.name);
        setSlugLoja(loja.slug);
      }

      void qc.invalidateQueries({ queryKey: ["cfg", "marca"] });
      setStatus("Marca e endereço da loja salvos com sucesso!");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Marca da Empresa</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Escolha entre enviar uma logomarca (JPG/PNG) e/ou exibir o nome da empresa em texto no topo da loja.
      </p>

      <form onSubmit={salvar} className="mt-6 space-y-4">
        <Campo label="Nome da marca (texto)">
          <input
            value={cfg.nome}
            maxLength={60}
            onChange={(e) => setCfg({ ...cfg, nome: e.target.value })}
            className={inputCls}
            placeholder="Minha Empresa"
          />
        </Campo>
        <Campo label="Nome da loja">
          <input
            value={nomeLoja}
            maxLength={80}
            onChange={(e) => setNomeLoja(e.target.value)}
            className={inputCls}
            placeholder="Ex.: SAM VITRINE"
          />
        </Campo>

        <Campo label="Endereço da loja (slug)">
          <input
            value={slugLoja}
            maxLength={70}
            onChange={(e) =>
              setSlugLoja(
                e.target.value
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .toLowerCase()
                  .replace(/[^a-z0-9-]+/g, "-")
                  .replace(/^-+|-+$/g, ""),
              )
            }
            className={inputCls}
            placeholder="samvitrine"
          />
          <span className="mt-1 block text-[11px] text-muted-foreground">
            Exemplo: https://gvitrine.vercel.app/loja/samvitrine
          </span>
        </Campo>


        <Campo label="Exibir nome em texto">
          <select
            value={cfg.mostrar_nome ? "1" : "0"}
            onChange={(e) => setCfg({ ...cfg, mostrar_nome: e.target.value === "1" })}
            className={inputCls}
          >
            <option value="1">Sim, mostrar o nome</option>
            <option value="0">Não, apenas a logomarca</option>
          </select>
        </Campo>

        <Campo label="Logomarca (JPG, PNG, WEBP ou SVG — até 3 MB)">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => void enviarLogo(e.target.files?.[0])}
            className={inputCls}
          />
        </Campo>

        <Campo label="URL da logomarca (opcional — cole um link)">
          <input
            value={cfg.logo_url}
            onChange={(e) => setCfg({ ...cfg, logo_url: e.target.value })}
            className={inputCls}
            placeholder="https://..."
          />
        </Campo>

        <Campo label={`Altura da logomarca: ${cfg.altura_logo}px`}>
          <input
            type="range"
            min={24}
            max={96}
            value={cfg.altura_logo}
            onChange={(e) => setCfg({ ...cfg, altura_logo: Number(e.target.value) })}
            className="w-full"
          />
        </Campo>

        <div className="rounded-xl border border-border bg-card p-5">
          <span className="text-xs font-medium text-muted-foreground">Pré-visualização</span>
          <div className="mt-3 flex items-center gap-3">
            {cfg.logo_url && (
              <img
                src={cfg.logo_url}
                alt={cfg.nome || "Logomarca"}
                style={{ height: cfg.altura_logo }}
                className="w-auto object-contain"
              />
            )}
            {(cfg.mostrar_nome || !cfg.logo_url) && (
              <span className="text-2xl font-bold tracking-tight">{cfg.nome || "Loja Vitrine"}</span>
            )}
          </div>
        </div>

        {enviando && <p className="text-xs text-muted-foreground">Enviando imagem…</p>}
        {status && <p className="rounded-md bg-primary/10 p-2 text-xs text-primary">{status}</p>}
        <button className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Salvar marca
        </button>
      </form>
    </div>
  );
}
