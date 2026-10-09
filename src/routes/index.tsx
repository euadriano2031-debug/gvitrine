import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LojaVitrine } from "@/components/loja/LojaVitrine";
import { buscarOrganizacaoPorSlug } from "@/lib/saas";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  // Production content is stored under the primary organization, not the legacy
  // rows with organization_id = NULL. Resolve that organization first so the root
  // page loads the real catalog and its store-specific settings.
  const {
    data: organization,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["saas-store", "ki-vitrine"],
    queryFn: () => buscarOrganizacaoPorSlug("ki-vitrine"),
    staleTime: 60_000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <p className="text-sm text-muted-foreground">Carregando vitrine...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Não foi possível carregar a vitrine</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Verifique a conexão com o Supabase e tente novamente."}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Retain legacy mode only for an installation that has not created its main
  // organization yet; the Supabase database remains the source of truth.
  if (!organization) {
    return <LojaVitrine organizationId={null} organizationSlug={null} showAdminLink />;
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
