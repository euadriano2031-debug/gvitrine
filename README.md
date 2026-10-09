# G-Vitrine — código-fonte

Aplicação de vitrine e painel administrativo usando React, TanStack Start, TypeScript e Supabase.

## Projeto Supabase conectado

- **Projeto:** GVITRINE
- **Project ref:** `jxyhzpvgihfkeduvomlu`
- **URL:** `https://jxyhzpvgihfkeduvomlu.supabase.co`

## Instalação local

1. Instale Node.js 20.19 ou superior.
2. Copie `.env.example` para `.env`.
3. Instale dependências com `npm ci` (ou `bun install`).
4. Rode `npm run dev`.
5. Verifique a compilação com `npm run build`.

Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no ambiente de build/deploy. Chaves `sb_publishable_...` são próprias para o cliente; **nunca** exponha chaves `sb_secret_...` ou `service_role` no navegador, em variáveis `VITE_*` ou no Git.

Operações administrativas privilegiadas devem usar `SUPABASE_SECRET_KEY`, definida como segredo no ambiente do servidor. O código aceita temporariamente `SUPABASE_SERVICE_ROLE_KEY` para compatibilidade com configurações antigas; prefira a chave Secret moderna.

## Banco Supabase já existente

O projeto apontado já possui tabelas e dados. A pasta `SUPABASE_INSTALACAO/` contém scripts para **uma instalação nova**; não execute esses scripts no banco existente sem comparar cuidadosamente o schema. Revise cada migration incremental e confirme que ainda é necessária antes de aplicá-la.

## Pastas principais

- `src/`: site, rotas, painel administrativo e integração Supabase.
- `supabase/migrations/`: migrations incrementais.
- `SUPABASE_INSTALACAO/`: scripts SQL para projeto de banco novo.
- `migracao-supabase/`: material e scripts auxiliares de migração.
- `public/` e `src/assets/`: recursos visuais.
- `.env.example`: modelo sem chaves administrativas.

## Segurança

- `.env`, arquivos de ambiente e arquivos ZIP estão excluídos pelo `.gitignore`.
- Se uma chave administrativa já foi publicada, removê-la do arquivo não invalida cópias no histórico. Crie uma nova chave Secret no painel Supabase, atualize os segredos de todos os serviços que a utilizam e só então desative/retire a chave comprometida.
