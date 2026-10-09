import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, KeyRound, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/alterar-senha")({
  head: () => ({
    meta: [
      { title: "Alterar senha — Painel administrativo" },
      { name: "description", content: "Altere com segurança a senha de acesso ao painel administrativo." },
    ],
  }),
  component: AlterarSenhaAdmin,
});

const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

type CampoSenhaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mostrar: boolean;
  alternar: () => void;
  placeholder: string;
};

function CampoSenha({ label, value, onChange, mostrar, alternar, placeholder }: CampoSenhaProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <span className="relative block">
        <input
          type={mostrar ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls + " pr-11"}
          placeholder={placeholder}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={alternar}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
        >
          {mostrar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  );
}

function AlterarSenhaAdmin() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarAtual, setMostrarAtual] = useState(false);
  const [mostrarNova, setMostrarNova] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const alterarSenha = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setErro(null);

    if (!senhaAtual || !novaSenha || !confirmacao) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (novaSenha.length < 6) {
      setErro("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmacao) {
      setErro("A confirmação da nova senha não confere.");
      return;
    }

    setSalvando(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.email) {
        throw new Error("Não foi possível identificar o usuário conectado.");
      }

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: senhaAtual,
      });

      if (reauthError) {
        throw new Error("A senha atual está incorreta.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (updateError) throw updateError;

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
      setStatus("Senha alterada com sucesso.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível alterar a senha.");
    } finally {
      setSalvando(false);
    }
  };



  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRound className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Alterar senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">Atualize a senha usada para entrar no painel administrativo.</p>
        </div>
      </div>

      <form onSubmit={alterarSenha} className="mt-6 space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <CampoSenha
          label="Senha atual"
          value={senhaAtual}
          onChange={setSenhaAtual}
          mostrar={mostrarAtual}
          alternar={() => setMostrarAtual((v) => !v)}
          placeholder="Digite sua senha atual"
        />
        <CampoSenha
          label="Nova senha"
          value={novaSenha}
          onChange={setNovaSenha}
          mostrar={mostrarNova}
          alternar={() => setMostrarNova((v) => !v)}
          placeholder="Digite a nova senha"
        />
        <CampoSenha
          label="Confirmar nova senha"
          value={confirmacao}
          onChange={setConfirmacao}
          mostrar={mostrarConfirmacao}
          alternar={() => setMostrarConfirmacao((v) => !v)}
          placeholder="Digite novamente a nova senha"
        />

        <p className="text-xs text-muted-foreground">A nova senha deve ter pelo menos 6 caracteres.</p>

        {erro && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{erro}</div>}
        {status && <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">{status}</div>}

        <div className="flex justify-end">
          <Button type="submit" disabled={salvando}>
            <Save className="size-4" />
            {salvando ? "Alterando..." : "Alterar senha"}
          </Button>
        </div>
      </form>
    </div>
  );
}
