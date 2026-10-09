import { createFileRoute } from "@tanstack/react-router";
import { LojaVitrine } from "@/components/loja/LojaVitrine";

export const Route = createFileRoute("/")({
  component: () => <LojaVitrine organizationId={null} organizationSlug={null} showAdminLink />,
});
