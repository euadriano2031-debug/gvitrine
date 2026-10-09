import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/saas")({
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});
