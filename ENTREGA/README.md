# Pacote de entrega — G-Vitrine

Projeto fonte: https://github.com/euadriano2031-debug/gvitrine
Projeto Supabase de referência: jxyhzpvgihfkeduvomlu
URL do Supabase: https://jxyhzpvgihfkeduvomlu.supabase.co

## O que este pacote contém

- Código-fonte existente no repositório (site, painel administrativo, componentes, rotas, assets e configurações).
- Scripts SQL de instalação inicial e migrações que já estavam versionados.
- Tipos TypeScript sincronizados com o schema público atual do Supabase.
- Inventário do banco verificado em 2026-10-10.
- Scripts para fazer backup local do banco e dos objetos do Storage.

## Fonte não é um dump completo do banco

Por segurança, o ZIP de código-fonte **não contém** os registros reais do banco, credenciais, senhas, tokens nem os arquivos privados do Storage. Os scripts SQL registram estrutura e alterações, mas não substituem um backup dos dados reais em produção.

Para obter o backup real, siga backup-supabase.ps1 e exportar-storage.mjs neste diretório. Os arquivos gerados são privados e devem ficar no seu computador/armazenamento seguro, não no repositório público.

## Estrutura de banco

- SUPABASE_INSTALACAO/: scripts numerados para criar um banco **novo** do zero.
- supabase/migrations/: migrações incrementais versionadas junto com o projeto.
- migracao-supabase/: auxiliares e scripts da migração.
- banco-de-dados.sql: script SQL mais antigo incluído no projeto.
- ENTREGA/inventario-banco.md: resumo do schema remoto verificado.

**Não rode os scripts de SUPABASE_INSTALACAO em produção.** O banco atual já tem tabelas e dados. Antes de executar qualquer migration remota, confira a versão atual, a ordem e se ela já foi aplicada. A listagem de migrations do projeto retornou vazia na verificação realizada, embora o repositório contenha migrations; é necessário reconciliar o histórico antes de usar supabase db push.

## Variáveis para desenvolvimento

Copie .env.example para .env e confira os valores. A chave VITE_SUPABASE_PUBLISHABLE_KEY é publicável; chaves SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY só podem existir em ambientes locais ignorados pelo Git ou nos segredos do host. Nunca preencha uma chave administrativa em .env.example.

## Instalação local no Windows

1. Instale Node.js 22, Git e Docker Desktop.
2. Extraia o ZIP.
3. Copie .env.example para .env e configure as variáveis necessárias.
4. No PowerShell, na pasta raiz, execute: npm ci.
5. Execute npm run dev.
6. Verifique a compilação com npm run build.

## Backup real do banco e Storage

1. Gere a connection string no painel Supabase do projeto.
2. Defina SUPABASE_DB_URL somente na sessão local do PowerShell.
3. Execute ./ENTREGA/backup-supabase.ps1.
4. Defina SUPABASE_URL e uma chave administrativa atual somente na sessão local e execute node ./ENTREGA/exportar-storage.mjs.
5. Guarde a pasta BACKUP-DADOS-LOCAL em local seguro. Ela pode conter dados pessoais, leads, usuários, configurações e mídia privada.

O backup de dados reais ainda precisa ser executado no seu ambiente com suas credenciais. Este pacote não afirma conter os dados privados atuais, pois não é seguro publicar esses dados dentro do código-fonte público.

## Validação

O repositório inclui workflow de build/testes e workflow para gerar um ZIP de download. Veja a aba Actions e baixe o artefato mais recente após concluir os workflows.
