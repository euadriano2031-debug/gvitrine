import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { buscarOrganizacaoPorSlug } from "@/lib/saas";
import { LojaVitrine } from "@/components/loja/LojaVitrine";

export const Route = createFileRoute("/loja/$slug/")({
  component: TenantStore,
  head: ({ params }) => ({
    meta: [
      { title: decodeURIComponent(params.slug) },
      { name: "description", content: "Loja virtual." },
    ],
  }),
});

function TenantStore() {
  const { slug } = useParams({ from: "/loja/$slug/" });
  const { data: organization, isLoading } = useQuery({
    queryKey: ["saas-store", slug],
    queryFn: () => buscarOrganizacaoPorSlug(slug),
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando loja...</div>;
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <Store className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Loja não encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">O endereço informado não corresponde a uma loja ativa.</p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Voltar para G-Vitrine
          </Link>
        </div>
      </div>
    );
  }

  return (
    <LojaVitrine
      organizationId={organization.id}
      organizationSlug={organization.slug}
      organizationName={organization.name}
      showAdminLink
    />
  );
}
