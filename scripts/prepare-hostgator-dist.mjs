import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceCandidates = [
  path.join(root, ".output", "public"),
  path.join(root, ".vercel", "output", "static"),
];
const dist = path.join(root, "dist");

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

const source = (await Promise.all(sourceCandidates.map(async (candidate) => (await exists(candidate) ? candidate : null)))).find(Boolean);

if (!source) {
  throw new Error("Nenhuma saída pública do build foi encontrada. Execute o build novamente.");
}

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });
await fs.cp(source, dist, { recursive: true });

const assetsDir = path.join(dist, "assets");
const assets = (await fs.readdir(assetsDir)).sort();
const jsFiles = assets.filter((file) => file.endsWith(".js"));
const cssFiles = assets.filter((file) => file.endsWith(".css"));

let entry = null;
for (const file of jsFiles) {
  const content = await fs.readFile(path.join(assetsDir, file), "utf8");
  if (content.includes("hydrateRoot(") || content.includes("createRoot(")) {
    entry = file;
    break;
  }
}

if (!entry) {
  throw new Error("Não foi possível localizar o entrypoint do cliente no build.");
}

const css = cssFiles.find((file) => /^styles-.*\.css$/i.test(file)) ?? cssFiles[0] ?? null;

const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="index,follow" />
    <title>KI VITRINE</title>
    ${css ? `<link rel="stylesheet" href="/assets/${css}" />` : ""}
  </head>
  <body>
    <script type="module" src="/assets/${entry}"></script>
  </body>
</html>
`;

await fs.writeFile(path.join(dist, "index.html"), html, "utf8");

const htaccess = `Options -MultiViews
RewriteEngine On

RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

RewriteRule ^ index.html [L]
`;

await fs.writeFile(path.join(dist, ".htaccess"), htaccess, "utf8");

console.log(`Dist criado em ${dist} usando ${entry}${css ? ` + ${css}` : ""} (fonte: ${source}).`);
