# Migração do banco — Lovable Cloud → Supabase externo

Execute os arquivos **nesta ordem** no SQL Editor do novo projeto:

| Ordem | Arquivo | O que faz |
|---|---|---|
| 1 | `01-estrutura.sql` | Tipos, funções (`has_role`, `slugify`, `set_updated_at`, `produtos_set_slug`), tabelas, GRANTs, RLS, políticas, triggers e índices |
| 2 | `02-dados.sql` | Catálogo completo: 9 categorias, 8 produtos (todos os campos e links) e 2 configurações (banner e botão de ajuda). `leads` fica vazia. |
| 3 | `03-storage.sql` | Bucket `loja` (privado) + política de acesso do admin |
| 4 | `04-admin.sql` | Concede papel de administrador ao seu e-mail (rodar **depois** de criar o usuário) |
| 5 | `05-verificacao.sql` | Consultas de conferência (contagens, RLS, políticas, slugs, admin) |

> Observação: o banco atual deste projeto remixado está **vazio** (nenhuma linha em `produtos`, `categorias`, `configuracoes`, `leads`). O `02-dados.sql` traz o catálogo original completo, para você já subir o novo projeto com a loja populada. Se quiser começar do zero, basta não rodar o passo 2.

---

## Passo a passo

### 1. Crie o projeto Supabase
Escolha a região mais próxima (ex.: São Paulo) e **guarde a senha do banco**. Em *Project Settings → API* anote:
- `Project URL`
- `anon / publishable key`
- `service_role / secret key` (nunca vai para o frontend)

### 2. Rode a estrutura
SQL Editor → New query → cole **todo** o `01-estrutura.sql` → Run.
Deve terminar sem erro. Em *Table Editor* devem aparecer 5 tabelas: `categorias`, `produtos`, `configuracoes`, `leads`, `user_roles`.

### 3. Rode os dados
SQL Editor → cole `02-dados.sql` → Run. Ele está dentro de `BEGIN/COMMIT`: se algo falhar, nada é gravado.
Os slugs dos produtos são gerados automaticamente pelo trigger no INSERT.

### 4. Configure a autenticação
- *Authentication → Providers → Email*: habilitado.
- Para testar rápido, desligue *Confirm email* (religue em produção).
- *Authentication → URL Configuration*: `Site URL` = domínio do app; em *Redirect URLs* adicione `http://localhost:8080/**` e `https://seudominio.com/**` — sem isso, reset de senha e login social falham.
- Mantenha *Prevent use of leaked passwords* ligado e use senha forte.

### 5. Crie o usuário admin e rode o `04-admin.sql`
*Authentication → Users → Add user* com `diano.baiano2015@gmail.com` (marque "Auto confirm"). Depois rode `04-admin.sql`.
> Usuários **não** migram junto com as tabelas: `auth.users` pertence ao Supabase e os IDs são novos. Para migrar muitos usuários, o caminho é a Admin API (`POST /auth/v1/admin/users`) com os hashes de senha.

### 6. Storage (imagens e vídeos)
Rode `03-storage.sql` — ou crie o bucket `loja` pelo painel (*Storage → New bucket*, **privado**) e rode apenas a parte de políticas.

Situação atual dos arquivos:
- O bucket `loja` do projeto atual está **vazio** — não há nada a copiar.
- As imagens dos produtos vêm do **próprio código** do app: `src/assets/*.asset.json` e `public/produtos/*.jpg`, servidas por caminhos relativos (`/__l5e/assets-v1/.../nome.jpg`). Elas continuam funcionando no novo projeto **sem nenhuma ação**, pois moram no repositório, não no Storage.
- Uma imagem é externa (`minio.afcode.com.br`) e também segue funcionando.

Se quiser centralizar tudo no Storage do novo Supabase:
1. Baixe as imagens de `src/assets/` / `public/produtos/` (ou abra as URLs `/__l5e/assets-v1/...` no site publicado).
2. Faça upload no bucket `loja`, pasta `produtos/` (arraste os arquivos no painel, ou use a CLI: `supabase storage cp ./produtos/whatsapp.jpg ss:///loja/produtos/whatsapp.jpg`).
3. Atualize os links no banco:
```sql
UPDATE public.produtos
SET imagem_url       = 'https://SEU-PROJETO.supabase.co/storage/v1/object/public/loja/produtos/whatsapp.jpg',
    popup_imagem_url = 'https://SEU-PROJETO.supabase.co/storage/v1/object/public/loja/produtos/whatsapp.jpg'
WHERE titulo = 'Zap Modelo Pro';
```
Com o bucket **privado** (padrão do app), não use URL pública: o painel admin já gera links assinados no upload (`createSignedUrl`).

### 7. Aponte o app para o novo banco
No `.env` (ou nas variáveis do host):
```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key
```
E no servidor (server functions): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
Regenere os tipos, se quiser: `npx supabase gen types typescript --project-id SEU_REF > src/integrations/supabase/types.ts`.

### 8. Validação final
Rode `05-verificacao.sql` e depois confira no site:
- [ ] Home lista 4 destaques + 4 produtos da vitrine, com imagens
- [ ] Botão de vídeo abre o popup do YouTube
- [ ] Página `/produto/:slug` abre com descrição completa e CTAs
- [ ] Botões Comprar / Ver Demo / WhatsApp abrem os links
- [ ] Login admin entra em `/admin` e lista os 8 produtos
- [ ] Editar/salvar produto e upload de imagem funcionam
- [ ] Banner e botão de ajuda editáveis em `/admin/banner` e `/admin/ajuda`
- [ ] Formulário de contato grava em `leads` e só o admin vê em `/admin/leads`

---

## Boas práticas
- **Nunca** exponha a `service_role key` no frontend; use somente em server functions.
- Mantenha `role` sempre em `user_roles` + `has_role()` (SECURITY DEFINER). Role no perfil abre escalada de privilégio.
- Todo `CREATE TABLE` em `public` precisa de `GRANT` + `ENABLE ROW LEVEL SECURITY` + políticas — RLS sozinho não basta, e GRANT sozinho é inseguro.
- Rode *Advisors → Security/Performance* depois da migração e resolva os alertas.
- Ative backups diários / Point-in-time recovery antes de ir para produção.
- Versione mudanças futuras como migrations (`supabase/migrations/*.sql`) em vez de editar pelo painel.
- Teste primeiro num projeto Supabase de rascunho; só depois rode no definitivo.

---

## Script automático de upload para o Storage

`migracao-supabase/upload-storage.mjs` copia todos os arquivos locais para o bucket `loja` preservando nomes e caminhos:

| Origem local | Destino no bucket |
|---|---|
| `public/produtos/*` | `loja/produtos/*` |
| `public/images/*` | `loja/images/*` |
| `src/assets/*` | `loja/assets/*` |

```bash
npm i @supabase/supabase-js
export SUPABASE_URL=https://SEU-PROJETO.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

node migracao-supabase/upload-storage.mjs --dry-run   # simula, não envia
node migracao-supabase/upload-storage.mjs             # envia (pula os que já existem)
node migracao-supabase/upload-storage.mjs --force     # sobrescreve
```

Opções: `--bucket <nome>` (padrão `loja`), `--prefix <pasta>` (ex.: `v1`), `--dry-run`, `--force`.
O script cria o bucket como **privado** se ele ainda não existir. Com bucket privado, o app usa `createSignedUrl`; se torná-lo público, os arquivos ficam em `/storage/v1/object/public/loja/<caminho>`.
Use a `service_role key` apenas no seu terminal — nunca no frontend.

O resultado da verificação pós-carga está em `06-checklist-resultado.md`.
