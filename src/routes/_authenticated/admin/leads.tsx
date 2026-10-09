import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Mail, MessageSquare, Phone, Search, Trash2, Users } from "lucide-react";
import {
  excluirLead,
  fetchLeadsAdmin,
  formatarData,
  leadsParaCsv,
  whatsappLeadLink,
  type LeadComProduto,
} from "@/lib/loja";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  head: () => ({ meta: [
    { title: "Mensagens recebidas — AP SISTEMAS" },
    { name: "description", content: "Consulte as mensagens e contatos recebidos pela loja." },
    { property: "og:title", content: "Mensagens recebidas — AP SISTEMAS" },
    { property: "og:description", content: "Consulte as mensagens e contatos recebidos pela loja." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: LeadsAdmin,
});

const POR_PAGINA = 12;

function LeadsAdmin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["leads-admin"],
    queryFn: () => fetchLeadsAdmin(),
  });
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [erro, setErro] = useState<string | null>(null);

  const invalidar = () => {
    void qc.invalidateQueries({ queryKey: ["leads-admin"] });
  };

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      await excluirLead(id);
    },
    onSuccess: invalidar,
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : "Erro ao excluir"),
  });

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return data;
    return data.filter((l) =>
      [l.nome, l.email ?? "", l.telefone ?? "", l.mensagem ?? "", l.produtos?.titulo ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [data, busca]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  const exportarCsv = () => {
    const csv = leadsParaCsv(filtrados);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarXlsx = () => {
    if (filtrados.length === 0) return;

    const linhas = filtrados.map((l: LeadComProduto) => ({
      Data: formatarData(l.created_at),
      Nome: l.nome ?? "",
      "E-mail": l.email ?? "",
      Telefone: l.telefone ?? "",
      Produto: l.produtos?.titulo ?? "",
      Mensagem: l.mensagem ?? "",
      Status: l.status ?? "",
      Origem: l.source ?? "",
      "Página de origem": l.page_url ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(linhas);
    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 24 },
      { wch: 30 },
      { wch: 20 },
      { wch: 28 },
      { wch: 60 },
      { wch: 16 },
      { wch: 20 },
      { wch: 45 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, `leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contatos recebidos pelo site. {data.length} no total.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportarCsv}
            disabled={filtrados.length === 0}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          <button
            onClick={exportarXlsx}
            disabled={filtrados.length === 0}
            className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15 disabled:opacity-50"
            title="Exportar leads para Excel (.xlsx)"
          >
            <FileSpreadsheet className="h-4 w-4" /> Exportar XLSX
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por nome, e-mail, telefone, mensagem..."
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {erro && (
        <p className="mt-4 rounded-md bg-destructive/10 p-3 text-xs text-destructive">{erro}</p>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : visiveis.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <Users className="mx-auto mb-3 h-8 w-8 opacity-40" />
          Nenhum lead encontrado.
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((l: LeadComProduto) => (
            <div key={l.id} className="flex flex-col rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{l.nome}</div>
                  <div className="text-xs text-muted-foreground">{formatarData(l.created_at)}</div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Excluir o lead de "${l.nome}"?`)) excluir.mutate(l.id);
                  }}
                  className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                  aria-label="Excluir lead"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 space-y-1.5 text-sm">
                {l.email && (
                  <a href={`mailto:${l.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Mail className="h-3.5 w-3.5" /> <span className="truncate">{l.email}</span>
                  </a>
                )}
                {l.telefone && (
                  <a href={whatsappLeadLink(l.telefone, l.nome) || `tel:${l.telefone}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Phone className="h-3.5 w-3.5" /> <span className="truncate">{l.telefone}</span>
                  </a>
                )}
                {l.produtos?.titulo && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded bg-primary/15 text-[10px] font-bold text-primary">P</span>
                    <span className="truncate">{l.produtos.titulo}</span>
                  </div>
                )}
              </div>

              {l.mensagem && (
                <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-4">{l.mensagem}</span>
                </p>
              )}

              {l.telefone && (
                <a
                  href={whatsappLeadLink(l.telefone, l.nome)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  <Phone className="h-4 w-4" /> Responder no WhatsApp
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPaginas }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPagina(i + 1)}
              className={
                "h-9 w-9 rounded-md border text-sm " +
                (paginaAtual === i + 1 ? "border-transparent bg-primary text-primary-foreground" : "border-border hover:bg-muted")
              }
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
