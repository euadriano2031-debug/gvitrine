// Exporta objetos do bucket privado loja para uma pasta de backup local.
// Execute da raiz do projeto com Node.js e @supabase/supabase-js instalado.
// Defina SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY antiga)
// apenas em variáveis de ambiente locais. Nunca grave a chave no código.
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    "Defina SUPABASE_URL e SUPABASE_SECRET_KEY na sessão local; não inclua a chave no código-fonte."
  );
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const bucket = "loja";
const outputRoot = path.resolve("BACKUP-DADOS-LOCAL", "storage", bucket);
const pageSize = 100;
let downloaded = 0;

async function listAll(prefix) {
  const entries = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error("Falha listando " + (prefix || "/") + ": " + error.message);
    entries.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return entries;
}

async function exportDirectory(prefix = "") {
  const entries = await listAll(prefix);
  for (const entry of entries) {
    const objectPath = prefix ? prefix + "/" + entry.name : entry.name;
    const isFolder = entry.id == null && entry.metadata == null;

    if (isFolder) {
      await exportDirectory(objectPath);
      continue;
    }

    const { data: file, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(objectPath);
    if (downloadError || !file) {
      throw new Error("Falha baixando " + objectPath + ": " + (downloadError?.message ?? "arquivo vazio"));
    }

    const destination = path.join(outputRoot, ...objectPath.split("/"));
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, Buffer.from(await file.arrayBuffer()));
    downloaded += 1;
    console.log("Exportado: " + objectPath);
  }
}

await mkdir(outputRoot, { recursive: true });
await exportDirectory();

console.log("Concluído: " + downloaded + " objeto(s) exportado(s) para " + outputRoot);
