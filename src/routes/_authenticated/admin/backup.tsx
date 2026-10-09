import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArchiveRestore,
  CheckCircle2,
  Clock3,
  DatabaseBackup,
  Download,
  FileArchive,
  History,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buscarPayloadBackup,
  baixarArquivoBackup,
  criarArquivoBackup,
  criarBackupServidor,
  excluirBackupServidor,
  formatarDataHoraBackup,
  lerArquivoBackup,
  listarBackups,
  obterStatusCicloBackup,
  resumoBackup,
  restaurarBackup,
} from "@/lib/backup";
import { getActiveOrganizationId } from "@/lib/saas";
import type { BackupListItem } from "@/lib/backup";

export const Route = createFileRoute("/_authenticated/admin/backup")({
  head: () => ({
    meta: [
      { title: "Backup / Exportar e Importar — Painel" },
      { name: "description", content: "Backup total, exportação, importação e restauração da loja." },
    ],
  }),
  component: BackupPage,
});

const origemLabel: Record<string, string> = {
  automatico: "Automático",
  manual: "Manual",
  pre_restauracao: "Antes da restauração",
};

function BackupPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(() => getActiveOrganizationId());
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncOrganization = () => setOrganizationId(getActiveOrganizationId());
    syncOrganization();
    window.addEventListener("saas-organization-changed", syncOrganization);
    return () => window.removeEventListener("saas-organization-changed", syncOrganization);
  }, []);
  const inputRef = useRef<HTMLInputElement>(null);
  const [processando, setProcessando] = useState<"exportar" | "ler" | "restaurar" | "excluir" | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [arquivoNome, setArquivoNome] = useState("");
  const [backupImportado, setBackupImportado] = useState<Awaited<ReturnType<typeof lerArquivoBackup>> | null>(null);
  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false);
  const [fazerBackupAntes, setFazerBackupAntes] = useState(true);
  const [backupParaExcluir, setBackupParaExcluir] = useState<BackupListItem | null>(null);

  const abrirSeletorArquivo = () => {
    if (processando !== null) return;
    const input = inputRef.current;
    if (!input) {
      setMensagem({ tipo: "erro", texto: "Não foi possível abrir o seletor de arquivos. Recarregue o painel e tente novamente." });
      return;
    }
    // Permite selecionar novamente o mesmo arquivo depois de uma validação com erro.
    input.value = "";
    input.click();
  };

  const backups = useQuery({
    queryKey: ["loja-backups", organizationId],
    queryFn: () => listarBackups(organizationId),
    enabled: Boolean(organizationId),
  });

  const ciclo = useQuery({
    queryKey: ["backup-cycle", organizationId],
    queryFn: () => obterStatusCicloBackup(organizationId),
    enabled: Boolean(organizationId),
    refetchInterval: 60_000,
  });

  const exportar = async () => {
    setProcessando("exportar");
    setMensagem(null);
    try {
      const backup = await criarBackupServidor(organizationId, false);
      const loja = String(backup.payload.organization?.name ?? "Loja");
      const arquivo = await criarArquivoBackup(backup.payload, {
        checksumServidor: backup.checksum,
        nomeLoja: loja,
      });
      const filename = baixarArquivoBackup(arquivo.blob, loja, backup.gerado_em);
      setMensagem({
        tipo: "ok",
        texto: `Backup total criado e baixado: ${filename}`,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["loja-backups", organizationId] }),
        queryClient.invalidateQueries({ queryKey: ["backup-cycle", organizationId] }),
      ]);
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto: error instanceof Error ? error.message : "Não foi possível gerar o backup.",
      });
    } finally {
      setProcessando(null);
    }
  };

  const selecionarArquivo = async (file: File | undefined) => {
    if (!file) return;
    setProcessando("ler");
    setMensagem(null);
    setArquivoNome(file.name);
    try {
      const payload = await lerArquivoBackup(file);
      if (payload.organization_id !== organizationId) {
        throw new Error("Este backup pertence a outra loja. A restauração foi bloqueada por segurança.");
      }
      setBackupImportado(payload);
      setMensagem({
        tipo: "ok",
        texto: "Backup validado com sucesso. Confirme a restauração.",
      });
    } catch (error) {
      setBackupImportado(null);
      setMensagem({
        tipo: "erro",
        texto: error instanceof Error ? error.message : "Arquivo de backup inválido.",
      });
    } finally {
      setProcessando(null);
    }
  };

  const atualizarDados = async () => {
    if (processando !== null) return;
    setMensagem(null);
    try {
      await Promise.all([backups.refetch(), ciclo.refetch()]);
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto: error instanceof Error ? error.message : "Não foi possível atualizar os dados do backup.",
      });
    }
  };

  const iniciarRestauracao = () => {
    if (!backupImportado) return;
    setConfirmacaoAberta(true);
  };

  const confirmarRestauracao = async () => {
    if (!backupImportado) return;
    setConfirmacaoAberta(false);
    setProcessando("restaurar");
    setMensagem(null);

    try {
      let backupPrevioId = "";
      if (fazerBackupAntes) {
        const backupPrevio = await criarBackupServidor(organizationId, true);
        backupPrevioId = backupPrevio.id;
      }

      const resultado = await restaurarBackup(backupImportado, organizationId);
      setMensagem({
        tipo: "ok",
        texto: `Restauração concluída: ${resultado.produtos} produtos, ${resultado.categorias} categorias e ${resultado.configuracoes} configurações restaurados.${backupPrevioId ? ` Backup de segurança criado antes da restauração: ${backupPrevioId}.` : ""}`,
      });

      setBackupImportado(null);
      setArquivoNome("");
      if (inputRef.current) inputRef.current.value = "";
      await queryClient.invalidateQueries();
      await queryClient.invalidateQueries({ queryKey: ["loja-backups", organizationId] });
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto: error instanceof Error ? error.message : "A restauração não pôde ser concluída.",
      });
    } finally {
      setProcessando(null);
    }
  };

  const restaurarBackupSalvo = async (id: string) => {
    setProcessando("restaurar");
    setMensagem(null);

    try {
      const existente = await buscarPayloadBackup(id, organizationId);
      setBackupImportado(existente.payload);
      setArquivoNome(`Backup armazenado — ${formatarDataHoraBackup(existente.gerado_em)}`);
      setConfirmacaoAberta(true);
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto: error instanceof Error ? error.message : "Não foi possível carregar o backup.",
      });
    } finally {
      setProcessando(null);
    }
  };

  const atual = backupImportado ? resumoBackup(backupImportado) : null;

  const iniciarExclusao = (backup: BackupListItem) => {
    if (processando !== null) return;
    setBackupParaExcluir(backup);
  };

  const confirmarExclusao = async () => {
    if (!backupParaExcluir || !organizationId) return;

    setProcessando("excluir");
    setMensagem(null);

    try {
      await excluirBackupServidor(backupParaExcluir.id, organizationId);
      setBackupParaExcluir(null);
      setMensagem({
        tipo: "ok",
        texto: "Backup excluído com sucesso do histórico da loja e do banco de dados do Supabase.",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["loja-backups", organizationId] }),
        queryClient.invalidateQueries({ queryKey: ["backup-cycle", organizationId] }),
      ]);
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto: error instanceof Error ? error.message : "Não foi possível excluir o backup.",
      });
    } finally {
      setProcessando(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">BACKUP / EXPORTAR E IMPORTAR</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Backup total e restauração exclusiva desta loja. O pacote usa ZIP com JSON interno, manifesto e
          referências de mídia para ficar portátil e verificável.
        </p>
      </div>

      {mensagem && (
        <div
          className={
            mensagem.tipo === "ok"
              ? "flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300"
              : "flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          }
          role="status"
        >
          {mensagem.tipo === "ok" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <span className="whitespace-pre-line">{mensagem.texto}</span>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Proteção automática</p>
            <h2 className="mt-1 text-xl font-bold">Ciclo de backup da loja</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              O banco verifica diariamente, mas cria o backup automático somente quando completar 7 dias.
              Ao completar 60 dias, o ciclo inteiro é apagado e um novo ciclo começa automaticamente.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-4" /> Automação ativa
            </span>
            <Button
              type="button"
              onClick={() => void exportar()}
              disabled={processando !== null || !organizationId}
              className="h-11 gap-2 bg-red-600 px-4 font-black text-white shadow-sm hover:bg-red-700"
            >
              {processando === "exportar" ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <DatabaseBackup className="size-5" />
              )}
              {processando === "exportar" ? "CRIANDO BACKUP..." : "CRIAR BACKUP TOTAL AGORA"}
            </Button>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm font-medium text-red-700 dark:text-red-300">
          Este backup manual pode ser criado <strong>a qualquer hora</strong>, quantas vezes for necessário,
          sem esperar os 7 dias do backup automático. Ele gera uma cópia completa e também baixa o arquivo
          para o computador do administrador.
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <span className="text-xs text-muted-foreground">Backups automáticos</span>
            <strong className="mt-1 block text-2xl">{ciclo.data?.automaticos ?? 0}</strong>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <span className="text-xs text-muted-foreground">Fim do ciclo de 60 dias</span>
            <strong className="mt-1 block text-sm">
              {ciclo.data?.proximaDataLimite ? formatarDataHoraBackup(ciclo.data.proximaDataLimite) : "Aguardando primeiro backup"}
            </strong>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <span className="text-xs text-muted-foreground">Próximo backup</span>
            <strong className="mt-1 block text-sm">
              {(() => {
                const automatico = (backups.data ?? []).find((item) => item.origem === "automatico");
                if (!automatico) return "Na próxima execução automática";
                const next = new Date(new Date(automatico.gerado_em).getTime() + 7 * 24 * 60 * 60 * 1000);
                return formatarDataHoraBackup(next.toISOString());
              })()}
            </strong>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Download className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">BACKUP TOTAL MANUAL</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Crie uma cópia completa da loja a qualquer momento, independente do agendamento automático.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm">
            {[
              "Produtos e todos os campos atuais",
              "Categorias, ordem e status",
              "Configurações, aparência, textos e cores",
              "Botões, visibilidade, ordem e personalizações",
              "Compartilhamento, imagens e vídeos por referência",
              "Leads e identidade/configurações da loja",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <Button
            type="button"
            onClick={() => void exportar()}
            disabled={processando !== null || !organizationId}
            className="mt-6 h-12 w-full gap-2 text-base font-bold"
          >
            {processando === "exportar" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <DatabaseBackup className="size-5" />
            )}
            {processando === "exportar" ? "Gerando backup..." : "CRIAR E BAIXAR BACKUP TOTAL"}
          </Button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Upload className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">IMPORTAR BACKUP</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecione um arquivo <strong>.gvit-backup.zip</strong> ou JSON compatível.
              </p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".zip,.gvit-backup.zip,.json,application/zip,application/json"
            className="hidden"
            onChange={(event) => void selecionarArquivo(event.target.files?.[0])}
          />

          <Button
            type="button"
            variant="outline"
            onClick={abrirSeletorArquivo}
            disabled={processando !== null}
            className="mt-6 h-12 w-full gap-2 text-base font-bold"
          >
            {processando === "ler" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <FileArchive className="size-5" />
            )}
            {processando === "ler" ? "Validando arquivo..." : "SELECIONAR BACKUP"}
          </Button>

          {arquivoNome && (
            <p className="mt-3 break-all rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              Arquivo selecionado: <strong>{arquivoNome}</strong>
            </p>
          )}

          {atual && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-bold">{atual.loja}</p>
              <p className="mt-1 text-xs text-muted-foreground">Slug: {atual.slug || "não informado"}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <span><strong>{atual.produtos}</strong> produtos</span>
                <span><strong>{atual.categorias}</strong> categorias</span>
                <span><strong>{atual.configuracoes}</strong> configurações</span>
                <span><strong>{atual.leads}</strong> leads</span>
              </div>
              <Button
                type="button"
                onClick={iniciarRestauracao}
                disabled={processando !== null}
                className="mt-4 h-11 w-full gap-2 font-bold"
              >
                <ArchiveRestore className="size-5" />
                RESTAURAR ESTE BACKUP
              </Button>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <History className="size-5 text-primary" /> Histórico de backups desta loja
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ciclo independente da loja: backup automático a cada 7 dias e limpeza do ciclo ao completar 60 dias.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void atualizarDados()}
            disabled={backups.isFetching || ciclo.isFetching || processando !== null}
            className="gap-2"
          >
            {backups.isFetching || ciclo.isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
            Atualizar
          </Button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-3">Data / hora</th>
                <th className="px-3 py-3">Origem</th>
                <th className="px-3 py-3">Expira</th>
                <th className="px-3 py-3">Checksum</th>
                <th className="px-3 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {backups.isLoading && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                    Carregando histórico...
                  </td>
                </tr>
              )}

              {!backups.isLoading && (backups.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                    Nenhum backup registrado ainda.
                  </td>
                </tr>
              )}

              {(backups.data ?? []).map((backup) => (
                <tr key={backup.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-3 font-medium">{formatarDataHoraBackup(backup.gerado_em)}</td>
                  <td className="px-3 py-3">{origemLabel[backup.origem] ?? backup.origem}</td>
                  <td className="px-3 py-3 text-muted-foreground">{formatarDataHoraBackup(backup.expira_em)}</td>
                  <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground">{backup.checksum.slice(0, 18)}…</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void restaurarBackupSalvo(backup.id)}
                        disabled={processando !== null}
                        className="gap-2"
                      >
                        <ArchiveRestore className="size-4" /> Restaurar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => iniciarExclusao(backup)}
                        disabled={processando !== null}
                        className="gap-2 border-red-500/40 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-400/40 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                        aria-label="Excluir backup"
                        title="Excluir backup"
                      >
                        {processando === "excluir" && backupParaExcluir?.id === backup.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 text-xs text-muted-foreground sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>O agendamento é executado no banco, sem depender da abertura do painel.</span>
          </div>
          <div className="flex items-start gap-2">
            <DatabaseBackup className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>Os dados são isolados pelo ID da loja para impedir mistura entre administradores.</span>
          </div>
          <div className="flex items-start gap-2">
            <FileArchive className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>ZIP portátil: manifesto + backup.json + referências de mídia.</span>
          </div>
        </div>
      </section>

      {backupParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-red-500/30 bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600">
                <Trash2 className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Excluir backup definitivamente?</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Esta ação removerá o backup selecionado do histórico desta loja e excluirá o registro e o
                  conteúdo armazenado na tabela de backups do banco de dados do Supabase. A exclusão não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm sm:grid-cols-3">
              <div>
                <span className="block text-xs text-muted-foreground">Data / hora</span>
                <strong>{formatarDataHoraBackup(backupParaExcluir.gerado_em)}</strong>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Origem</span>
                <strong>{origemLabel[backupParaExcluir.origem] ?? backupParaExcluir.origem}</strong>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Checksum</span>
                <strong className="font-mono text-[11px]">{backupParaExcluir.checksum.slice(0, 18)}…</strong>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBackupParaExcluir(null)}
                disabled={processando === "excluir"}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void confirmarExclusao()}
                disabled={processando === "excluir"}
                className="gap-2 bg-red-600 font-bold text-white hover:bg-red-700"
              >
                {processando === "excluir" ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-5" />}
                {processando === "excluir" ? "EXCLUINDO..." : "EXCLUIR BACKUP"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmacaoAberta && backupImportado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                <AlertTriangle className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Confirmar restauração da loja</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  A restauração substituirá os dados atuais da loja pelos dados deste backup.
                  Produtos, categorias, configurações, textos, aparência e demais dados restauráveis serão
                  reconstruídos conforme o arquivo.
                </p>
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <input
                type="checkbox"
                checked={fazerBackupAntes}
                onChange={(event) => setFazerBackupAntes(event.target.checked)}
                className="mt-1 size-4 accent-primary"
              />
              <span>
                <strong>Fazer backup antes de restaurar</strong>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Recomendado. Cria uma cópia de segurança dos dados atuais antes da substituição.
                </span>
              </span>
            </label>

            <div className="mt-5 grid gap-3 rounded-xl border border-border p-4 text-sm sm:grid-cols-4">
              <div><span className="block text-xs text-muted-foreground">Loja</span><strong>{String(backupImportado.organization?.name ?? "Loja")}</strong></div>
              <div><span className="block text-xs text-muted-foreground">Produtos</span><strong>{backupImportado.produtos.length}</strong></div>
              <div><span className="block text-xs text-muted-foreground">Categorias</span><strong>{backupImportado.categorias.length}</strong></div>
              <div><span className="block text-xs text-muted-foreground">Configurações</span><strong>{backupImportado.configuracoes.length}</strong></div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setConfirmacaoAberta(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void confirmarRestauracao()}
                className="gap-2 font-bold"
              >
                <ArchiveRestore className="size-5" />
                Confirmar restauração
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
