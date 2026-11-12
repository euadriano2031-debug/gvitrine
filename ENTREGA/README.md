# Entrega — G-Vitrine

**Repositório:** https://github.com/euadriano2031-debug/gvitrine  
**Projeto Supabase de referência:** `jxyhzpvgihfkeduvomlu`  
**URL Supabase:** `https://jxyhzpvgihfkeduvomlu.supabase.co`  
**Snapshot de código:** commit `41b00d756fa4ae14837e7b9294ab4036e2eeb072` (12/11/2026)

## Pacotes e componentes

- Código-fonte: site público, rotas, painel administrativo, CRM/Kanban, componentes, assets, testes e configurações.
- `SUPABASE_INSTALACAO/`: instalador em etapas numeradas para um projeto Supabase novo e vazio.
- `migracao-supabase/`: scripts incrementais de isolamento por loja, tema administrativo e CRM.
- `supabase/migrations/`: migrations legadas já existentes no repositório.
- `ENTREGA/`: backup local, inventário e scripts para exportar Storage.

## Instalar um projeto Supabase novo

1. Crie um projeto novo e um usuário proprietário em Authentication.
2. Leia `SUPABASE_INSTALACAO/00-LEIA-ME-ORDEM.md`.
3. Execute os arquivos SQL 01 a 11, um por vez, nessa ordem.
4. Aplique as alterações incrementais listadas no guia de migração somente depois de conferir dependências, versões e histórico.
5. Configure as variáveis do app usando `.env.example` como modelo.
6. Rode a verificação do SQL, faça o build e teste o site e o painel em um projeto separado.

Não execute os arquivos de instalação no banco de produção que já possui tabelas e dados.

## Banco existente de produção

Em 12/11/2026, o inventário encontrou 2 lojas ativas, 9 produtos, 13 categorias, 20 configurações, 1 lead, 1 atividade de CRM e 10 backups. Todas as 11 tabelas públicas estavam com RLS habilitado.

O histórico remoto listou sete migrations de tenant isolation e CRM. O repositório também possui migrations antigas em `supabase/migrations/` e um script de tema em `migracao-supabase/` que não aparece no histórico remoto. **Não use `supabase db push` ou `migration repair` até reconciliar o histórico.** Veja `ENTREGA/inventario-banco.md`.

## Criar um backup real do banco

O código-fonte não inclui os registros privados de produção. Para gerar um dump lógico completo de schema, papéis e dados:

1. Instale Node.js e Docker Desktop.
2. Obtenha a connection string PostgreSQL em Supabase Dashboard → Connect.
3. No PowerShell, defina a variável somente para a sessão atual:
   `$env:SUPABASE_DB_URL = 'postgresql://...'`
4. Execute `./ENTREGA/backup-supabase.ps1`.

O script cria uma pasta privada `BACKUP-DADOS-LOCAL/<data-hora>/` com roles, schema, dados e histórico de migrations. Não envie essa pasta ao GitHub: ela pode conter dados pessoais, contatos e configurações comerciais.

O CLI exclui schemas gerenciados (como `auth` e `storage`) do dump normal. Usuários, hashes/senhas, provedores OAuth, SMTP, secrets e API keys precisam ser recriados/configurados. Objetos binários do Storage são exportados separadamente por `ENTREGA/exportar-storage.mjs`.

## Configurar o aplicativo

Copie `.env.example` para `.env`. Configure a URL Supabase e a publishable key. Nunca exponha `service_role` ou secret keys em variáveis `VITE_*` nem no navegador.

## Validação e avisos conhecidos

O código do commit acima passou nos dois builds e nos oito testes automatizados de navegação do site e acesso administrativo. Isso não é uma garantia matemática de ausência de falhas em todos os fluxos e ambientes.

O Supabase Advisors ainda mostra avisos de SECURITY DEFINER, extensão `pg_net` no schema `public`, proteção de senha vazada desativada e oportunidades de indexação/otimização RLS. Eles estão descritos no inventário; precisam de revisão controlada antes de afirmar que a base não tem alertas.
