import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { fetchConfig, faviconPadrao, type FaviconConfig } from "../lib/loja";
import { obterCompartilhamentoPublico } from "../lib/compartilhamento.functions";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: async () => {
    const padrao = {
      titulo: "G-Vitrine",
      descricao: "Loja digital com produtos e soluções prontas para você.",
      siteUrl: "https://g-vitrine.lovable.app/",
      imagem: "",
    };

    try {
      const compartilhamento = await obterCompartilhamentoPublico();
      const titulo = compartilhamento.titulo || padrao.titulo;
      const descricao = compartilhamento.descricao || padrao.descricao;
      const siteUrl = compartilhamento.site_url || padrao.siteUrl;
      const imagem = compartilhamento.imagem_url || "";

      return {
        meta: [
          { charSet: "utf-8" },
          { name: "viewport", content: "width=device-width, initial-scale=1" },
          { title: titulo },
          { name: "description", content: descricao },
          { property: "og:title", content: titulo },
          { property: "og:description", content: descricao },
          { property: "og:type", content: "website" },
          { property: "og:url", content: siteUrl },
          ...(imagem ? [{ property: "og:image", content: imagem }] : []),
          { property: "og:image:alt", content: titulo },
          { name: "twitter:card", content: imagem ? "summary_large_image" : "summary" },
          { name: "twitter:title", content: titulo },
          { name: "twitter:description", content: descricao },
          ...(imagem ? [{ name: "twitter:image", content: imagem }] : []),
        ],
        links: [
          {
            rel: "stylesheet",
            href: appCss,
          },
        ],
      };
    } catch (error) {
      console.error("Falha ao carregar metadados de compartilhamento:", error);

      return {
        meta: [
          { charSet: "utf-8" },
          { name: "viewport", content: "width=device-width, initial-scale=1" },
          { title: padrao.titulo },
          { name: "description", content: padrao.descricao },
          { property: "og:title", content: padrao.titulo },
          { property: "og:description", content: padrao.descricao },
          { property: "og:type", content: "website" },
          { property: "og:url", content: padrao.siteUrl },
          { name: "twitter:card", content: "summary" },
        ],
        links: [
          {
            rel: "stylesheet",
            href: appCss,
          },
        ],
      };
    }
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [favicon, setFavicon] = useState<FaviconConfig>(faviconPadrao);

  useEffect(() => {
    let ativo = true;
    const atualizar = (event?: Event) => {
      const custom = event as CustomEvent<{ url?: string }> | undefined;
      if (custom?.detail?.url !== undefined) setFavicon({ url: custom.detail.url });
    };

    void fetchConfig("favicon", faviconPadrao)
      .then((cfg) => {
        if (ativo) setFavicon(cfg);
      })
      .catch((error) => {
        console.error("Falha ao carregar favicon configurado:", error);
        if (ativo) setFavicon(faviconPadrao);
      });
    window.addEventListener("favicon-updated", atualizar);

    return () => {
      ativo = false;
      window.removeEventListener("favicon-updated", atualizar);
    };
  }, []);

  useEffect(() => {
    const url = favicon.url?.trim() || faviconPadrao.url;
    const existente = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    existente.forEach((el) => el.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    link.href = url;
    const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
    const tipos: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
      ico: "image/x-icon",
    };
    if (ext && tipos[ext]) link.type = tipos[ext];
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [favicon.url]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
