import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import {
  AlertTriangle, ArrowRight, CalendarClock, Check, CheckCircle2, CircleDollarSign,
  Clock3, Download, FileSpreadsheet, Filter, GripVertical, LayoutGrid, List,
  Mail, MessageSquare, NotebookPen, Phone, Plus, Search, Send, Trash2,
  TrendingUp, Users, X, Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  atualizarLeadCRM, buscarAtividadesCRM, concluirAtividadeCRM, criarAtividadeCRM,
  criarLeadManualCRM, excluirLead, fetchLeadsAdmin, fetchProdutosAdmin, formatarData, leadsParaCsv,
  whatsappLeadLink, type CRMActivity, type CRMActivityType, type CRMPriority,
  type CRMStage, type LeadComProduto,
} from "@/lib/loja";
import { getActiveOrganizationId } from "@/lib/saas";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  head: () => ({ meta: [
    { title: "CRM e Kanban — Leads" },
    { name: "description", content: "CRM da loja com funil de vendas, acompanhamento e atividades." },
  ] }),
  component: LeadsAdmin,
});

const STAGES: Array<{ id: CRMStage; title: string; short: string; color: string; dot: string }> = [
  { id: "novo", title: "Novos leads", short: "Entrada", color: "border-sky-500/40", dot: "bg-sky-500" },
  { id: "contato", title: "Contato iniciado", short: "Contato", color: "border-violet-500/40", dot: "bg-violet-500" },
  { id: "qualificado", title: "Qualificados", short: "Qualificado", color: "border-cyan-500/40", dot: "bg-cyan-500" },
  { id: "proposta", title: "Proposta enviada", short: "Proposta", color: "border-amber-500/40", dot: "bg-amber-500" },
  { id: "negociacao", title: "Em negociação", short: "Negociação", color: "border-orange-500/40", dot: "bg-orange-500" },
  { id: "ganho", title: "Vendas ganhas", short: "Ganho", color: "border-emerald-500/40", dot: "bg-emerald-500" },
  { id: "perdido", title: "Perdidos", short: "Perdido", color: "border-rose-500/40", dot: "bg-rose-500" },
];
const PRIORITIES: Array<{ id: CRMPriority; title: string; className: string }> = [
  { id: "baixa", title: "Baixa", className: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  { id: "media", title: "Média", className: "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200" },
  { id: "alta", title: "Alta", className: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  { id: "urgente", title: "Urgente", className: "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200" },
];
const ACTIVITY_TYPES: Array<{ id: CRMActivityType; title: string }> = [
  { id: "nota", title: "Nota" },
  { id: "ligacao", title: "Ligação" },
  { id: "email", title: "E-mail" },
  { id: "reuniao", title: "Reunião" },
  { id: "tarefa", title: "Tarefa / retorno" },
];
const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
const buttonPrimary = "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
const buttonSecondary = "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

type LeadDraft = { crm_stage: CRMStage; crm_priority: CRMPriority; crm_notes: string; crm_follow_up_at: string; crm_estimated_value: string; crm_final_value: string };
type NewLeadDraft = { nome: string; email: string; telefone: string; mensagem: string; crm_stage: CRMStage; crm_priority: CRMPriority; produto_id: string; crm_estimated_value: string };
type ActivityDraft = { type: CRMActivityType; title: string; description: string; due_at: string };
const newLeadDefault: NewLeadDraft = { nome: "", email: "", telefone: "", mensagem: "", crm_stage: "novo", crm_priority: "media", produto_id: "", crm_estimated_value: "" };
const activityDefault: ActivityDraft = { type: "nota", title: "", description: "", due_at: "" };

function normalizeStage(lead: LeadComProduto): CRMStage {
  const stage = lead.crm_stage;
  if (STAGES.some((item) => item.id === stage)) return stage as CRMStage;
  const legacy = (lead.status ?? "").toLowerCase();
  if (["contato", "contactado", "contacted", "em_contato"].includes(legacy)) return "contato";
  if (["qualificado", "qualified"].includes(legacy)) return "qualificado";
  if (["proposta", "proposal"].includes(legacy)) return "proposta";
  if (["negociacao", "negociação", "negotiation"].includes(legacy)) return "negociacao";
  if (["ganho", "convertido", "won", "fechado"].includes(legacy)) return "ganho";
  if (["perdido", "lost", "desqualificado"].includes(legacy)) return "perdido";
  return "novo";
}
function normalizePriority(priority: string | null | undefined): CRMPriority {
  return PRIORITIES.some((item) => item.id === priority) ? priority as CRMPriority : "media";
}
function stageInfo(stage: CRMStage) { return STAGES.find((item) => item.id === stage) ?? STAGES[0]; }
const STAGE_PROBABILITY: Record<CRMStage, number> = {
  novo: 0.10, contato: 0.20, qualificado: 0.40, proposta: 0.60,
  negociacao: 0.80, ganho: 1, perdido: 0,
};
function stageProbability(stage: CRMStage) { return STAGE_PROBABILITY[stage] ?? 0; }
function priorityInfo(priority: string | null | undefined) { return PRIORITIES.find((item) => item.id === normalizePriority(priority)) ?? PRIORITIES[1]; }
function currency(value: number | string | null | undefined) {
  const n = Number(value);
  if (!Number.isFinite(n) || value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(n);
}
function localDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
function dateLabel(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function isOverdue(value: string | null | undefined) { return Boolean(value && new Date(value).getTime() < Date.now()); }
function isClosedStage(stage: CRMStage) { return stage === "ganho" || stage === "perdido"; }
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "?"; }
function activityIcon(type: string) {
  if (type === "ligacao") return <Phone className="h-4 w-4" />;
  if (type === "email") return <Mail className="h-4 w-4" />;
  if (type === "reuniao") return <Users className="h-4 w-4" />;
  if (type === "tarefa") return <CheckCircle2 className="h-4 w-4" />;
  if (type === "etapa") return <TrendingUp className="h-4 w-4" />;
  return <NotebookPen className="h-4 w-4" />;
}

function LeadsAdmin() {
  const qc = useQueryClient();
  const organizationId = getActiveOrganizationId();
  const [busca, setBusca] = useState("");
  const [stageFilter, setStageFilter] = useState<CRMStage | "todas">("todas");
  const [priorityFilter, setPriorityFilter] = useState<CRMPriority | "todas">("todas");
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [draft, setDraft] = useState<LeadDraft | null>(null);
  const [newDraft, setNewDraft] = useState<NewLeadDraft>(newLeadDefault);
  const [activityDraft, setActivityDraft] = useState<ActivityDraft>(activityDefault);

  const productsQuery = useQuery({
    queryKey: ["crm-produtos", organizationId],
    queryFn: () => fetchProdutosAdmin(organizationId),
    enabled: Boolean(organizationId),
  });
  const availableProducts = productsQuery.data ?? [];

  const leadsQuery = useQuery({
    queryKey: ["leads-admin", organizationId],
    queryFn: () => fetchLeadsAdmin(organizationId),
    enabled: Boolean(organizationId),
  });
  const data = leadsQuery.data ?? [];
  const selectedLead = data.find((lead) => lead.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedLead) { setDraft(null); return; }
    setDraft({
      crm_stage: normalizeStage(selectedLead),
      crm_priority: normalizePriority(selectedLead.crm_priority),
      crm_notes: selectedLead.crm_notes ?? "",
      crm_follow_up_at: localDateTime(selectedLead.crm_follow_up_at),
      crm_estimated_value: selectedLead.crm_estimated_value == null ? "" : String(selectedLead.crm_estimated_value),
      crm_final_value: selectedLead.crm_final_value == null ? "" : String(selectedLead.crm_final_value),
    });
    setActivityDraft(activityDefault);
    setErro(null);
    setFeedback(null);
  }, [selectedId, selectedLead]);

  const activityQuery = useQuery({
    queryKey: ["crm-activities", organizationId, selectedId],
    queryFn: () => buscarAtividadesCRM(selectedId as string, organizationId),
    enabled: Boolean(organizationId && selectedId),
  });
  const refreshLeads = () => qc.invalidateQueries({ queryKey: ["leads-admin", organizationId] });
  const refreshActivities = () => qc.invalidateQueries({ queryKey: ["crm-activities", organizationId, selectedId] });

  const moveLead = useMutation({
    mutationFn: async (input: { lead: LeadComProduto; stage: CRMStage }) => {
      if (normalizeStage(input.lead) === input.stage) return input.lead;
      const updated = await atualizarLeadCRM(input.lead.id, organizationId, { crm_stage: input.stage });
      try {
        await criarAtividadeCRM(organizationId, {
          leadId: input.lead.id, type: "etapa",
          title: "Etapa alterada para " + stageInfo(input.stage).title,
          description: "Movido de " + stageInfo(normalizeStage(input.lead)).title + " para " + stageInfo(input.stage).title + ".",
        });
      } catch { /* O histórico não deve invalidar a mudança de etapa. */ }
      return updated;
    },
    onMutate: () => { setErro(null); setFeedback(null); },
    onSuccess: async (_lead, input) => {
      setFeedback("Lead movido para " + stageInfo(input.stage).title + ".");
      await refreshLeads();
      await qc.invalidateQueries({ queryKey: ["crm-activities", organizationId, input.lead.id] });
    },
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : "Não foi possível mover o lead."),
  });
  const saveLead = useMutation({
    mutationFn: async () => {
      if (!selectedLead || !draft) throw new Error("Selecione um lead para editar.");
      const value = draft.crm_estimated_value.trim() === "" ? null : Number(draft.crm_estimated_value);
      const finalValue = draft.crm_final_value.trim() === "" ? null : Number(draft.crm_final_value);
      if (value !== null && (!Number.isFinite(value) || value < 0)) throw new Error("Informe um valor estimado válido.");
      if (finalValue !== null && (!Number.isFinite(finalValue) || finalValue < 0)) throw new Error("Informe um valor fechado válido.");
      return atualizarLeadCRM(selectedLead.id, organizationId, {
        crm_stage: draft.crm_stage, crm_priority: draft.crm_priority,
        crm_notes: draft.crm_notes.trim() || null,
        crm_follow_up_at: draft.crm_follow_up_at ? new Date(draft.crm_follow_up_at).toISOString() : null,
        crm_estimated_value: value,
        crm_final_value: draft.crm_stage === "ganho" ? finalValue : selectedLead.crm_final_value,
      });
    },
    onSuccess: async (updated) => {
      setFeedback("Ficha do lead atualizada.");
      await refreshLeads();
      if (selectedLead && normalizeStage(selectedLead) !== draft?.crm_stage) {
        try {
          await criarAtividadeCRM(organizationId, {
            leadId: updated.id, type: "etapa",
            title: "Etapa alterada para " + stageInfo(draft?.crm_stage ?? "novo").title,
          });
          await refreshActivities();
        } catch { /* Mantém a atualização mesmo sem histórico. */ }
      }
    },
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : "Não foi possível salvar o lead."),
  });
  const createLead = useMutation({
    mutationFn: () => {
      const amount = newDraft.crm_estimated_value.trim() === "" ? null : Number(newDraft.crm_estimated_value);
      if (amount !== null && (!Number.isFinite(amount) || amount < 0)) throw new Error("Informe um valor estimado válido.");
      return criarLeadManualCRM(organizationId, {
        ...newDraft,
        produto_id: newDraft.produto_id || null,
        crm_estimated_value: amount,
      });
    },
    onSuccess: async (lead) => {
      setNewOpen(false); setNewDraft(newLeadDefault); setFeedback("Novo lead adicionado ao CRM."); setErro(null);
      await refreshLeads(); setSelectedId(lead.id);
    },
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : "Não foi possível criar o lead."),
  });
  const addActivity = useMutation({
    mutationFn: () => {
      if (!selectedLead) throw new Error("Selecione um lead.");
      return criarAtividadeCRM(organizationId, {
        leadId: selectedLead.id, type: activityDraft.type, title: activityDraft.title,
        description: activityDraft.description, due_at: activityDraft.due_at ? new Date(activityDraft.due_at).toISOString() : null,
      });
    },
    onSuccess: async () => { setActivityDraft(activityDefault); setFeedback("Atividade registrada."); setErro(null); await refreshActivities(); },
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : "Não foi possível registrar a atividade."),
  });
  const completeActivity = useMutation({
    mutationFn: (input: { activity: CRMActivity; done: boolean }) => concluirAtividadeCRM(input.activity.id, organizationId, input.done),
    onSuccess: async () => { setFeedback("Tarefa atualizada."); setErro(null); await refreshActivities(); },
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : "Não foi possível atualizar a tarefa."),
  });
  const deleteLead = useMutation({
    mutationFn: (lead: LeadComProduto) => excluirLead(lead.id, organizationId),
    onSuccess: async () => { setSelectedId(null); setFeedback("Lead excluído."); setErro(null); await refreshLeads(); },
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : "Não foi possível excluir o lead."),
  });

  const filtered = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    return data.filter((lead) => {
      const text = [lead.nome, lead.email ?? "", lead.telefone ?? "", lead.mensagem ?? "", lead.produtos?.titulo ?? "", lead.crm_notes ?? ""].join(" ").toLocaleLowerCase("pt-BR");
      return (!q || text.includes(q))
        && (stageFilter === "todas" || normalizeStage(lead) === stageFilter)
        && (priorityFilter === "todas" || normalizePriority(lead.crm_priority) === priorityFilter);
    });
  }, [data, busca, stageFilter, priorityFilter]);

  const active = data.filter((lead) => !isClosedStage(normalizeStage(lead)));
  const overdue = active.filter((lead) => isOverdue(lead.crm_follow_up_at));
  const highPriority = active.filter((lead) => ["alta", "urgente"].includes(normalizePriority(lead.crm_priority)));
  const pipelineValue = active.reduce((sum, lead) => sum + Math.max(0, Number(lead.crm_estimated_value ?? 0)), 0);
  const weightedPipelineValue = active.reduce((sum, lead) => sum + Math.max(0, Number(lead.crm_estimated_value ?? 0)) * stageProbability(normalizeStage(lead)), 0);
  const opportunitiesWithValue = active.filter((lead) => lead.crm_estimated_value != null && Number(lead.crm_estimated_value) > 0).length;
  const wonDeals = data.filter((lead) => normalizeStage(lead) === "ganho");
  const wonValue = wonDeals.reduce((sum, lead) => sum + Math.max(0, Number(lead.crm_final_value ?? 0)), 0);

  const exportCsv = () => {
    const csv = leadsParaCsv(filtered);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "crm-leads-" + new Date().toISOString().slice(0, 10) + ".csv"; a.click(); URL.revokeObjectURL(url);
  };
  const exportXlsx = () => {
    if (!filtered.length) return;
    const rows = filtered.map((lead) => ({
      Nome: lead.nome, Email: lead.email ?? "", Telefone: lead.telefone ?? "",
      Produto: lead.produtos?.titulo ?? "", "Preço do produto": lead.produtos?.preco ?? "", Etapa: stageInfo(normalizeStage(lead)).title,
      Prioridade: priorityInfo(lead.crm_priority).title, "Valor estimado": lead.crm_estimated_value ?? "",
      "Valor fechado": lead.crm_final_value ?? "", "Previsão ponderada": Number(lead.crm_estimated_value ?? 0) * stageProbability(normalizeStage(lead)),
      "Probabilidade da etapa": Math.round(stageProbability(normalizeStage(lead)) * 100) + "%",
      "Próximo retorno": lead.crm_follow_up_at ? formatarData(lead.crm_follow_up_at) : "",
      Observações: lead.crm_notes ?? "", Mensagem: lead.mensagem ?? "", Origem: lead.source ?? "",
      "Página de origem": lead.page_url ?? "", "Data de entrada": formatarData(lead.created_at),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 24 }, { wch: 30 }, { wch: 20 }, { wch: 26 }, { wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 40 }, { wch: 50 }, { wch: 20 }, { wch: 45 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "CRM");
    XLSX.writeFile(workbook, "crm-leads-" + new Date().toISOString().slice(0, 10) + ".xlsx");
  };
  const closeDetails = () => { setSelectedId(null); setErro(null); setFeedback(null); };

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary"><Zap className="h-3.5 w-3.5" /> CRM da loja</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">CRM & Kanban</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Organize contatos, acompanhe oportunidades e nunca perca o próximo retorno.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} disabled={!filtered.length} className={buttonSecondary}><Download className="h-4 w-4" /> CSV</button>
          <button onClick={exportXlsx} disabled={!filtered.length} className={buttonSecondary}><FileSpreadsheet className="h-4 w-4" /> Excel</button>
          <button onClick={() => { setNewDraft(newLeadDefault); setErro(null); setNewOpen(true); }} className={buttonPrimary}><Plus className="h-4 w-4" /> Novo lead</button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi icon={<Users className="h-5 w-5" />} label="Leads em andamento" value={String(active.length)} description={data.length + " contatos no CRM"} />
        <Kpi icon={<AlertTriangle className="h-5 w-5" />} label="Retornos atrasados" value={String(overdue.length)} description="Precisam de atenção" alert={overdue.length > 0} />
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Pipeline estimado" value={currency(pipelineValue)} description={opportunitiesWithValue ? opportunitiesWithValue + " oportunidades com valor" : "Informe o valor de cada oportunidade"} />
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Previsão ponderada" value={currency(weightedPipelineValue)} description="Estimativa ajustada pela etapa" />
        <Kpi icon={<CircleDollarSign className="h-5 w-5" />} label="Vendas ganhas" value={currency(wonValue)} description={wonDeals.length + " negócios concluídos · valor fechado"} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(230px,1fr)_190px_180px]">
          <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar contato, telefone, produto..." className={inputClass + " pl-9"} /></label>
          <label className="relative block"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as CRMStage | "todas")} className={inputClass + " pl-9"}><option value="todas">Todas as etapas</option>{STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.title}</option>)}</select></label>
          <select aria-label="Filtrar por prioridade" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as CRMPriority | "todas")} className={inputClass}><option value="todas">Todas as prioridades</option>{PRIORITIES.map((priority) => <option key={priority.id} value={priority.id}>{priority.title}</option>)}</select>
        </div>
        <div className="flex shrink-0 items-center gap-1 self-end rounded-lg border border-border bg-muted/50 p-1 lg:self-auto">
          <button onClick={() => setView("kanban")} className={"inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold " + (view === "kanban" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><LayoutGrid className="h-4 w-4" /> Kanban</button>
          <button onClick={() => setView("lista")} className={"inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold " + (view === "lista" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><List className="h-4 w-4" /> Lista</button>
        </div>
      </div>

      {(erro || feedback || leadsQuery.error || !organizationId) && <div className={"flex items-start gap-2 rounded-lg border p-3 text-sm " + (erro || leadsQuery.error || !organizationId ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-foreground")}>
        {erro || leadsQuery.error || !organizationId ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
        <p>{erro ?? (leadsQuery.error instanceof Error ? leadsQuery.error.message : !organizationId ? "Nenhuma loja ativa foi identificada. Saia e entre novamente." : feedback)}</p>
        {erro && <button className="ml-auto rounded p-1 hover:bg-destructive/10" onClick={() => setErro(null)} aria-label="Fechar mensagem"><X className="h-4 w-4" /></button>}
      </div>}

      {leadsQuery.isLoading ? <div className="flex gap-3 overflow-hidden pb-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-72 min-w-[265px] flex-1 animate-pulse rounded-xl bg-muted" />)}</div>
      : !filtered.length ? <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Users className="h-7 w-7" /></div>
        <h2 className="mt-4 text-lg font-bold">{data.length === 0 ? "Seu CRM está pronto para começar" : "Nenhum lead encontrado"}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{data.length === 0 ? "Cadastre um contato ou aguarde os contatos enviados pela vitrine. Eles entrarão em Novos leads." : "Ajuste a busca ou os filtros para ver outros contatos."}</p>
        {data.length === 0 && <button onClick={() => setNewOpen(true)} className={buttonPrimary + " mt-5"}><Plus className="h-4 w-4" /> Cadastrar primeiro lead</button>}
      </div>
      : view === "kanban" ? <div className="-mx-1 overflow-x-auto pb-4"><div className="flex min-h-[420px] items-start gap-3 px-1">
        {STAGES.map((stage) => {
          const items = filtered.filter((lead) => normalizeStage(lead) === stage.id);
          const value = items.reduce((sum, lead) => sum + Math.max(0, Number(lead.crm_estimated_value ?? 0)), 0);
          return <section key={stage.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const lead = data.find((item) => item.id === draggedId); if (lead && normalizeStage(lead) !== stage.id) moveLead.mutate({ lead, stage: stage.id }); setDraggedId(null); }} className={"flex w-[280px] shrink-0 flex-col rounded-xl border-t-2 border-x border-b border-border bg-muted/35 transition-colors " + stage.color + (draggedId ? " hover:bg-primary/5" : "")}>
            <div className="rounded-t-xl bg-card/90 p-3 backdrop-blur"><div className="flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><span className={"h-2.5 w-2.5 shrink-0 rounded-full " + stage.dot} /><h2 className="truncate text-sm font-bold">{stage.title}</h2></div><span className="inline-flex min-w-6 items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums">{items.length}</span></div><p className="mt-2 text-xs font-medium text-muted-foreground">{currency(stage.id === "ganho" ? items.reduce((sum, lead) => sum + Math.max(0, Number(lead.crm_final_value ?? lead.crm_estimated_value ?? 0)), 0) : value)} {stage.id === "ganho" ? "em vendas fechadas" : "em oportunidades"}</p><p className="mt-1 text-[10px] text-muted-foreground">Probabilidade de referência: {Math.round(stageProbability(stage.id) * 100)}%</p></div>
            <div className="flex min-h-[320px] flex-col gap-2 p-2">
              {items.map((lead) => <LeadCard key={lead.id} lead={lead} dragged={draggedId === lead.id} onOpen={() => { setSelectedId(lead.id); setErro(null); setFeedback(null); }} onDragStart={() => setDraggedId(lead.id)} onDragEnd={() => setDraggedId(null)} onMove={(stageId) => moveLead.mutate({ lead, stage: stageId })} />)}
              {!items.length && <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/80 px-3 py-6 text-center text-xs text-muted-foreground">Arraste um lead para esta etapa</div>}
            </div>
          </section>;
        })}
      </div></div>
      : <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Contato</th><th className="px-4 py-3">Etapa</th><th className="px-4 py-3">Prioridade</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Próximo retorno</th><th className="px-4 py-3">Entrada</th></tr></thead>
        <tbody className="divide-y divide-border">{filtered.map((lead) => <tr key={lead.id} className="cursor-pointer transition hover:bg-muted/40" onClick={() => setSelectedId(lead.id)}>
          <td className="px-4 py-3"><div className="font-semibold">{lead.nome}</div><div className="mt-0.5 text-xs text-muted-foreground">{lead.email || lead.telefone || "Sem contato informado"}</div></td>
          <td className="px-4 py-3"><span className="inline-flex items-center gap-2"><span className={"h-2 w-2 rounded-full " + stageInfo(normalizeStage(lead)).dot} />{stageInfo(normalizeStage(lead)).title}</span></td>
          <td className="px-4 py-3"><PriorityPill priority={normalizePriority(lead.crm_priority)} /></td>
          <td className="px-4 py-3 font-semibold tabular-nums">{currency(lead.crm_estimated_value)}</td><td className="px-4 py-3"><FollowUpLabel value={lead.crm_follow_up_at} /></td><td className="px-4 py-3 text-muted-foreground">{formatarData(lead.created_at)}</td>
        </tr>)}</tbody>
      </table></div></div>}

      {selectedLead && draft && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) closeDetails(); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="lead-editor-title" className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl sm:max-h-[92vh] sm:rounded-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{initials(selectedLead.nome)}</div><div className="min-w-0"><h2 id="lead-editor-title" className="truncate text-xl font-bold">{selectedLead.nome}</h2><p className="mt-1 text-xs text-muted-foreground">Criado em {formatarData(selectedLead.created_at)}{selectedLead.produtos?.titulo ? " · " + selectedLead.produtos.titulo : ""}</p></div></div>
            <div className="flex shrink-0 items-center gap-2"><a href={selectedLead.telefone ? (whatsappLeadLink(selectedLead.telefone, selectedLead.nome) || "tel:" + selectedLead.telefone) : undefined} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted"><Phone className="h-4 w-4" /><span className="hidden sm:inline">Contatar</span></a><button onClick={closeDetails} aria-label="Fechar ficha" className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto"><div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div className="space-y-5 border-b border-border p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <div><h3 className="text-sm font-bold">Dados do contato</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">
                {selectedLead.email ? <a href={"mailto:" + selectedLead.email} className="flex min-w-0 items-center gap-2 rounded-lg border border-border p-3 text-sm hover:bg-muted"><Mail className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="truncate">{selectedLead.email}</span></a> : <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">E-mail não informado</div>}
                {selectedLead.telefone ? <a href={whatsappLeadLink(selectedLead.telefone, selectedLead.nome) || "tel:" + selectedLead.telefone} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 rounded-lg border border-border p-3 text-sm hover:bg-muted"><Phone className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="truncate">{selectedLead.telefone}</span><ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0" /></a> : <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">Telefone não informado</div>}
              </div></div>
              {selectedLead.mensagem && <div className="rounded-xl border border-border bg-muted/25 p-3.5"><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"><MessageSquare className="h-4 w-4" /> Mensagem original</div><p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedLead.mensagem}</p>{selectedLead.source && <p className="mt-2 text-xs text-muted-foreground">Origem: {selectedLead.source}</p>}{selectedLead.page_url && <a href={selectedLead.page_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Ver página de origem <ArrowRight className="h-3 w-3" /></a>}</div>}
              <div><h3 className="text-sm font-bold">Pipeline e oportunidade</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-muted-foreground">Etapa atual<select value={draft.crm_stage} onChange={(e) => setDraft({ ...draft, crm_stage: e.target.value as CRMStage })} className={inputClass + " mt-1.5"}>{STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.title}</option>)}</select></label>
                <label className="block text-xs font-semibold text-muted-foreground">Prioridade<select value={draft.crm_priority} onChange={(e) => setDraft({ ...draft, crm_priority: e.target.value as CRMPriority })} className={inputClass + " mt-1.5"}>{PRIORITIES.map((priority) => <option key={priority.id} value={priority.id}>{priority.title}</option>)}</select></label>
                <label className="block text-xs font-semibold text-muted-foreground">Valor estimado da oportunidade (R$)<input type="number" inputMode="decimal" min="0" step="0.01" value={draft.crm_estimated_value} onChange={(e) => setDraft({ ...draft, crm_estimated_value: e.target.value })} placeholder="Ex.: 1.250,00" className={inputClass + " mt-1.5"} /><span className="mt-1 block font-normal">Quanto você espera vender. Pode ser diferente do preço de catálogo.</span></label>
                <label className="block text-xs font-semibold text-muted-foreground">Valor fechado (R$)<input type="number" inputMode="decimal" min="0" step="0.01" value={draft.crm_final_value} onChange={(e) => setDraft({ ...draft, crm_final_value: e.target.value })} placeholder="Preencha ao concluir a venda" className={inputClass + " mt-1.5"} /><span className="mt-1 block font-normal">Ao marcar como ganho, começa com a estimativa e pode ser corrigido.</span></label>
                <label className="block text-xs font-semibold text-muted-foreground">Próximo retorno<input type="datetime-local" value={draft.crm_follow_up_at} onChange={(e) => setDraft({ ...draft, crm_follow_up_at: e.target.value })} className={inputClass + " mt-1.5"} /></label>
              </div><label className="mt-3 block text-xs font-semibold text-muted-foreground">Observações internas<textarea value={draft.crm_notes} onChange={(e) => setDraft({ ...draft, crm_notes: e.target.value })} rows={4} maxLength={12000} placeholder="Contexto, necessidades, objeções, próximos passos..." className={inputClass + " mt-1.5 resize-y"} /></label>
                <button onClick={() => saveLead.mutate()} disabled={saveLead.isPending} className={buttonPrimary + " mt-3 w-full sm:w-auto"}><Check className="h-4 w-4" />{saveLead.isPending ? "Salvando..." : "Salvar ficha"}</button>
              </div>
              <div className="rounded-xl border border-border p-3.5"><h3 className="text-sm font-bold">Ações rápidas</h3><div className="mt-3 grid grid-cols-2 gap-2"><a href={selectedLead.email ? "mailto:" + selectedLead.email : undefined} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold hover:bg-muted"><Mail className="h-4 w-4" /> Enviar e-mail</a><a href={selectedLead.telefone ? whatsappLeadLink(selectedLead.telefone, selectedLead.nome) : undefined} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold hover:bg-muted"><Phone className="h-4 w-4" /> WhatsApp</a></div></div>
              <button onClick={() => { if (confirm("Excluir definitivamente o lead " + selectedLead.nome + "? As atividades vinculadas também serão excluídas.")) deleteLead.mutate(selectedLead); }} disabled={deleteLead.isPending} className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /> Excluir lead</button>
            </div>
            <div className="space-y-5 p-4 sm:p-6">
              <div><div className="flex items-center justify-between gap-2"><div><h3 className="text-sm font-bold">Atividades e histórico</h3><p className="mt-1 text-xs text-muted-foreground">Registre conversas, tarefas e próximos passos.</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{activityQuery.data?.length ?? 0}</span></div>
                <form onSubmit={(e) => { e.preventDefault(); addActivity.mutate(); }} className="mt-4 space-y-3 rounded-xl border border-border bg-muted/20 p-3.5">
                  <label className="block text-xs font-semibold text-muted-foreground">Tipo de atividade<select value={activityDraft.type} onChange={(e) => setActivityDraft({ ...activityDraft, type: e.target.value as CRMActivityType })} className={inputClass + " mt-1.5"}>{ACTIVITY_TYPES.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
                  <label className="block text-xs font-semibold text-muted-foreground">Título<input required maxLength={180} value={activityDraft.title} onChange={(e) => setActivityDraft({ ...activityDraft, title: e.target.value })} placeholder={activityDraft.type === "tarefa" ? "Ex.: Retornar ao cliente" : "Ex.: Conversa sobre o produto"} className={inputClass + " mt-1.5"} /></label>
                  <label className="block text-xs font-semibold text-muted-foreground">Detalhes<textarea rows={2} maxLength={8000} value={activityDraft.description} onChange={(e) => setActivityDraft({ ...activityDraft, description: e.target.value })} placeholder="Resumo da conversa, pendências ou resultado..." className={inputClass + " mt-1.5 resize-y"} /></label>
                  {activityDraft.type === "tarefa" && <label className="block text-xs font-semibold text-muted-foreground">Prazo<input type="datetime-local" value={activityDraft.due_at} onChange={(e) => setActivityDraft({ ...activityDraft, due_at: e.target.value })} className={inputClass + " mt-1.5"} /></label>}
                  <button type="submit" disabled={addActivity.isPending} className={buttonPrimary + " w-full"}><Plus className="h-4 w-4" />{addActivity.isPending ? "Registrando..." : "Registrar atividade"}</button>
                </form>
              </div>
              <div className="space-y-3">{activityQuery.isLoading && <div className="h-20 animate-pulse rounded-xl bg-muted" />}{(activityQuery.data ?? []).map((activity) => <ActivityItem key={activity.id} activity={activity} onToggle={(done) => completeActivity.mutate({ activity, done })} busy={completeActivity.isPending} />)}
                {!activityQuery.isLoading && !(activityQuery.data ?? []).length && <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center"><NotebookPen className="mx-auto h-6 w-6 text-muted-foreground/60" /><p className="mt-2 text-sm font-semibold">Nenhuma atividade registrada</p><p className="mt-1 text-xs text-muted-foreground">O histórico aparece aqui conforme você acompanha o contato.</p></div>}
              </div>
            </div>
          </div></div>
          {(erro || feedback) && <div className={"border-t px-4 py-2.5 text-sm " + (erro ? "border-destructive/25 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-foreground")}>{erro ?? feedback}</div>}
          <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 sm:px-6"><p className="hidden text-xs text-muted-foreground sm:block">As alterações são salvas por loja.</p><button onClick={closeDetails} className={buttonSecondary}>Fechar ficha</button></div>
        </section>
      </div>}

      {newOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setNewOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="new-lead-title" className="w-full max-w-xl rounded-t-2xl border border-border bg-background shadow-2xl sm:rounded-2xl">
          <div className="flex items-start justify-between border-b border-border px-5 py-4"><div><h2 id="new-lead-title" className="text-xl font-bold">Adicionar lead</h2><p className="mt-1 text-sm text-muted-foreground">Cadastre um contato manualmente no funil desta loja.</p></div><button onClick={() => setNewOpen(false)} aria-label="Fechar cadastro" className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div>
          <form onSubmit={(e) => { e.preventDefault(); createLead.mutate(); }} className="space-y-4 p-5">
            <label className="block text-xs font-semibold text-muted-foreground">Nome completo *<input required autoFocus maxLength={180} value={newDraft.nome} onChange={(e) => setNewDraft({ ...newDraft, nome: e.target.value })} placeholder="Nome do contato" className={inputClass + " mt-1.5"} /></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-semibold text-muted-foreground">E-mail<input type="email" maxLength={254} value={newDraft.email} onChange={(e) => setNewDraft({ ...newDraft, email: e.target.value })} placeholder="contato@empresa.com" className={inputClass + " mt-1.5"} /></label><label className="block text-xs font-semibold text-muted-foreground">Telefone / WhatsApp<input type="tel" maxLength={40} value={newDraft.telefone} onChange={(e) => setNewDraft({ ...newDraft, telefone: e.target.value })} placeholder="(11) 99999-9999" className={inputClass + " mt-1.5"} /></label></div>
            <label className="block text-xs font-semibold text-muted-foreground">Etapa inicial<select value={newDraft.crm_stage} onChange={(e) => setNewDraft({ ...newDraft, crm_stage: e.target.value as CRMStage })} className={inputClass + " mt-1.5"}>{STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.title}</option>)}</select></label>
            <label className="block text-xs font-semibold text-muted-foreground">Prioridade<select value={newDraft.crm_priority} onChange={(e) => setNewDraft({ ...newDraft, crm_priority: e.target.value as CRMPriority })} className={inputClass + " mt-1.5"}>{PRIORITIES.map((priority) => <option key={priority.id} value={priority.id}>{priority.title}</option>)}</select></label>
            <label className="block text-xs font-semibold text-muted-foreground">Observação inicial<textarea rows={3} maxLength={8000} value={newDraft.mensagem} onChange={(e) => setNewDraft({ ...newDraft, mensagem: e.target.value })} placeholder="Como conheceu o contato? O que ele precisa?" className={inputClass + " mt-1.5 resize-y"} /></label>
            {erro && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{erro}</p>}
            <div className="flex flex-col-reverse justify-end gap-2 border-t border-border pt-4 sm:flex-row"><button type="button" onClick={() => setNewOpen(false)} className={buttonSecondary}>Cancelar</button><button type="submit" disabled={createLead.isPending || !organizationId} className={buttonPrimary}><Plus className="h-4 w-4" />{createLead.isPending ? "Criando..." : "Criar lead"}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}

function Kpi({ icon, label, value, description, alert = false }: { icon: ReactNode; label: string; value: string; description: string; alert?: boolean }) {
  return <div className={"rounded-xl border bg-card p-4 " + (alert ? "border-amber-500/40" : "border-border")}><div className="flex items-start justify-between gap-2"><div className="text-xs font-semibold text-muted-foreground">{label}</div><div className={"rounded-lg p-2 " + (alert ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary")}>{icon}</div></div><div className="mt-3 break-words text-2xl font-bold tracking-tight tabular-nums">{value}</div><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>;
}

function PriorityPill({ priority }: { priority: CRMPriority }) {
  const info = priorityInfo(priority);
  return <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide " + info.className}>{priority === "urgente" && <Zap className="h-3 w-3" />}{info.title}</span>;
}
function FollowUpLabel({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">Sem data</span>;
  const late = isOverdue(value);
  return <span className={"inline-flex items-center gap-1.5 text-xs font-medium " + (late ? "text-destructive" : "text-muted-foreground")}><CalendarClock className="h-3.5 w-3.5" />{late && <AlertTriangle className="h-3 w-3" />}{dateLabel(value)}</span>;
}
function LeadCard({ lead, dragged, onOpen, onDragStart, onDragEnd, onMove }: { lead: LeadComProduto; dragged: boolean; onOpen: () => void; onDragStart: () => void; onDragEnd: () => void; onMove: (stage: CRMStage) => void }) {
  const stage = normalizeStage(lead);
  const late = isOverdue(lead.crm_follow_up_at) && !isClosedStage(stage);
  return <article draggable onDragStart={onDragStart} onDragEnd={onDragEnd} className={"group rounded-xl border border-border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md " + (dragged ? "opacity-40" : "")}>
    <div className="flex items-start gap-2"><button onClick={onOpen} className="min-w-0 flex-1 text-left"><span className="flex items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">{initials(lead.nome)}</span><span className="min-w-0"><span className="block truncate text-sm font-bold group-hover:text-primary">{lead.nome}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{lead.email || lead.telefone || "Sem contato informado"}</span></span></span></button><span title="Arraste para mover" className="mt-1 rounded p-1 text-muted-foreground/50"><GripVertical className="h-4 w-4" /></span></div>
    <div className="mt-3 flex flex-wrap items-center gap-1.5"><PriorityPill priority={normalizePriority(lead.crm_priority)} />{late && <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive"><Clock3 className="h-3 w-3" /> Atrasado</span>}</div>
    {lead.produtos?.titulo && <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><CircleDollarSign className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{lead.produtos.titulo}</span></div>}
    {lead.mensagem && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{lead.mensagem}</p>}
    {lead.crm_notes && <p className="mt-2 line-clamp-2 border-l-2 border-primary/30 pl-2 text-xs text-muted-foreground">{lead.crm_notes}</p>}
    <div className="mt-3 flex items-end justify-between gap-2 border-t border-border pt-3"><div className="min-w-0"><div className="text-[10px] font-medium text-muted-foreground">{lead.crm_follow_up_at ? "Próximo retorno" : "Oportunidade"}</div>{lead.crm_follow_up_at ? <div className={"mt-1 flex items-center gap-1 text-[11px] font-semibold " + (late ? "text-destructive" : "text-foreground")}><CalendarClock className="h-3.5 w-3.5 shrink-0" />{dateLabel(lead.crm_follow_up_at)}</div> : <div className="mt-1 text-sm font-bold tabular-nums">{currency(lead.crm_estimated_value)}</div>}</div><button onClick={onOpen} className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/10">Abrir <ArrowRight className="h-3 w-3" /></button></div>
    <label className="mt-2 block"><span className="sr-only">Mover etapa de {lead.nome}</span><select value={stage} onChange={(e) => onMove(e.target.value as CRMStage)} className="w-full rounded-md border border-border/80 bg-background px-2 py-1.5 text-[11px] text-muted-foreground outline-none focus:border-primary"><option value={stage}>Mover para: {stageInfo(stage).short}</option>{STAGES.filter((item) => item.id !== stage).map((item) => <option key={item.id} value={item.id}>Mover para: {item.short}</option>)}</select></label>
  </article>;
}
function ActivityItem({ activity, onToggle, busy }: { activity: CRMActivity; onToggle: (done: boolean) => void; busy: boolean }) {
  const task = activity.type === "tarefa";
  const done = Boolean(activity.completed_at);
  const activityTitle = ACTIVITY_TYPES.find((item) => item.id === activity.type)?.title ?? (activity.type === "etapa" ? "Etapa" : activity.type);
  return <article className={"flex gap-3 rounded-xl border p-3 " + (done ? "border-border/70 bg-muted/20 opacity-75" : "border-border bg-card")}>
    <div className={"mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " + (done ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary")}>{done ? <Check className="h-4 w-4" /> : activityIcon(activity.type)}</div>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div className={"text-sm font-semibold " + (done ? "line-through" : "")}>{activity.title}</div><time className="shrink-0 text-[10px] text-muted-foreground">{formatarData(activity.created_at)}</time></div><div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{activityTitle}</div>{activity.description && <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{activity.description}</p>}{activity.due_at && <p className={"mt-2 inline-flex items-center gap-1 text-xs font-medium " + (isOverdue(activity.due_at) && !done ? "text-destructive" : "text-muted-foreground")}><CalendarClock className="h-3 w-3" /> Prazo: {dateLabel(activity.due_at)}</p>}{task && <button onClick={() => onToggle(!done)} disabled={busy} className={"mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold " + (done ? "text-muted-foreground hover:bg-muted" : "bg-primary/10 text-primary hover:bg-primary/15")}>{done ? <ArrowRight className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}{done ? "Reabrir tarefa" : "Marcar como concluída"}</button>}</div>
  </article>;
}
