# Exporta papéis, schema e dados do banco Supabase para uma pasta local.
# Pré-requisitos: Node.js/npm, Docker Desktop ativo e connection string do banco.
# Não execute este script em pipelines públicos e não comite o resultado.
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DB_URL)) {
  throw @'
Defina SUPABASE_DB_URL apenas nesta sessão do PowerShell.
Copie a connection string em Supabase Dashboard > Connect.
Exemplo:
  $env:SUPABASE_DB_URL = 'postgresql://postgres:...@db....supabase.co:5432/postgres'
Não coloque o valor real no Git ou neste script.
'@
}

$root = Split-Path -Parent $PSScriptRoot
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = Join-Path (Join-Path $root "BACKUP-DADOS-LOCAL") $timestamp
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

Write-Host "Exportando papéis..."
npx supabase db dump --db-url $env:SUPABASE_DB_URL --file (Join-Path $outDir "01-roles.sql") --role-only
if ($LASTEXITCODE -ne 0) { throw "Falha ao exportar papéis." }

Write-Host "Exportando schema..."
npx supabase db dump --db-url $env:SUPABASE_DB_URL --file (Join-Path $outDir "02-schema.sql")
if ($LASTEXITCODE -ne 0) { throw "Falha ao exportar schema." }

Write-Host "Exportando dados..."
npx supabase db dump --db-url $env:SUPABASE_DB_URL --file (Join-Path $outDir "03-data.sql") --use-copy --data-only
if ($LASTEXITCODE -ne 0) { throw "Falha ao exportar dados." }

@"
G-VITRINE — BACKUP DO SUPABASE
Gerado em: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
Projeto: jxyhzpvgihfkeduvomlu

Arquivos:
- 01-roles.sql: papéis compatíveis para dump/restauração.
- 02-schema.sql: schema filtrado pelo Supabase CLI.
- 03-data.sql: dados exportados com COPY.

IMPORTANTE:
- Guarde estes arquivos em local privado.
- A mídia do Storage é exportada separadamente por ENTREGA/exportar-storage.mjs.
- Configurações de Auth, provedores OAuth, SMTP, secrets e API keys exigem verificação/reconfiguração separada.
- Antes de restaurar, use um projeto de teste e confira versões/extensions.
"@ | Set-Content -Path (Join-Path $outDir "LEIA-ME-BACKUP.txt") -Encoding UTF8

Write-Host "Backup criado em: $outDir"
Write-Host "Exportação do banco concluída. Exporte também o Storage com ENTREGA/exportar-storage.mjs."
