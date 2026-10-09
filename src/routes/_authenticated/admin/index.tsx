import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, Inbox, Package, Star, XCircle, LayoutGrid } from "lucide-react";
import { fetchProdutosAdmin, fetchLeadsAdmin } from "@/lib/loja";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [
    { title: "Painel administrativo — AP SISTEMAS" },
    { name: "description", content: "Visão geral de produtos e contatos da loja AP SISTEMAS." },
    { property: "og:title", content: "Painel administrativo — AP SISTEMAS" },
    { property: "og:description", content: "Visão geral de produtos e contatos da loja." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Dashboard,
});

const cardCls =
  "group block rounded-xl border border-border bg-card p-6 transition hover:border-primary hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function CardShell({ label, valor, icon: Icon }: { label: string; valor: number; icon: typeof Package }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="mt-3 text-3xl font-bold">{valor}</div>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-60 transition group-hover:opacity-100">
        Abrir <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </>
  );
}

function Dashboard() {
  const { data = [], isLoading } = useQuery({ queryKey: ["produtos-admin"], queryFn: () => fetchProdutosAdmin() });
  const { data: leads = [] } = useQuery({ queryKey: ["leads-admin"], queryFn: () => fetchLeadsAdmin() });

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Visão geral da loja. Clique em um cartão para abrir a área correspondente.
      </p>
      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/admin/produtos" search={{ secao: "todos", status: "todos" }} className={cardCls}>
            <CardShell label="Total de produtos" valor={data.length} icon={Package} />
          </Link>
          <Link to="/admin/produtos" search={{ secao: "destaque", status: "todos" }} className={cardCls}>
            <CardShell label="Produtos em Destaque" valor={data.filter((p) => p.secao === "destaque").length} icon={Star} />
          </Link>
          <Link to="/admin/produtos" search={{ secao: "vitrine", status: "todos" }} className={cardCls}>
            <CardShell label="Vitrine Completa" valor={data.filter((p) => p.secao !== "destaque").length} icon={LayoutGrid} />
          </Link>
          <Link to="/admin/produtos" search={{ secao: "todos", status: "ativos" }} className={cardCls}>
            <CardShell label="Produtos ativos" valor={data.filter((p) => p.ativo).length} icon={CheckCircle2} />
          </Link>
          <Link to="/admin/produtos" search={{ secao: "todos", status: "inativos" }} className={cardCls}>
            <CardShell label="Produtos inativos" valor={data.filter((p) => !p.ativo).length} icon={XCircle} />
          </Link>
          <Link to="/admin/leads" className={cardCls}>
            <CardShell label="Leads recebidos" valor={leads.length} icon={Inbox} />
          </Link>
        </div>
      )}
    </div>
  );
}
