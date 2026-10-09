# G-Vitrine — código-fonte

Aplicação de vitrine e painel administrativo usando React, TanStack Start, TypeScript e Supabase.

## Projeto Supabase conectado

- **Projeto:** GVITRINE
- **Project ref:** `jxyhzpvgihfkeduvomlu`
- **URL:** `https://jxyhzpvgihfkeduvomlu.supabase.co`

## Instalação local

1. Instale Node.js 20.19 ou superior.
2. Copie `.env.example` para `.env`.
3. Instale dependências: `npm ci` (ou `bun install`).
4. Inicie o ambiente: `npm run dev`.
5. Verifique a compilação: `npm run build`.

Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` conforme necessário no ambiente local e nas configurações de build/deploy. As chaves `sb_publishable_...` são próprias para o cliente; **nunca** exponha `SUPABASE_SERVICE_ROLE_KEY` ou `sb_secret_...` no navegador, em variáveis `VITE_*` ou no Git.

Operações administrativas privilegiadas que usam `supabaseAdmin` precisam de `SUPABASE_SERVICE_ROLE_KEY` configurada como segredo no ambiente do servidor. Não preencha esse valor no arquivo de exemplo.

## Banco de dados existente: leia antes de executar SQL

O projeto Supabase apontado já possui tabelas e dados. A pasta `SUPABASE_INSTALACAO/` contém scripts para **uma instalação nova**; não execute esses scripts no banco existente sem comparar cuidadosamente o schema. Faça mudanças por migrations incrementais revisadas e valide as políticas RLS antes de publicar.

A pasta `supabase/migrations/` contém arquivos de migração. Antes de aplicá-los, compare cada migration com o estado real do banco e confirme que ela ainda é necessária.

## Pastas principais

- `src/`: site, rotas, painel administrativo e integração Supabase.
- `supabase/migrations/`: histórico de migrações incrementais.
- `SUPABASE_INSTALACAO/`: scripts SQL para projeto de banco novo.
- `migracao-supabase/`: material e scripts auxiliares de migração.
- `public/` e `src/assets/`: imagens e outros recursos do site.
- `.env.example`: modelo seguro de configuração sem segredo privilegiado.

## Segurança

- `.env`, arquivos de ambiente e arquivos ZIP estão excluídos pelo `.gitignore`.
- Se uma chave de servidor já foi publicada, removê-la do arquivo não invalida cópias no histórico: rotacione-a no painel Supabase e atualize os segredos do servidor.
