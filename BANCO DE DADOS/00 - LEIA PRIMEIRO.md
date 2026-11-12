# BANCO DE DADOS — G-VITRINE

Esta pasta centraliza os arquivos SQL, migrations, modelo de dados, inventário e rotinas de backup do G-Vitrine. Os arquivos foram copiados dos diretórios originais do projeto e renomeados com numeração e nomes descritivos.

**Projeto Supabase:** `jxyhzpvgihfkeduvomlu`  
**URL:** `https://jxyhzpvgihfkeduvomlu.supabase.co`  
**Repositório:** https://github.com/euadriano2031-debug/gvitrine

## Estrutura desta pasta

| Pasta | Conteúdo | Uso |
|---|---|---|
| `01 - INSTALACAO NOVA` | 11 SQLs numerados, ordem de execução e guia | Criar um projeto Supabase novo e vazio |
| `02 - MIGRACOES DO SISTEMA` | Estrutura legada, isolamento multi-loja, RLS e CRM | Atualizar banco existente após auditoria |
| `03 - MIGRACOES HISTORICAS` | Migrações anteriores de backup, vitrine e personalização | Histórico/referência; não executar em lote |
| `04 - BACKUP E AUDITORIA` | Inventário, consultas, dump do banco e Storage | Auditoria e backup privado |
| `05 - MODELO DE DADOS` | Schema Drizzle e journal | Referência de tipos/modelagem |
| `06 - ARQUIVOS LEGADOS` | Script monolítico antigo e configuração Supabase | Consulta histórica; não usar como instalador padrão |

## Qual pasta usar?

### A) Projeto Supabase novo, vazio

1. Abra `01 - INSTALACAO NOVA/00 - ORDEM DE EXECUCAO.md`.
2. Leia também `12 - GUIA DE INSTALACAO.md`.
3. Crie o projeto Supabase e o usuário proprietário no Authentication quando o guia orientar.
4. Execute somente os arquivos `01` a `11`, um por vez, no SQL Editor, na ordem indicada.
5. Rode a verificação do passo 11.

### B) Banco de produção já existente

**Não execute a pasta de instalação nova. Não execute todas as migrações históricas em sequência.**

1. Faça primeiro um backup usando `04 - BACKUP E AUDITORIA/02 - BACKUP SUPABASE POWERSHELL.ps1`.
2. Consulte o inventário em `04 - BACKUP E AUDITORIA/04 - INVENTARIO DO BANCO ATUAL.md`.
3. Confira quais migrations já foram aplicadas no histórico do Supabase.
4. Leia o arquivo da migração específica e verifique as dependências.
5. Aplique apenas uma migração que esteja realmente pendente, depois de testar em ambiente de desenvolvimento.
6. Rode as verificações e valide site e painel administrativo.

## Situação registrada do histórico remoto

Na consulta ao projeto em 12/11/2026, o histórico do Supabase listou estas versões:

| Versão remota | Nome registrado | Arquivo correspondente nesta pasta |
|---|---|---|
| 20261012073507 | tenant_admin_isolation | `02/09 - ISOLAMENTO TOTAL DAS LOJAS.sql` |
| 20261012074129 | tenant_reference_integrity | `02/10 - INTEGRIDADE DE REFERENCIAS POR LOJA.sql` |
| 20261012074232 | isolate_public_storefront_reads | `02/11 - ISOLAR LEITURAS PUBLICAS POR LOJA.sql` |
| 20261012080602 | restore_neutral_admin_active_tab_color | `02/12 - RESTAURAR COR NEUTRA DA ABA ADMIN.sql` |
| 20261012085125 | crm_kanban_leads | `02/13 - CRM KANBAN E ATIVIDADES.sql` |
| 20261012085201 | crm_manual_lead_insert | `02/14 - PERMITIR CRIAR LEADS MANUAIS.sql` |
| 20261012092658 | crm_commercial_values | `02/15 - VALORES COMERCIAIS DO CRM.sql` |

**Atenção:** outras migrations locais, inclusive a de isolamento do tema do painel e arquivos legados de `supabase/migrations`, não apareceram nessa lista remota. Isso não significa automaticamente que seus efeitos não estejam no banco; podem ter sido aplicadas por outro caminho. Inspecione o schema antes de executar qualquer uma delas. Não use `supabase db push`, `migration repair` ou scripts antigos sem reconciliar os históricos local e remoto.

## Backup real de produção

O conteúdo desta pasta contém código de estrutura e scripts; não contém um dump dos dados privados atuais.

Para exportar o banco:
1. Obtenha a connection string PostgreSQL em Supabase Dashboard → Connect.
2. Defina `SUPABASE_DB_URL` somente na sessão local do PowerShell.
3. Execute `04 - BACKUP E AUDITORIA/02 - BACKUP SUPABASE POWERSHELL.ps1`.
4. O dump é gravado em `BACKUP-DADOS-LOCAL`, fora desta pasta de documentação. Guarde-o privadamente.

Objetos binários do Storage são exportados separadamente pelo arquivo `04 - BACKUP E AUDITORIA/03 - EXPORTAR STORAGE.mjs`. Usuários e credenciais do Auth, hashes de senha, provedores, SMTP, API keys e secrets do projeto precisam ser recriados ou configurados de forma segura; não coloque essas informações no Git.

## Regras de segurança e preservação

- Nunca execute SQL de instalação sobre o banco de produção existente.
- Nunca aplique migration sem confirmar que ainda está pendente.
- Não use `DROP`, `TRUNCATE`, `DELETE` em lote nem comandos de restauração sem backup e análise prévia.
- Não remova permissões de RPC pública sem atualizar e testar a vitrine que depende dela.
- Nunca publique connection strings, senhas, service-role keys, secret keys ou dados pessoais.
- As cópias organizadas desta pasta não substituem os arquivos originais que o projeto já usa. Os diretórios antigos foram preservados para compatibilidade.
- Após qualquer alteração no banco, teste login, vitrine pública, produtos, categorias, configurações, leads, CRM, tema e saída do painel administrativo.

## Data e responsabilidade

Inventário e histórico consultados em 12/11/2026. Contagens de registros e avisos de segurança podem mudar ao longo do tempo. Consulte sempre o Supabase antes de uma atualização.
