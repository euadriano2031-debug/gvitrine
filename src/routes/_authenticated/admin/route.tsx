import { createFileRoute, Link, Outlet, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, Building2, DatabaseBackup, KeyRound, LayoutDashboard, LogOut, Package, PlayCircle, LifeBuoy, Store, Inbox, Sparkles, Sun, Moon, Tags, Menu, Paintbrush, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminRole } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { adminHeaderPadrao, fetchConfig, type AdminHeaderConfig } from "@/lib/loja";
import { obterStatusCicloBackup } from "@/lib/backup";
import { getActiveOrganizationId, getActiveOrganizationSlug, setActiveOrganization, tenantStorePath } from "@/lib/saas";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const itens = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: Tags },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/marca", label: "Marca", icon: Sparkles },
  { to: "/admin/banner", label: "Banner de Vídeo", icon: PlayCircle },
  { to: "/admin/ajuda", label: "Imagem de Ajuda", icon: LifeBuoy },
  { to: "/admin/aparencia", label: "Aparência do painel", icon: Paintbrush },
  { to: "/admin/backup", label: "Backup da Loja", icon: DatabaseBackup },
  { to: "/admin/alterar-senha", label: "Alterar senha", icon: KeyRound },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const garantirAdmin = ensureAdminRole;
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [administradorGlobal, setAdministradorGlobal] = useState(false);
  const [organizacoes, setOrganizacoes] = useState<Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    logo_url: string | null;
    primary_color: string;
    status: string;
  }>>([]);
  const { data: cabecalho = adminHeaderPadrao } = useQuery<AdminHeaderConfig>({
    queryKey: ["cfg", "admin_cabecalho"],
    queryFn: () => fetchConfig("admin_cabecalho", adminHeaderPadrao),
  });

  useEffect(() => {
    const saved = window.localStorage.getItem("theme");
    const inicial = saved === "light" || saved === "dark" ? saved : "light";
    setTheme(inicial);
    document.documentElement.classList.toggle("dark", inicial === "dark");
  }, []);

  const alternarTema = () => {
    const proximo = theme === "dark" ? "light" : "dark";
    setTheme(proximo);
    document.documentElement.classList.toggle("dark", proximo === "dark");
    window.localStorage.setItem("theme", proximo);
  };

  useEffect(() => {
    void garantirAdmin()
      .then(async ({ admin, organizations }) => {
        const lojas = organizations ?? [];
        setAdministradorGlobal(admin);
        if (!admin && lojas.length === 0) {
          await supabase.auth.signOut();
          setActiveOrganization(null);
          await navigate({ to: "/auth", replace: true });
          return;
        }

        setOrganizacoes(lojas);

        const activeId = getActiveOrganizationId();
        const lojaAtiva = lojas.find((item) => item.id === activeId) ?? lojas[0];
        if (lojaAtiva) setActiveOrganization(lojaAtiva);
        else setActiveOrganization(null);

        await queryClient.invalidateQueries();
        setVerificandoAcesso(false);
      })
      .catch(async () => {
        await supabase.auth.signOut();
        setActiveOrganization(null);
        await navigate({ to: "/auth", replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const sair = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setActiveOrganization(null);
    router.invalidate();
    await navigate({ to: "/auth", replace: true });
  };

  if (verificandoAcesso) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Verificando acesso...</div>;
  }

  return (
    <SidebarProvider>
      <AdminNavigation
        theme={theme}
        alternarTema={alternarTema}
        sair={sair}
        cabecalho={cabecalho}
      />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="size-11 md:size-10 [&_svg]:size-6 md:[&_svg]:size-5" style={{ backgroundColor: cabecalho.menu_fundo_cor, color: cabecalho.menu_icone_cor }} aria-label="Abrir ou recolher menu">
              <Menu />
            </SidebarTrigger>
            <div className="min-w-0">
              <p className="truncate font-bold" style={{ color: theme === "dark" ? "#ffffff" : "#000000", fontSize: `${cabecalho.titulo_tamanho}px` }}>{cabecalho.titulo}</p>
              <p className="hidden text-xs text-muted-foreground sm:block">Gerencie sua vitrine</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <a
              href={getActiveOrganizationSlug() ? tenantStorePath(getActiveOrganizationSlug() as string) : "/"}
              aria-label="Ver minha loja"
              title="Ver minha loja"
              className="flex size-9 shrink-0 items-center justify-center rounded-md border border-transparent p-0 shadow-sm transition hover:opacity-90 md:size-8"
              style={{ backgroundColor: cabecalho.loja_fundo_cor }}
            >
              <Store className="size-4" style={{ color: cabecalho.loja_icone_cor }} />
              <span className="sr-only">{cabecalho.loja_texto}</span>
            </a>

            <button
              type="button"
              onClick={alternarTema}
              className="flex size-9 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm transition hover:bg-muted md:size-8"
              aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <button
              type="button"
              onClick={() => void sair()}
              className="flex size-9 items-center justify-center rounded-md border border-border bg-card text-destructive shadow-sm transition hover:bg-destructive/10 md:size-8"
              aria-label="Sair do painel administrativo"
              title="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>
        <main className="w-full flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">
            <BackupSafetyAlert />
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function BackupSafetyAlert() {
  const organizationId = getActiveOrganizationId();
  const { data } = useQuery({
    queryKey: ["backup-safety", organizationId],
    queryFn: () => obterStatusCicloBackup(organizationId),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const dias = data?.diasRestantes ?? null;
  if (dias === null || dias > 10 || dias < 0) return null;

  const mensagem =
    dias === 10
      ? "Faltam 10 dias para o encerramento do ciclo de backups."
      : dias === 0
        ? "ATENÇÃO: o ciclo de 60 dias chega ao fim hoje."
        : `Faltam ${dias} dias para o encerramento do ciclo de backups.`;

  return (
    <Link
      to="/admin/backup"
      className="mb-5 flex w-full items-center gap-4 rounded-2xl border-2 border-destructive bg-destructive/10 p-5 text-destructive shadow-sm transition hover:bg-destructive/15"
    >
      <AlertTriangle className="size-10 shrink-0 animate-pulse" />
      <div className="min-w-0">
        <p className="text-lg font-black uppercase tracking-wide sm:text-xl">{mensagem}</p>
        <p className="mt-1 text-sm font-semibold">
          Faça um backup manual da loja por segurança antes da virada do ciclo.
        </p>
      </div>
    </Link>
  );
}

function AdminNavigation({
  theme,
  alternarTema,
  sair,
  cabecalho
}: {
  theme: "light" | "dark";
  alternarTema: () => void;
  sair: () => Promise<void>;
  cabecalho: AdminHeaderConfig;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { setOpenMobile, state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <div className="flex h-11 items-center gap-3 overflow-hidden px-1">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: cabecalho.sidebar_fundo_cor, color: cabecalho.sidebar_icone_cor }}>
            {cabecalho.sidebar_icone === "building" ? <Building2 className="size-5" /> : cabecalho.sidebar_icone === "shopping-bag" ? <ShoppingBag className="size-5" /> : <Store className="size-5" />}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-bold" style={{ color: theme === "dark" ? "#ffffff" : "#000000", fontSize: `${cabecalho.sidebar_titulo_tamanho}px` }}>{cabecalho.sidebar_titulo}</p>
              <p className="truncate" style={{ color: theme === "dark" ? "#ffffff" : "#000000", fontSize: `${cabecalho.sidebar_subtitulo_tamanho}px` }}>{cabecalho.sidebar_subtitulo}</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itens.map((item) => {
                const ativo = item.to === "/admin" ? pathname === item.to : pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={ativo} tooltip={item.label} size="lg">
                      <Link to={item.to} onClick={() => setOpenMobile(false)}>
                        <item.icon /> <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Minha loja">
              <a href={getActiveOrganizationSlug() ? tenantStorePath(getActiveOrganizationSlug() as string) : "/"} onClick={() => setOpenMobile(false)}>
                <Store /> <span>Minha loja</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={theme === "dark" ? "Modo claro" : "Modo escuro"} onClick={alternarTema}>
              {theme === "dark" ? <Sun /> : <Moon />} <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sair" onClick={() => void sair()}>
              <LogOut /> <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
