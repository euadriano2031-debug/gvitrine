import { createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";

const root = process.cwd();
const outputPath = path.join(root, "public", "ki-vitrine-completo-codigo-fonte.zip");

const excludedDirs = new Set([
  ".git",
  "node_modules",
  ".vercel",
  ".output",
  "dist",
  "package-output",
  "package-root",
]);

const excludedFiles = new Set([
  ".env",
  "public/ki-vitrine-completo-codigo-fonte.zip",
]);

async function walk(current, relative = "") {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const rel = relative ? path.join(relative, entry.name) : entry.name;
    const abs = path.join(current, entry.name);

    if (entry.isDirectory()) {
      if (!excludedDirs.has(entry.name)) {
        files.push(...(await walk(abs, rel)));
      }
      continue;
    }

    if (excludedFiles.has(rel.split(path.sep).join("/"))) continue;
    files.push({ abs, rel: rel.split(path.sep).join("/") });
  }

  return files;
}

const zip = new JSZip();
const files = await walk(root);

for (const file of files) {
  zip.file(file.rel, await fs.readFile(file.abs));
}

zip.file(
  "INSTALL.txt",
  [
    "LOJA VITRINE / G-VITRINE — CÓDIGO-FONTE COMPLETO",
    "",
    "Banco Supabase novo: leia SUPABASE_INSTALACAO/00-LEIA-ME-ORDEM.md e execute somente os SQLs 01 a 11, um por vez.",
    "Antes do SQL 09, crie o usuário proprietário em Supabase Authentication > Users.",
    "Não execute as migrations por cima do instalador completo: supabase/migrations/ é para atualização incremental de bancos existentes.",
    "",
    "Copie .env.example para .env e configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY com seu próprio projeto antes de compilar.",
    "Nunca exponha SUPABASE_SERVICE_ROLE_KEY no frontend ou em variáveis VITE_*.",
    "O arquivo .env real foi excluído deste pacote.",
    "",
    "O ZIP contém código e estrutura SQL, mas não é um dump dos dados privados de produção. Mídias enviadas ao Storage devem ser migradas separadamente.",
    "Para o site completo use Vercel ou uma hospedagem com suporte a Node/TanStack Start/Nitro; hospedagem estática simples não oferece todas as funções SSR.",
  ].join("\n"),
);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const buffer = await zip.generateAsync({
  type: "nodebuffer",
  compression: "DEFLATE",
  compressionOptions: { level: 6 },
});

await fs.writeFile(outputPath, buffer);
console.log(`Source package created: ${outputPath} (${buffer.length} bytes)`);
