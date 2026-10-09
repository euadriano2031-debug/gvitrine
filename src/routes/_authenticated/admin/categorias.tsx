import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Palette, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  atualizarCategoria,
  criarCategoria,
  excluirCategoria,
  fetchCategoriasAdmin,
  categoriaBotaoPadrao,
  categoriaBotoesPadrao,
  fetchConfig,
  salvarConfig,
  uploadImagem,
  type Categoria,
  type CategoriaBotoesConfig,
  type CategoriaBotaoConfig,
} from "@/lib/loja";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  head: () => ({ meta: [
    { title: "Gerenciar categorias — AP SISTEMAS" },
    { name: "description", content: "Organize as categorias de produtos da loja AP SISTEMAS." },
    { property: "og:title", content: "Gerenciar categorias — AP SISTEMAS" },
    { property: "og:description", content: "Organize as categorias de produtos da loja." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CategoriasAdmin,
});

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function CategoriasAdmin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["categorias-admin"],
    queryFn: () => fetchCategoriasAdmin(),
  });
  const [form, setForm] = useState<Partial<Categoria> | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [configuracoesBotoes, setConfiguracoesBotoes] = useState<CategoriaBotoesConfig>(categoriaBotoesPadrao);
  const [categoriaBotao, setCategoriaBotao] = useState<Categoria | null>(null);
  const [cfgBotao, setCfgBotao] = useState<CategoriaBotaoConfig>(categoriaBotaoPadrao);
  const [statusBotao, setStatusBotao] = useState<string | null>(null);
  const [enviandoImagemBotao, setEnviandoImagemBotao] = useState(false);

  const invalidar = () => {
    void qc.invalidateQueries({ queryKey: ["categorias-admin"] });
    void qc.invalidateQueries({ queryKey: ["categorias-publicas"] });
    void qc.invalidateQueries({ queryKey: ["produtos-publicos"] });
    void qc.invalidateQueries({ queryKey: ["produtos-admin"] });
  };

  const salvar = useMutation({
    mutationFn: async (f: Partial<Categoria>) => {
      const nome = (f.nome ?? "").trim();
      const slug = (f.slug ?? "").trim();
      const ordem = Number(f.ordem ?? 0);
      if (!nome) throw new Error("Informe o nome da categoria.");
      if (!slug) throw new Error("Informe o slug da categoria.");
      if (f.id) {
        await atualizarCategoria(f.id, { nome, slug, ordem });
      } else {
        await criarCategoria({ nome, slug, ordem });
      }
    },
    onSuccess: () => {
      setForm(null);
      invalidar();
    },
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      await excluirCategoria(id);
    },
    onSuccess: invalidar,
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : "Erro ao excluir"),
  });

  const categorias = useMemo(() => data, [data]);

  const abrirPersonalizacaoBotao = async (categoria: Categoria) => {
    setCategoriaBotao(categoria);
    setStatusBotao(null);
    try {
      const atual = await fetchConfig("categoria_botoes", categoriaBotoesPadrao);
      setConfiguracoesBotoes(atual);
      setCfgBotao({
        ...categoriaBotaoPadrao,
        ...(atual[categoria.id] ?? {}),
        texto: atual[categoria.id]?.texto ?? "",
      });
    } catch (e) {
      setStatusBotao(e instanceof Error ? e.message : "Não foi possível carregar a personalização.");
    }
  };

  const enviarImagemBotao = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setStatusBotao("Envie uma imagem em PNG, JPG, GIF, WebP ou outro formato de imagem compatível.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatusBotao("A imagem deve ter no máximo 10 MB.");
      return;
    }

    setEnviandoImagemBotao(true);
    setStatusBotao(null);
    try {
      const url = await uploadImagem(file, "categorias");
      setCfgBotao((atual) => ({
        ...atual,
        modo: "imagem",
        imagem_url: url,
        imagem_alt: atual.imagem_alt || categoriaBotao?.nome || "Imagem da categoria",
      }));
      setStatusBotao("Imagem carregada com sucesso.");
    } catch (e) {
      setStatusBotao(e instanceof Error ? e.message : "Não foi possível carregar a imagem.");
    } finally {
      setEnviandoImagemBotao(false);
    }
  };

  const salvarPersonalizacaoBotao = async () => {
    if (!categoriaBotao) return;

    setStatusBotao(null);
    try {
      const proximo = {
        ...configuracoesBotoes,
        [categoriaBotao.id]: {
          ...categoriaBotaoPadrao,
          ...cfgBotao,
          texto: cfgBotao.texto.trim(),
          imagem_alt: cfgBotao.imagem_alt.trim(),
        },
      };
      await salvarConfig("categoria_botoes", proximo);
      setConfiguracoesBotoes(proximo);
      await qc.invalidateQueries({ queryKey: ["cfg", "categoria_botoes"] });
      setStatusBotao("Personalização do botão salva com sucesso.");
    } catch (e) {
      setStatusBotao(e instanceof Error ? e.message : "Não foi possível salvar a personalização.");
    }
  };

  const restaurarPersonalizacaoBotao = async () => {
    if (!categoriaBotao) return;
    setStatusBotao(null);
    try {
      const proximo = { ...configuracoesBotoes };
      delete proximo[categoriaBotao.id];
      await salvarConfig("categoria_botoes", proximo);
      setConfiguracoesBotoes(proximo);
      setCfgBotao({ ...categoriaBotaoPadrao });
      await qc.invalidateQueries({ queryKey: ["cfg", "categoria_botoes"] });
      setStatusBotao("Padrão restaurado para esta categoria.");
    } catch (e) {
      setStatusBotao(e instanceof Error ? e.message : "Não foi possível restaurar.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize os produtos em categorias para facilitar a navegação na loja.
          </p>
        </div>
        <button
          onClick={() => {
            setErro(null);
            setForm({ nome: "", slug: "", ordem: 0 });
          }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Nova categoria
        </button>
      </div>

      {erro && !form && (
        <p className="mt-4 rounded-md bg-destructive/10 p-3 text-xs text-destructive">{erro}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Ordem</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && categorias.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            )}
            {categorias.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{c.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3">{c.ordem}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => {
                        setErro(null);
                        setForm({ ...c });
                      }}
                      className="rounded p-2 hover:bg-muted"
                      aria-label="Editar"
                      title="Editar categoria"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => void abrirPersonalizacaoBotao(c)}
                      className="rounded p-2 hover:bg-muted"
                      aria-label="Personalizar botão da categoria"
                      title="Personalizar botão da categoria"
                    >
                      <Palette className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir a categoria "${c.nome}"?\n\nProdutos vinculados ficarão sem categoria.`)) {
                          excluir.mutate(c.id);
                        }
                      }}
                      className="rounded p-2 text-destructive hover:bg-destructive/10"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {categoriaBotao && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4">
          <div className="my-8 w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Personalizar botão — {categoriaBotao.nome}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Escolha o botão atual do site ou substitua por uma imagem de categoria.
                </p>
              </div>
              <button type="button" onClick={() => setCategoriaBotao(null)} className="rounded p-2 hover:bg-muted" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <Campo label="Tipo de apresentação">
                  <select
                    value={cfgBotao.modo}
                    onChange={(e) => setCfgBotao((atual) => ({ ...atual, modo: e.target.value as CategoriaBotaoConfig["modo"] }))}
                    className={inputCls}
                  >
                    <option value="botao">Botão padrão (já existente no site)</option>
                    <option value="imagem">Imagem da categoria</option>
                  </select>
                </Campo>

                <Campo label="Nome / texto do botão">
                  <input
                    value={cfgBotao.texto}
                    onChange={(e) => setCfgBotao((atual) => ({ ...atual, texto: e.target.value }))}
                    className={inputCls}
                    placeholder={categoriaBotao.nome}
                  />
                </Campo>

                <Campo label="Tamanho do botão">
                  <select
                    value={cfgBotao.tamanho}
                    onChange={(e) => setCfgBotao((atual) => ({ ...atual, tamanho: e.target.value as CategoriaBotaoConfig["tamanho"] }))}
                    className={inputCls}
                  >
                    <option value="pequeno">Pequeno</option>
                    <option value="medio">Médio</option>
                    <option value="grande">Grande</option>
                  </select>
                </Campo>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo label="Cor do texto">
                    <input
                      type="color"
                      value={cfgBotao.texto_cor || "#111827"}
                      onChange={(e) => setCfgBotao((atual) => ({ ...atual, texto_cor: e.target.value }))}
                      className={inputCls + " h-10 p-1"}
                      disabled={cfgBotao.modo === "imagem"}
                    />
                  </Campo>
                  <Campo label="Cor do botão">
                    <input
                      type="color"
                      value={cfgBotao.fundo_cor || "#ffffff"}
                      onChange={(e) => setCfgBotao((atual) => ({ ...atual, fundo_cor: e.target.value }))}
                      className={inputCls + " h-10 p-1"}
                      disabled={cfgBotao.modo === "imagem"}
                    />
                  </Campo>
                </div>

                <fieldset className="space-y-3 rounded-lg border border-border p-4">
                  <legend className="px-2 text-sm font-semibold">Imagem da categoria</legend>
                  <Campo label="URL da imagem">
                    <input
                      value={cfgBotao.imagem_url}
                      onChange={(e) => setCfgBotao((atual) => ({ ...atual, imagem_url: e.target.value }))}
                      className={inputCls}
                      placeholder="https://..."
                    />
                  </Campo>
                  <Campo label="Texto alternativo da imagem">
                    <input
                      value={cfgBotao.imagem_alt}
                      onChange={(e) => setCfgBotao((atual) => ({ ...atual, imagem_alt: e.target.value }))}
                      className={inputCls}
                      placeholder={categoriaBotao.nome}
                    />
                  </Campo>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    {enviandoImagemBotao ? "Enviando..." : "Enviar imagem"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={enviandoImagemBotao}
                      onChange={(e) => {
                        const arquivo = e.target.files?.[0];
                        if (arquivo) void enviarImagemBotao(arquivo);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {cfgBotao.imagem_url ? (
                    <div className="overflow-hidden rounded-lg border border-border bg-muted/20 p-3">
                      <img src={cfgBotao.imagem_url} alt={cfgBotao.imagem_alt || categoriaBotao.nome} className="max-h-40 w-full object-contain" />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Formatos aceitos: PNG, JPG/JPEG, GIF, WebP e outros formatos de imagem compatíveis.</p>
                  )}
                </fieldset>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-muted-foreground">Pré-visualização</p>
                <div className="rounded-xl border border-border bg-background p-6">
                  {cfgBotao.modo === "imagem" && cfgBotao.imagem_url ? (
                    <button type="button" className="mx-auto flex w-full items-center justify-center rounded-xl">
                      <img
                        src={cfgBotao.imagem_url}
                        alt={cfgBotao.imagem_alt || categoriaBotao.nome}
                        className="rounded-xl object-contain"
                        style={{
                          width: cfgBotao.tamanho === "pequeno" ? 90 : cfgBotao.tamanho === "grande" ? 180 : 135,
                          height: cfgBotao.tamanho === "pequeno" ? 56 : cfgBotao.tamanho === "grande" ? 110 : 80,
                        }}
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="mx-auto block rounded-full border px-4 py-2 font-medium transition"
                      style={{
                        color: cfgBotao.texto_cor || undefined,
                        backgroundColor: cfgBotao.fundo_cor || undefined,
                        fontSize: cfgBotao.tamanho === "pequeno" ? 12 : cfgBotao.tamanho === "grande" ? 16 : 14,
                        padding:
                          cfgBotao.tamanho === "pequeno"
                            ? "6px 12px"
                            : cfgBotao.tamanho === "grande"
                              ? "10px 18px"
                              : "8px 15px",
                      }}
                    >
                      {cfgBotao.texto || categoriaBotao.nome}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {statusBotao && <p className="mt-5 rounded-md bg-primary/10 p-3 text-sm text-primary">{statusBotao}</p>}

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => void restaurarPersonalizacaoBotao()}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Restaurar padrão
              </button>
              <button
                type="button"
                onClick={() => void salvarPersonalizacaoBotao()}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Palette className="h-4 w-4" /> Salvar personalização
              </button>
            </div>
          </div>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
          <div className="my-8 w-full max-w-lg rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {form.id ? "Editar categoria" : "Nova categoria"}
              </h2>
              <button
                onClick={() => setForm(null)}
                className="rounded p-2 hover:bg-muted"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setErro(null);
                salvar.mutate(form);
              }}
            >
              <Campo label="Nome da categoria">
                <input
                  required
                  value={form.nome ?? ""}
                  onChange={(e) => {
                    const nome = e.target.value;
                    setForm((f) => ({
                      ...f,
                      nome,
                      slug: f?.id ? f.slug : slugify(nome),
                    }));
                  }}
                  className={inputCls}
                  placeholder="Ex.: Automação, IA, Sites"
                />
              </Campo>

              <Campo label="Slug (usado em URLs)">
                <input
                  required
                  value={form.slug ?? ""}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  className={inputCls}
                  placeholder="automacao"
                />
              </Campo>

              <Campo label="Ordem de exibição">
                <input
                  type="number"
                  value={String(form.ordem ?? 0)}
                  onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })}
                  className={inputCls}
                />
              </Campo>

              {erro && (
                <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{erro}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForm(null)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvar.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {salvar.isPending ? "Salvando..." : "Salvar categoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
