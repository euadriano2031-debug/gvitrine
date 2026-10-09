import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminRole } from "@/lib/admin.functions";
import { Lock, Mail, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { garantirLojaDoUsuario, setActiveOrganization } from "@/lib/saas";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Login do Painel — AP SISTEMAS" },
      { name: "description", content: "Acesse seu painel para administrar sua própria loja." },
      { property: "og:title", content: "Login do Painel — AP SISTEMAS" },
      { property: "og:description", content: "Acesse seu painel para administrar sua própria loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const garantirAdmin = useServerFn(ensureAdminRole);
  const [nomeLoja, setNomeLoja] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modo, setModo] = useState<"login" | "cadastro" | "recuperar">("login");
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const prepararAcesso = useCallback(async () => {
    let acesso = await garantirAdmin();

    // Novo administrador: cria automaticamente sua única loja e recebe
    // a mesma estrutura inicial da G-Vitrine.
    if (!acesso.admin && !acesso.organizations?.length) {
      const loja = await garantirLojaDoUsuario();
      setActiveOrganization(loja);
      acesso = await garantirAdmin();
    }

    if (!acesso.admin && acesso.organizations?.[0]) {
      setActiveOrganization(acesso.organizations[0]);
    }

    if (!acesso.admin && !acesso.organizations?.length) {
      throw new Error("Não foi possível preparar sua loja. Tente novamente.");
    }

    await navigate({ to: "/admin", replace: true });
  }, [garantirAdmin, navigate]);

  useEffect(() => {
    let ativo = true;

    const verificarSessao = async () => {
      const { data } = await supabase.auth.getSession();
      if (!ativo || !data.session) return;

      try {
        await prepararAcesso();
      } catch {
        if (ativo) await supabase.auth.signOut();
      }
    };

    void verificarSessao();

    return () => {
      ativo = false;
    };
  }, [prepararAcesso]);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setMsg(null);
    setCarregando(true);

    try {
      if (modo === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMsg("Enviamos um e-mail com o link para redefinir sua senha.");
        return;
      }

      if (modo === "cadastro") {
        const nomeNormalizado = nomeLoja.trim();
        if (!nomeNormalizado) {
          throw new Error("Informe o nome da sua loja.");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: nomeNormalizado,
              store_name: nomeNormalizado,
            },
          },
        });

        if (error) throw error;

        // Quando a confirmação de e-mail está ativada, a sessão ainda não
        // existe. A loja será criada automaticamente no primeiro login.
        if (!data.session) {
          setMsg(
            "Conta criada. Confirme seu e-mail e depois entre novamente. Sua loja será criada automaticamente.",
          );
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (error) throw error;
      }

      await prepararAcesso();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {modo === "recuperar"
            ? "Informe seu e-mail para recuperar a senha."
            : "Entre ou crie sua conta para administrar sua própria loja."}
        </p>

        <form onSubmit={submeter} className="mt-6 space-y-4">
          {modo === "cadastro" && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Nome da loja</span>
              <input
                type="text"
                required
                maxLength={80}
                value={nomeLoja}
                onChange={(e) => setNomeLoja(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="Ex.: SAM VITRINE"
              />
              <span className="mt-1 block text-[11px] text-muted-foreground">
                Este nome será usado para criar o endereço da sua loja.
              </span>
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">E-mail</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
                placeholder="seu@email.com"
              />
            </div>
          </label>

          {modo !== "recuperar" && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Senha</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
                  placeholder="••••••••"
                />
              </div>
            </label>
          )}

          {erro && <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{erro}</p>}
          {msg && <p className="rounded-md bg-primary/10 p-2 text-xs text-primary">{msg}</p>}

          <Button type="submit" disabled={carregando} className="w-full">
            <LogIn className="h-4 w-4" />
            {carregando
              ? "Aguarde..."
              : modo === "cadastro"
                ? "Criar minha loja"
                : modo === "recuperar"
                  ? "Enviar link"
                  : "Entrar"}
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => {
              setModo(modo === "cadastro" ? "login" : "cadastro");
              setErro(null);
              setMsg(null);
            }}
            className="hover:text-primary"
          >
            {modo === "cadastro" ? "Já tenho conta" : "Criar conta de administrador"}
          </button>
          <button
            type="button"
            onClick={() => {
              setModo("recuperar");
              setErro(null);
              setMsg(null);
            }}
            className="hover:text-primary"
          >
            Esqueci minha senha
          </button>
        </div>
      </div>
    </div>
  );
}
