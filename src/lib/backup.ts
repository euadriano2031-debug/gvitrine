import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { getActiveOrganizationId } from "@/lib/saas";
import type { Produto } from "@/lib/loja";

export type BackupPayload = {
  backup_version: number;
  gerado_em: string;
  organization_id: string;
  organization: Record<string, unknown>;
  categorias: Array<Record<string, unknown>>;
  produtos: Array<Record<string, unknown>>;
  configuracoes: Array<Record<string, unknown>>;
  leads: Array<Record<string, unknown>>;
};

export type BackupListItem = {
  id: string;
  organization_id: string;
  gerado_em: string;
  expira_em: string;
  checksum: string;
  origem: string;
  criado_por: string | null;
};

export type BackupCycleStatus = {
  primeiraData: string | null;
  proximaDataLimite: string | null;
  diasRestantes: number | null;
  totalBackups: number;
  automaticos: number;
};

const BACKUP_FILE_VERSION = 1;
const BACKUP_EXTENSION = ".gvit-backup.zip";

export function formatarDataHoraBackup(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

export function formatarDataArquivo(value: string | Date = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}_${get("hour")}-${get("minute")}-${get("second")}`;
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function coletarReferenciasMedia(value: unknown, path = "$", refs: Array<Record<string, string>> = []) {
  if (typeof value === "string") {
    const pareceMedia = /(?:imagem|image|logo|capa|poster|video|vídeo|midia|mídia)/i.test(path);
    const pareceUrl = /^(?:https?:\/\/|\/)/i.test(value);
    if (pareceMedia && pareceUrl) {
      refs.push({
        caminho: path,
        url: value,
        tipo: /video|vídeo/i.test(path) ? "video" : "imagem_ou_url",
      });
    }
    return refs;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => coletarReferenciasMedia(item, `${path}[${index}]`, refs));
    return refs;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) =>
      coletarReferenciasMedia(item, `${path}.${key}`, refs),
    );
  }

  return refs;
}

function normalizarPayload(payload: unknown): BackupPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Backup inválido.");
  }

  const p = payload as Partial<BackupPayload>;
  if (
    p.backup_version !== BACKUP_FILE_VERSION ||
    !p.organization ||
    !Array.isArray(p.categorias) ||
    !Array.isArray(p.produtos) ||
    !Array.isArray(p.configuracoes) ||
    !Array.isArray(p.leads)
  ) {
    throw new Error("Este arquivo não é um backup completo válido da G-Vitrine.");
  }

  return p as BackupPayload;
}

export async function criarBackupServidor(
  organizationId = getActiveOrganizationId(),
  preRestauracao = false,
) {
  if (!organizationId) throw new Error("Nenhuma loja ativa foi selecionada.");

  const { data, error } = await supabase.rpc(
    preRestauracao
      ? "criar_backup_pre_restauracao_da_loja"
      : "criar_backup_da_loja",
    { _organization_id: organizationId },
  );

  if (error) throw error;
  const backupId = String(data);

  const { data: backup, error: backupError } = await supabase
    .from("loja_backups")
    .select("id,organization_id,gerado_em,expira_em,checksum,origem,criado_por,payload")
    .eq("id", backupId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (backupError) throw backupError;
  if (!backup?.payload) throw new Error("O backup foi criado, mas o conteúdo não pôde ser lido.");

  return {
    id: backup.id,
    gerado_em: backup.gerado_em,
    expira_em: backup.expira_em,
    checksum: backup.checksum,
    origem: backup.origem,
    payload: normalizarPayload(backup.payload),
  };
}

export async function criarArquivoBackup(
  payload: BackupPayload,
  options?: {
    checksumServidor?: string;
    nomeLoja?: string;
  },
) {
  const json = JSON.stringify(payload, null, 2);
  const checksumArquivo = await sha256Hex(json);
  const mediaReferences = coletarReferenciasMedia(payload);
  const agora = new Date().toISOString();

  const manifest = {
    formato: "G-Vitrine Store Backup",
    extensao: BACKUP_EXTENSION,
    backup_version: BACKUP_FILE_VERSION,
    gerado_em: payload.gerado_em || agora,
    criado_em_arquivo: agora,
    organization_id: payload.organization_id,
    nome_loja: options?.nomeLoja ?? String(payload.organization?.name ?? ""),
    checksum_servidor: options?.checksumServidor ?? null,
    checksum_backup_json: checksumArquivo,
    conteudo: {
      organization: true,
      categorias: payload.categorias.length,
      produtos: payload.produtos.length,
      configuracoes: payload.configuracoes.length,
      leads: payload.leads.length,
      referencias_de_midia: mediaReferences.length,
    },
  };

  const readme = [
    "G-VITRINE — BACKUP TOTAL DA LOJA",
    "",
    `Loja: ${manifest.nome_loja || "Sem nome"}`,
    `Gerado em: ${formatarDataHoraBackup(manifest.gerado_em)}`,
    `Versão do backup: ${BACKUP_FILE_VERSION}`,
    "",
    "Este arquivo contém a estrutura necessária para restaurar a loja:",
    "- dados e identidade da organização;",
    "- categorias;",
    "- produtos e todos os campos atuais;",
    "- configurações/aparência/textos/cores;",
    "- referências de imagens e vídeos;",
    "- configurações de compartilhamento;",
    "- leads da loja;",
    "- manifesto e checksum para validação.",
    "",
    "Vídeos e imagens hospedados fora do backup são mantidos por referência de URL.",
    "Vídeos do YouTube continuam sendo referências do YouTube e não são copiados para dentro do backup.",
    "",
    "NUNCA edite o backup.json manualmente.",
  ].join("\n");

  const zip = new JSZip();
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("backup.json", json);
  zip.file("media-references.json", JSON.stringify(mediaReferences, null, 2));
  zip.file("README.txt", readme);

  return {
    blob: await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    }),
    manifest,
  };
}

export function baixarArquivoBackup(
  blob: Blob,
  organizationName: string,
  generatedAt = new Date(),
) {
  const safeName = (organizationName || "loja")
    .normalize("NFKD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "loja";
  const filename = `${safeName}_backup_total_${formatarDataArquivo(generatedAt)}${BACKUP_EXTENSION}`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return filename;
}

export async function lerArquivoBackup(file: File) {
  const buffer = await file.arrayBuffer();

  try {
    const zip = await JSZip.loadAsync(buffer);
    const backupEntry = zip.file("backup.json");
    if (!backupEntry) throw new Error("ZIP de backup sem backup.json.");

    const manifestEntry = zip.file("manifest.json");
    const json = await backupEntry.async("string");
    const payload = normalizarPayload(JSON.parse(json));

    if (manifestEntry) {
      const manifest = JSON.parse(await manifestEntry.async("string")) as {
        backup_version?: number;
        checksum_backup_json?: string;
        organization_id?: string;
      };
      if (manifest.backup_version !== BACKUP_FILE_VERSION) {
        throw new Error("Versão de backup não suportada.");
      }
      if (manifest.organization_id && manifest.organization_id !== payload.organization_id) {
        throw new Error("O manifesto e o backup possuem lojas diferentes.");
      }
      if (manifest.checksum_backup_json) {
        const checksumAtual = await sha256Hex(json);
        if (checksumAtual !== manifest.checksum_backup_json) {
          throw new Error("O backup está corrompido ou foi alterado.");
        }
      }
    }

    return payload;
  } catch (error) {
    if (file.type === "application/json" || file.name.toLowerCase().endsWith(".json")) {
      const payload = normalizarPayload(JSON.parse(await file.text()));
      return payload;
    }
    throw error instanceof Error ? error : new Error("Não foi possível ler o backup.");
  }
}

export async function listarBackups(organizationId = getActiveOrganizationId()) {
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("loja_backups")
    .select("id,organization_id,gerado_em,expira_em,checksum,origem,criado_por")
    .eq("organization_id", organizationId)
    .order("gerado_em", { ascending: false })
    .limit(30);

  if (error) throw error;
  return (data ?? []) as BackupListItem[];
}

export async function buscarPayloadBackup(
  backupId: string,
  organizationId = getActiveOrganizationId(),
) {
  if (!organizationId) throw new Error("Nenhuma loja ativa foi selecionada.");

  const { data, error } = await supabase
    .from("loja_backups")
    .select("id,organization_id,gerado_em,expira_em,checksum,origem,criado_por,payload")
    .eq("id", backupId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.payload) throw new Error("Backup não encontrado para esta loja.");

  return {
    id: data.id,
    gerado_em: data.gerado_em,
    expira_em: data.expira_em,
    checksum: data.checksum,
    origem: data.origem,
    payload: normalizarPayload(data.payload),
  };
}

export async function excluirBackupServidor(
  backupId: string,
  organizationId = getActiveOrganizationId(),
) {
  if (!organizationId) throw new Error("Nenhuma loja ativa foi selecionada.");
  if (!backupId) throw new Error("Backup inválido.");

  const { data, error } = await supabase.rpc("excluir_backup_da_loja", {
    _organization_id: organizationId,
    _backup_id: backupId,
  });

  if (error) throw error;
  if (data !== true) throw new Error("O backup não foi excluído.");

  return true;
}

export async function restaurarBackup(
  payload: BackupPayload,
  organizationId = getActiveOrganizationId(),
) {
  if (!organizationId) throw new Error("Nenhuma loja ativa foi selecionada.");
  if (payload.organization_id !== organizationId) {
    throw new Error("Este backup pertence a outra loja.");
  }

  const { data, error } = await supabase.rpc("restaurar_backup_da_loja", {
    _organization_id: organizationId,
    _payload: payload,
  });

  if (error) throw error;
  return data as {
    restaurado: boolean;
    produtos: number;
    categorias: number;
    configuracoes: number;
    leads: number;
    restaurado_em: string;
  };
}

export async function obterStatusCicloBackup(
  organizationId = getActiveOrganizationId(),
): Promise<BackupCycleStatus> {
  if (!organizationId) {
    return {
      primeiraData: null,
      proximaDataLimite: null,
      diasRestantes: null,
      totalBackups: 0,
      automaticos: 0,
    };
  }

  const { data, error } = await supabase
    .from("loja_backups")
    .select("gerado_em,origem")
    .eq("organization_id", organizationId)
    .order("gerado_em", { ascending: true })
    .limit(100);

  if (error) throw error;

  const backups = data ?? [];
  const automaticos = backups.filter((item) => item.origem === "automatico");
  const primeira = automaticos[0]?.gerado_em ?? null;
  const fim = primeira ? new Date(new Date(primeira).getTime() + 60 * 24 * 60 * 60 * 1000) : null;
  const dias = fim ? Math.ceil((fim.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null;

  return {
    primeiraData: primeira,
    proximaDataLimite: fim?.toISOString() ?? null,
    diasRestantes: dias,
    totalBackups: backups.length,
    automaticos: automaticos.length,
  };
}

export function resumoBackup(payload: BackupPayload) {
  return {
    produtos: payload.produtos.length,
    categorias: payload.categorias.length,
    configuracoes: payload.configuracoes.length,
    leads: payload.leads.length,
    loja: String(payload.organization?.name ?? "Loja"),
    slug: String(payload.organization?.slug ?? ""),
  };
}

export type { Produto };
