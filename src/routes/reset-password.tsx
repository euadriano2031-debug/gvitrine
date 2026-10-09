import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — AP SISTEMAS" },
      { name: "description", content: "Defina uma nova senha para acessar o painel da loja AP SISTEMAS." },
      { property: "og:title", content: "Redefinir senha — AP SISTEMAS" },
      { property: "og:description", content: "Defina uma nova senha de acesso ao painel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setErro(error.message);
      return;
    }
    setOk(true);
    setTimeout(() => void navigate({ to: "/admin" }), 1200);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={salvar} className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-8">
        <h1 className="text-2xl font-bold">Nova senha</h1>
        <input
          type="password"
          required
          minLength={6}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Nova senha"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {erro && <p className="text-xs text-destructive">{erro}</p>}
        {ok && <p className="text-xs text-primary">Senha alterada! Redirecionando...</p>}
        <button className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Salvar</button>
      </form>
    </div>
  );
}
