# Inventário do Supabase — G-Vitrine

**Projeto:** `jxyhzpvgihfkeduvomlu`  
**URL:** `https://jxyhzpvgihfkeduvomlu.supabase.co`  
**Data da consulta:** 12/11/2026 (UTC)

> Contagens são uma fotografia do banco no momento da consulta e podem mudar com o uso do aplicativo. Este inventário não contém dados pessoais, senhas, chaves ou payloads de backup.

## Tabelas públicas

| Tabela | Registros | RLS |
|---|---:|---|
| organizations | 2 | habilitado |
| user_roles | 0 | habilitado |
| saas_plans | 1 | habilitado |
| organization_members | 2 | habilitado |
| organization_subscriptions | 2 | habilitado |
| categorias | 13 | habilitado |
| produtos | 9 | habilitado |
| configuracoes | 20 | habilitado |
| leads | 1 | habilitado |
| loja_backups | 10 | habilitado |
| crm_activities | 1 | habilitado |

Todas as 11 tabelas do schema `public` listadas estavam com Row Level Security habilitado.

## Dados separados por loja

| Loja | Slug | Situação | Categorias | Produtos | Configurações | Leads | Atividades CRM | Backups |
|---|---|---|---:|---:|---:|---:|---:|---:|
| AP SISTEMAS | `apsistemas` | ativa | 4 | 1 | 11 | 1 | 1 | 5 |
| KI-VITRINE | `ki-vitrine` | ativa | 9 | 8 | 9 | 0 | 0 | 5 |

Os dados de cada loja estão associados ao respectivo `organization_id`. As funções e políticas de isolamento estão versionadas em `migracao-supabase/`.

## Storage

A consulta de inventário encontrou **0 buckets e 0 objetos** no projeto no momento da verificação. O script `ENTREGA/exportar-storage.mjs` permanece disponível para exportar mídias caso arquivos sejam adicionados futuramente.

## Histórico remoto de migrations

O Supabase registrou as seguintes 7 migrations:

| Versão remota | Nome registrado |
|---|---|
| 20261012073507 | tenant_admin_isolation |
| 20261012074129 | tenant_reference_integrity |
| 20261012074232 | isolate_public_storefront_reads |
| 20261012080602 | restore_neutral_admin_active_tab_color |
| 20261012085125 | crm_kanban_leads |
| 20261012085201 | crm_manual_lead_insert |
| 20261012092658 | crm_commercial_values |

O arquivo `migracao-supabase/20261012030000_isolar_tema_painel.sql` está versionado no GitHub, mas não apareceu nesta listagem de histórico remoto. Antes de reaplicá-lo, confira se as alterações correspondentes já existem no banco.

**Atenção:** o diretório `supabase/migrations/` também contém migrations legadas de datas anteriores. A listagem remota atual não mostrou essas versões. Não execute `supabase db push`, `migration repair` nem scripts de instalação sobre produção sem reconciliar primeiro o histórico local e remoto. Os 11 scripts de `SUPABASE_INSTALACAO/` são para um banco realmente novo e vazio, nunca para o banco atual.

## Relatórios do Supabase Advisors

A consulta de 12/11/2026 retornou avisos que ainda merecem revisão:

### Segurança
- 1 aviso: extensão `pg_net` instalada no schema `public`.
- 8 funções `SECURITY DEFINER` executáveis por `anon` (incluindo RPCs públicas usadas pela vitrine).
- 14 funções `SECURITY DEFINER` executáveis por `authenticated` (incluindo funções de backup e autorização).
- Proteção de senha vazada do Supabase Auth está desativada.

A existência de uma função nessas listas não prova, por si só, exploração; cada função precisa ser revisada conforme a autorização interna e o uso pretendido. Não remova permissões das RPCs públicas sem atualizar a vitrine junto, pois isso pode interromper consultas e envio de contatos.

### Desempenho
- 6 chaves estrangeiras sem índice de cobertura.
- 32 avisos de reavaliação por linha de expressões `auth.*` em políticas RLS.

Links de referência:
- [Security Advisor — SECURITY DEFINER executável por anon](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Security Advisor — SECURITY DEFINER executável por authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Performance Advisor — chaves estrangeiras sem índice](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
- [Performance Advisor — RLS initplan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)
- [Supabase Auth — proteção de senhas vazadas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

## O que este inventário não representa

Este documento é somente um inventário e não um dump restaurável. Para obter o backup real do banco, use `ENTREGA/backup-supabase.ps1` com a connection string PostgreSQL do projeto. O script cria exports separados de roles, schema, dados e histórico de migrations. O Storage é exportado separadamente. Usuários do Auth, hashes de senha, provedores, SMTP, secrets, API keys e configurações do projeto precisam ser recriados ou configurados no projeto de destino.
