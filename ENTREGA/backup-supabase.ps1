# Exporta o schema, dados e histórico de migrations do Supabase.
# Requisitos: Node.js, Docker Desktop ativo e acesso à connection string Postgres.
# O resultado contém dados privados; nunca envie BACKUP-DADOS-LOCAL ao Git.
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DB_URL)) {
  throw @'
Defina SUPABASE_DB_URL apenas nesta sessão do PowerShell.
Copie a connection string em Supabase Dashboard > Connect.
Exemplo:
  $env:SUPABASE_DB_URL = 'postgresql://postgres:SENHA@db.PROJECT-REF.supabase.co:5432/postgres'
Não coloque o valor real no Git, em .env.example ou neste script.
'@
}

$root = Split-Path -Parent $PSScriptRoot
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = Join-Path (Join-Path $root "BACKUP-DADOS-LOCAL") $timestamp
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$remoteArg = "--remote=$($env:SUPABASE_DB_URL)"

function Invoke-SupabaseDump {
  param(
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [Parameter(Mandatory = $true)][string]$Description
  )
  Write-Host $Description
  & npx --yes supabase db dump @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Falha: $Description"
  }
}

Invoke-SupabaseDump -Description "Exportando papéis PostgreSQL..." -Arguments @(
  $remoteArg, "--file", (Join-Path $outDir "01-roles.sql"), "--role-only"
)

Invoke-SupabaseDump -Description "Exportando schema do banco..." -Arguments @(
  $remoteArg, "--file", (Join-Path $outDir "02-schema.sql")
)

Invoke-SupabaseDump -Description "Exportando dados..." -Arguments @(
  $remoteArg, "--file", (Join-Path $outDir "03-data.sql"), "--use-copy", "--data-only",
  "--exclude", "storage.buckets_vectors", "--exclude", "storage.vector_indexes"
)

Invoke-SupabaseDump -Description "Exportando estrutura do histórico de migrations..." -Arguments @(
  $remoteArg, "--file", (Join-Path $outDir "04-migration-history-schema.sql"), "--schema", "supabase_migrations"
)

Invoke-SupabaseDump -Description "Exportando registros do histórico de migrations..." -Arguments @(
  $remoteArg, "--file", (Join-Path $outDir "05-migration-history-data.sql"), "--use-copy", "--data-only",
  "--schema", "supabase_migrations"
)

@"
G-VITRINE — BACKUP DO SUPABASE
Gerado em: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
Projeto de origem: jxyhzpvgihfkeduvomlu

Arquivos:
- 01-roles.sql: papéis PostgreSQL personalizados.
- 02-schema.sql: schema do banco não gerenciado pelo Supabase.
- 03-data.sql: dados das tabelas incluídas no dump.
- 04-migration-history-schema.sql: estrutura do histórico de migrations.
- 05-migration-history-data.sql: versões efetivamente registradas no histórico.

Limites:
- O Supabase CLI exclui schemas gerenciados, como auth e storage, e schemas de extensões.
- Usuários, hashes/senhas, provedores OAuth, SMTP, secrets e API keys do Auth não são exportados por estes arquivos.
- Objetos binários do Storage precisam de exportação separada com ENTREGA/exportar-storage.mjs.
- Guarde a pasta em local privado. Ela pode conter dados pessoais e comerciais.
- Teste a restauração em um projeto separado antes de usar em produção.
"@ | Set-Content -Path (Join-Path $outDir "LEIA-ME-BACKUP.txt") -Encoding UTF8

Write-Host "Backup criado em: $outDir"
Write-Host "Exporte os objetos do Storage separadamente, se houver buckets/arquivos."
