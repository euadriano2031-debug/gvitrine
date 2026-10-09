import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Building2, Menu, RotateCcw, Save, ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  adminHeaderPadrao,
  fetchConfig,
  faviconPadrao,
  compartilhamentoPadrao,
  rodapePadrao,
  salvarConfig,
  uploadImagem,
  type AdminHeaderConfig,
  type FaviconConfig,
  type CompartilhamentoConfig,
  type RodapeConfig,
} from "@/lib/loja";

export const Route = createFileRoute("/_authenticated/admin/aparencia")({
  head: () => ({ meta: [
    { title: "Aparência do painel — AP SISTEMAS" },
    { name: "description", content: "Personalize textos, cores, botões e ícones do painel administrativo." },
    { property: "og:title", content: "Aparência do painel — AP SISTEMAS" },
    { property: "og:description", content: "Personalize textos, cores, botões e ícones do painel administrativo." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AparenciaAdmin,
});

const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}

function AparenciaAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery<AdminHeaderConfig>({
    queryKey: ["cfg", "admin_cabecalho"],
    queryFn: () => fetchConfig("admin_cabecalho", adminHeaderPadrao),
  });
  const { data: faviconData } = useQuery<FaviconConfig>({
    queryKey: ["cfg", "favicon"],
    queryFn: () => fetchConfig("favicon", faviconPadrao),
  });
  const { data: compartilhamentoData } = useQuery<CompartilhamentoConfig>({
    queryKey: ["cfg", "compartilhamento"],
    queryFn: () => fetchConfig("compartilhamento", compartilhamentoPadrao),
  });
  const { data: rodapeData } = useQuery<RodapeConfig>({
    queryKey: ["cfg", "rodape"],
    queryFn: () => fetchConfig("rodape", rodapePadrao),
  });
  const [cfg, setCfg] = useState(adminHeaderPadrao);
  const [favicon, setFavicon] = useState(faviconPadrao);
  const [compartilhamento, setCompartilhamento] = useState(compartilhamentoPadrao);
  const [rodape, setRodape] = useState<RodapeConfig>(rodapePadrao);
  const [status, setStatus] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFavicon, setEnviandoFavicon] = useState(false);

  useEffect(() => {
    if (data) setCfg(data);
  }, [data]);

  useEffect(() => {
    if (faviconData) setFavicon(faviconData);
  }, [faviconData]);

  useEffect(() => {
    if (compartilhamentoData) setCompartilhamento(compartilhamentoData);
  }, [compartilhamentoData]);

  useEffect(() => {
    if (rodapeData) setRodape(rodapeData);
  }, [rodapeData]);

  const salvar = async () => {
    setSalvando(true);
    setStatus(null);
    const ajustada = {
      ...cfg,
      titulo: cfg.titulo.trim().slice(0, 40) || adminHeaderPadrao.titulo,
      loja_texto: cfg.loja_texto.trim().slice(0, 12) || adminHeaderPadrao.loja_texto,
      sidebar_titulo: cfg.sidebar_titulo.trim().slice(0, 40) || adminHeaderPadrao.sidebar_titulo,
      sidebar_subtitulo: cfg.sidebar_subtitulo.trim().slice(0, 40) || adminHeaderPadrao.sidebar_subtitulo,
      sidebar_icone: ["store", "building", "shopping-bag"].includes(cfg.sidebar_icone) ? cfg.sidebar_icone : adminHeaderPadrao.sidebar_icone,
    };
    const faviconAjustado = {
      url: favicon.url.trim() || faviconPadrao.url,
    };
    const siteUrl = compartilhamento.site_url.trim() || compartilhamentoPadrao.site_url;
    try {
      const parsedSiteUrl = new URL(siteUrl);
      if (!["http:", "https:"].includes(parsedSiteUrl.protocol)) {
        throw new Error("O link do site deve começar com http:// ou https://.");
      }
    } catch {
      setStatus("Digite um link válido para o site, por exemplo: https://g-vitrine.lovable.app/");
      setSalvando(false);
      return;
    }

    const compartilhamentoAjustado = {
      imagem_url: compartilhamento.imagem_url.trim(),
      titulo: compartilhamento.titulo.trim().slice(0, 100) || compartilhamentoPadrao.titulo,
      descricao: compartilhamento.descricao.trim().slice(0, 200) || compartilhamentoPadrao.descricao,
      site_url: siteUrl,
    };

    try {
      await salvarConfig("admin_cabecalho", ajustada);
      await salvarConfig("favicon", faviconAjustado);
      const rodapeAjustado = {
        texto: rodape.texto.trim().slice(0, 180) || rodapePadrao.texto,
      };

      await salvarConfig("compartilhamento", compartilhamentoAjustado);
      await salvarConfig("rodape", rodapeAjustado);
      setCfg(ajustada);
      setFavicon(faviconAjustado);
      setCompartilhamento(compartilhamentoAjustado);
      setRodape(rodapeAjustado);
      window.dispatchEvent(new CustomEvent("favicon-updated", { detail: faviconAjustado }));
      await qc.invalidateQueries({ queryKey: ["cfg", "admin_cabecalho"] });
      await qc.invalidateQueries({ queryKey: ["cfg", "favicon"] });
      await qc.invalidateQueries({ queryKey: ["cfg", "compartilhamento"] });
      await qc.invalidateQueries({ queryKey: ["cfg", "rodape"] });
      setStatus("Aparência salva com sucesso!");
    } catch (erro) {
      setStatus(erro instanceof Error ? erro.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const cor = (label: string, chave: keyof AdminHeaderConfig) => (
    <Campo label={label}>
      <input type="color" value={String(cfg[chave])} onChange={(e) => setCfg((atual) => ({ ...atual, [chave]: e.target.value }))} className={`${inputCls} h-10 p-1`} />
    </Campo>
  );

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold">Aparência do painel</h1>
      <p className="mt-1 text-sm text-muted-foreground">Personalize o cabeçalho exibido em todas as páginas administrativas.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <fieldset className="rounded-md border border-border p-4">
            <legend className="px-1 text-sm font-semibold">Título do painel</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Texto">
                <input value={cfg.titulo} maxLength={40} onChange={(e) => setCfg({ ...cfg, titulo: e.target.value })} className={inputCls} />
              </Campo>
              <Campo label={`Tamanho da fonte: ${cfg.titulo_tamanho}px`}>
                <input type="range" min={12} max={28} value={cfg.titulo_tamanho} onChange={(e) => setCfg({ ...cfg, titulo_tamanho: Number(e.target.value) })} className="h-10 w-full" />
              </Campo>
              {cor("Cor do texto", "titulo_cor")}
            </div>
          </fieldset>

          <fieldset className="rounded-md border border-border p-4">
            <legend className="px-1 text-sm font-semibold">Botão do menu</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {cor("Cor do botão", "menu_fundo_cor")}
              {cor("Cor do ícone", "menu_icone_cor")}
            </div>
          </fieldset>

          <fieldset className="rounded-md border border-border p-4">
            <legend className="px-1 text-sm font-semibold">Cabeçalho da navegação lateral</legend>
            <p className="mb-4 text-xs text-muted-foreground">Personalize o bloco verde com o ícone e os textos “Administração” e “Loja digital” mostrado no topo do menu lateral.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Texto principal">
                <input value={cfg.sidebar_titulo} maxLength={40} onChange={(e) => setCfg({ ...cfg, sidebar_titulo: e.target.value })} className={inputCls} />
              </Campo>
              <Campo label="Texto secundário">
                <input value={cfg.sidebar_subtitulo} maxLength={40} onChange={(e) => setCfg({ ...cfg, sidebar_subtitulo: e.target.value })} className={inputCls} />
              </Campo>
              <Campo label={`Tamanho do texto principal: ${cfg.sidebar_titulo_tamanho}px`}>
                <input type="range" min={11} max={24} value={cfg.sidebar_titulo_tamanho} onChange={(e) => setCfg({ ...cfg, sidebar_titulo_tamanho: Number(e.target.value) })} className="h-10 w-full" />
              </Campo>
              <Campo label={`Tamanho do texto secundário: ${cfg.sidebar_subtitulo_tamanho}px`}>
                <input type="range" min={8} max={18} value={cfg.sidebar_subtitulo_tamanho} onChange={(e) => setCfg({ ...cfg, sidebar_subtitulo_tamanho: Number(e.target.value) })} className="h-10 w-full" />
              </Campo>
              {cor("Cor do texto principal", "sidebar_titulo_cor")}
              {cor("Cor do texto secundário", "sidebar_subtitulo_cor")}
              {cor("Cor do botão/ícone", "sidebar_fundo_cor")}
              {cor("Cor do ícone", "sidebar_icone_cor")}
              <Campo label="Ícone">
                <select value={cfg.sidebar_icone} onChange={(e) => setCfg({ ...cfg, sidebar_icone: e.target.value })} className={inputCls}>
                  <option value="store">Loja</option>
                  <option value="building">Prédio</option>
                  <option value="shopping-bag">Sacola</option>
                </select>
              </Campo>
            </div>
            <div className="mt-5 rounded-md border border-border p-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Pré-visualização</p>
              <div className="flex w-full max-w-xs items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: cfg.sidebar_fundo_cor, color: cfg.sidebar_icone_cor }}>
                  {cfg.sidebar_icone === "building" ? <Building2 className="size-5" /> : cfg.sidebar_icone === "shopping-bag" ? <ShoppingBag className="size-5" /> : <Store className="size-5" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold" style={{ color: cfg.sidebar_titulo_cor, fontSize: `${cfg.sidebar_titulo_tamanho}px` }}>{cfg.sidebar_titulo}</span>
                  <span className="block truncate" style={{ color: cfg.sidebar_subtitulo_cor, fontSize: `${cfg.sidebar_subtitulo_tamanho}px` }}>{cfg.sidebar_subtitulo}</span>
                </span>
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-md border border-border p-4">
            <legend className="px-1 text-sm font-semibold">Rodapé da loja</legend>
            <p className="mb-4 text-xs text-muted-foreground">
              O texto fica centralizado na parte inferior da loja, inclusive no celular. Use
              <strong>{"{{ANO}}"}</strong> para o ano atual e <strong>{"{{LOJA}}"}</strong> para o nome da loja.
            </p>
            <Campo label="Texto do rodapé">
              <textarea
                value={rodape.texto}
                maxLength={180}
                rows={3}
                onChange={(e) => setRodape({ texto: e.target.value })}
                className={inputCls}
                placeholder={rodapePadrao.texto}
              />
            </Campo>
            <div className="mt-3 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              Prévia: <span className="font-medium text-foreground">© 2026 Sua Loja — Todos os direitos reservados.</span>
            </div>
          </fieldset>

          <fieldset className="rounded-md border border-border p-4">
            <legend className="px-1 text-sm font-semibold">Compartilhamento no WhatsApp</legend>
            <p className="mb-4 text-xs text-muted-foreground">
              Configure o título, a descrição e o link. A imagem da prévia será puxada automaticamente do favicon configurado logo abaixo.
            </p>
            <div className="space-y-4">
              <Campo label="Título">
                <input
                  value={compartilhamento.titulo}
                  maxLength={100}
                  onChange={(e) => setCompartilhamento((atual) => ({ ...atual, titulo: e.target.value }))}
                  className={inputCls}
                  placeholder="G-Vitrine"
                />
              </Campo>

              <Campo label="Descrição">
                <textarea
                  value={compartilhamento.descricao}
                  maxLength={200}
                  rows={3}
                  onChange={(e) => setCompartilhamento((atual) => ({ ...atual, descricao: e.target.value }))}
                  className={inputCls}
                  placeholder="Descrição que aparecerá na prévia do WhatsApp"
                />
              </Campo>

              <Campo label="Link do site">
                <input
                  type="url"
                  value={compartilhamento.site_url}
                  onChange={(e) => setCompartilhamento((atual) => ({ ...atual, site_url: e.target.value }))}
                  className={inputCls}
                  placeholder="https://g-vitrine.lovable.app/"
                />
              </Campo>

              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Pré-visualização</p>
                <div className="max-w-sm overflow-hidden rounded-lg border border-border bg-background shadow-sm">
                  {favicon.url ? (
                    <img src={favicon.url} alt="Favicon usado no compartilhamento" className="aspect-[1.91/1] w-full object-contain bg-muted p-8" />
                  ) : (
                    <div className="flex aspect-[1.91/1] items-center justify-center bg-muted text-xs text-muted-foreground">
                      Adicione um favicon abaixo
                    </div>
                  )}
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{compartilhamento.titulo || "Título do site"}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{compartilhamento.descricao || "Descrição do site"}</p>
                    <p className="mt-2 truncate text-[11px] text-muted-foreground">{compartilhamento.site_url || "https://g-vitrine.lovable.app/"}</p>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-md border border-border p-4">
            <legend className="px-1 text-sm font-semibold">Favicon da loja</legend>
            <p className="mb-4 text-xs text-muted-foreground">
              Adicione uma imagem para aparecer na aba do navegador. Formatos aceitos: PNG, JPEG, JPG, WEBP e GIF.
            </p>
            <div className="space-y-4">
              <Campo label="Link da imagem favicon">
                <input
                  type="url"
                  value={favicon.url === "/favicon.ico" ? "" : favicon.url}
                  onChange={(e) => setFavicon({ url: e.target.value })}
                  className={inputCls}
                  placeholder="https://exemplo.com/favicon.png"
                />
              </Campo>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
                  {enviandoFavicon ? "Enviando..." : "Enviar imagem"}
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    disabled={enviandoFavicon}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.currentTarget.value = "";
                      if (!file) return;
                      const permitidos = ["image/png", "image/jpeg", "image/webp", "image/gif"];
                      if (!permitidos.includes(file.type)) {
                        setStatus("Formato inválido. Use PNG, JPEG, JPG, WEBP ou GIF.");
                        return;
                      }
                      if (file.size > 2 * 1024 * 1024) {
                        setStatus("A imagem do favicon deve ter no máximo 2 MB.");
                        return;
                      }
                      setEnviandoFavicon(true);
                      setStatus(null);
                      try {
                        const url = await uploadImagem(file, "favicon");
                        setFavicon({ url });
                        setStatus("Favicon enviado. Clique em Salvar aparência para aplicar.");
                      } catch (erro) {
                        setStatus(erro instanceof Error ? erro.message : "Não foi possível enviar o favicon.");
                      } finally {
                        setEnviandoFavicon(false);
                      }
                    }}
                  />
                </label>
                <Button type="button" variant="outline" onClick={() => setFavicon(faviconPadrao)}>
                  Restaurar favicon padrão
                </Button>
              </div>

              <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
                <div className="flex size-12 items-center justify-center rounded-md border border-border bg-background">
                  <img
                    src={favicon.url || faviconPadrao.url}
                    alt="Pré-visualização do favicon"
                    className="size-8 object-contain"
                    onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Pré-visualização</p>
                  <p className="max-w-xl break-all text-xs text-muted-foreground">{favicon.url || faviconPadrao.url}</p>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-md border border-border p-4">
            <legend className="px-1 text-sm font-semibold">Botão da loja</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Texto do botão">
                <input value={cfg.loja_texto} maxLength={12} onChange={(e) => setCfg({ ...cfg, loja_texto: e.target.value })} className={inputCls} />
              </Campo>
              <Campo label={`Tamanho da fonte: ${cfg.loja_texto_tamanho}px`}>
                <input type="range" min={9} max={20} value={cfg.loja_texto_tamanho} onChange={(e) => setCfg({ ...cfg, loja_texto_tamanho: Number(e.target.value) })} className="h-10 w-full" />
              </Campo>
              {cor("Cor do botão", "loja_fundo_cor")}
              {cor("Cor do ícone", "loja_icone_cor")}
              {cor("Cor do texto", "loja_texto_cor")}
            </div>
          </fieldset>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">Pré-visualização no celular</p>
          <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
            <div className="flex h-16 items-center justify-between gap-3 border-b border-border bg-background px-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: cfg.menu_fundo_cor, color: cfg.menu_icone_cor }}><Menu className="size-6" /></span>
                <span className="truncate font-bold" style={{ color: cfg.titulo_cor, fontSize: `${cfg.titulo_tamanho}px` }}>{cfg.titulo || adminHeaderPadrao.titulo}</span>
              </div>
              <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-md leading-none" style={{ backgroundColor: cfg.loja_fundo_cor }}>
                <Store className="size-6" style={{ color: cfg.loja_icone_cor }} />
                <span className="font-bold" style={{ color: cfg.loja_texto_cor, fontSize: `${cfg.loja_texto_tamanho}px` }}>{cfg.loja_texto || adminHeaderPadrao.loja_texto}</span>
              </span>
            </div>
            <div className="h-32 bg-muted/40" />
          </div>
        </div>
      </div>

      {status && <p className="mt-5 rounded-md bg-primary/10 p-3 text-sm text-primary">{status}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => { setCfg(adminHeaderPadrao); setFavicon(faviconPadrao); setCompartilhamento(compartilhamentoPadrao); setStatus(null); }}><RotateCcw /> Restaurar padrão</Button>
        <Button type="button" onClick={() => void salvar()} disabled={salvando}><Save /> {salvando ? "Salvando..." : "Salvar aparência"}</Button>
      </div>
    </div>
  );
}