# DADOS DO LOJA ATUAL — Snapshot do Supabase em produção

**Projeto Supabase:** `jxyhzpvgihfkeduvomlu`  
**URL Supabase:** `https://jxyhzpvgihfkeduvomlu.supabase.co`  
**Repositório:** `https://github.com/euadriano2031-debug/gvitrine`  
**Data de captura:** 12/11/2026

Esta pasta documenta o banco que está integrado às três URLs informadas. As três URLs usam **um único projeto Supabase / um único banco PostgreSQL multi-loja**, com isolamento lógico por `organization_id` e slug; não são três bancos físicos independentes.

## Mapeamento das vitrines

| URL | Organização do banco | Slug | Observação |
|---|---|---|---|
| https://vitrinemax.vercel.app | KI-VITRINE | `ki-vitrine` | A rota raiz `/` resolve explicitamente a organização KI-VITRINE no código-fonte atual |
| https://vitrinemax.vercel.app/loja/ki-vitrine | KI-VITRINE | `ki-vitrine` | Vitrine explícita da organização KI-VITRINE |
| https://vitrinemax.vercel.app/loja/apsistemas | AP SISTEMAS | `apsistemas` | Vitrine explícita da organização AP SISTEMAS |

## Organização dos arquivos

### `00 - INVENTARIO ATUAL/`
Mapa das três URLs, contagem atual por tabela e organização, migrations registradas no Supabase e avisos retornados pelos Supabase Advisors.

### `01 - ESTRUTURA ATUAL DO BANCO/`
Snapshot de estrutura obtido por introspecção do PostgreSQL: DDL das 11 tabelas públicas, 140 colunas, 39 constraints, 34 políticas RLS, 14 índices que não são criados automaticamente por constraints, 29 funções, 12 triggers, extensões instaladas, privilégios observados e política do Storage.

### `02 - DADOS ATUAIS POR LOJA/`
Snapshots JSON separados por organização:
- KI-VITRINE: 8 produtos, 9 categorias, 9 configurações.
- AP SISTEMAS: 1 produto, 4 categorias, 11 configurações.

Os snapshots incluem dados de catálogo, categorias, organização e configurações atuais por loja, mas mascaram tokens, URLs assinadas de Storage e campos de contato privado.

## Contagem atual observada

| Tabela pública | Registros |
|---|---:|
| organizations | 2 |
| user_roles | 0 |
| saas_plans | 1 |
| organization_members | 2 |
| organization_subscriptions | 2 |
| categorias | 13 |
| produtos | 9 |
| configuracoes | 20 |
| leads | 1 |
| crm_activities | 1 |
| loja_backups | 10 |

Todas as 11 tabelas públicas estão com RLS habilitado. `crm_activities` também está com FORCE ROW LEVEL SECURITY. O bucket Storage `loja` é privado e tinha 2 objetos na captura.

## Limite de segurança — repositório público

O repositório GitHub é público. Por isso, esta pasta **não contém um dump irrestrito de produção**. Foram omitidos:
- Linhas de `leads` e `crm_activities`, pois podem conter nomes, e-mails, telefones e anotações privadas de clientes.
- Payloads, checksums e registros completos da tabela `loja_backups`.
- Identificadores de usuários de Auth, `owner_user_id`, `created_by`, associações de membros e IDs externos de cobrança.
- Nomes/caminhos de objetos do Storage.
- Tokens de URLs assinadas, números de telefone e links WhatsApp com número privado.

Os snapshots de catálogo e configurações públicas tiveram esses campos removidos ou mascarados. Não há credenciais, senhas, service-role keys, access tokens ou connection strings nesta pasta.

Para um backup integral que inclua dados pessoais e payloads de backup, gere um dump privado usando a connection string PostgreSQL e guarde-o em local privado ou em repositório privado. **Nunca publique o dump integral neste repositório público.**

## Como interpretar/restaurar

1. Leia `00 - INVENTARIO ATUAL/05 - ORDEM DE RESTAURACAO E VALIDACAO.md`.
2. Use os arquivos de estrutura como fotografia do schema atual, não como script para executar sobre o banco de produção.
3. O DDL pressupõe que os schemas gerenciados pelo Supabase (especialmente `auth` e `storage`) já existam e que dependências de extensões/funções estejam preparadas.
4. Os arquivos de políticas, funções, triggers, índices e privilégios são divididos para revisão; não os execute indiscriminadamente sobre produção.
5. Use `SUPABASE_INSTALACAO/` ou `BANCO DE DADOS/01 - INSTALACAO NOVA/` como guia de criação de projeto vazio, reconciliando dependências com esta fotografia atual.
6. Restauração de dados sensíveis depende de backup privado e recriação das contas de Auth; estes itens não estão neste repositório.

## Avisos atuais

O arquivo `00 - INVENTARIO ATUAL/03 - AVISOS DO SUPABASE ADVISORS.json` registra os avisos encontrados em 12/11/2026, incluindo funções SECURITY DEFINER executáveis por `anon` ou `authenticated`, extensão `pg_net` no schema public, chaves estrangeiras sem índice e oportunidades de otimização de políticas RLS. Não remova EXECUTE das RPCs da vitrine sem primeiro revisar dependências e testar o site.

**Este é um snapshot de documentação e dados publicáveis, não um backup integral de produção nem uma garantia de restauração automática sem ajustes.**
