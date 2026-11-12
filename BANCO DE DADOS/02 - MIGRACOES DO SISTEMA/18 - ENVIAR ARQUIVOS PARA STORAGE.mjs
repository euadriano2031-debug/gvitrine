#!/usr/bin/env node
/**
 * Copia automaticamente as imagens/arquivos locais do projeto para o bucket `loja`
 * do Supabase, preservando nomes e caminhos.
 *
 * Uso:
 *   SUPABASE_URL=https://SEU-PROJETO.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key \
 *   node migracao-supabase/upload-storage.mjs [--bucket loja] [--prefix ""] [--dry-run] [--force]
 *
 * Requisitos: Node 18+ e `npm i @supabase/supabase-js` (ou `bun add`).
 * A service_role key só é usada localmente neste script — nunca vá para o frontend.
 */
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, extname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

// Pastas locais -> pasta destino dentro do bucket (caminhos preservados)
const SOURCES = [
  { dir: 'public/produtos', dest: 'produtos' },
  { dir: 'public/images', dest: 'images' },
  { dir: 'src/assets', dest: 'assets' },
];

const EXT_OK = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.mp4', '.webm', '.pdf', '.ico']);
const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.pdf': 'application/pdf', '.ico': 'image/x-icon',
};

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true);
};
const BUCKET = flag('bucket', 'loja');
const PREFIX = flag('prefix', '') === true ? '' : (flag('prefix', '') || '');
const DRY = args.includes('--dry-run');
const FORCE = args.includes('--force');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar.');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (EXT_OK.has(extname(e.name).toLowerCase())) out.push(full);
  }
  return out;
}

async function ensureBucket() {
  const { data } = await supabase.storage.listBuckets();
  if (data?.some((b) => b.name === BUCKET)) return;
  console.log(`Bucket "${BUCKET}" não existe — criando (privado).`);
  const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (error) throw error;
}

async function main() {
  await ensureBucket();

  let ok = 0, skip = 0, fail = 0;
  for (const src of SOURCES) {
    const abs = join(ROOT, src.dir);
    try { await stat(abs); } catch { continue; }
    const files = await walk(abs);
    for (const file of files) {
      const rel = relative(abs, file).split(/[\\/]/).join('/');
      const key = posix.join(PREFIX, src.dest, rel).replace(/^\/+/, '');
      if (DRY) { console.log(`[dry-run] ${src.dir}/${rel} -> ${BUCKET}/${key}`); ok++; continue; }
      const body = await readFile(file);
      const { error } = await supabase.storage.from(BUCKET).upload(key, body, {
        contentType: MIME[extname(file).toLowerCase()] || 'application/octet-stream',
        upsert: FORCE,
      });
      if (error) {
        if (!FORCE && /exists/i.test(error.message)) { console.log(`= existe   ${key}`); skip++; }
        else { console.error(`x falhou   ${key}: ${error.message}`); fail++; }
      } else { console.log(`+ enviado  ${key}`); ok++; }
    }
  }
  console.log(`\nEnviados: ${ok} | Já existiam: ${skip} | Falhas: ${fail}`);
  console.log(`Caminho no bucket: ${BUCKET}/${PREFIX ? PREFIX + '/' : ''}<pasta>/<arquivo>`);
  console.log('Bucket privado: use createSignedUrl no app. Público: /storage/v1/object/public/' + BUCKET + '/<caminho>');
}

main().catch((e) => { console.error(e); process.exit(1); });
