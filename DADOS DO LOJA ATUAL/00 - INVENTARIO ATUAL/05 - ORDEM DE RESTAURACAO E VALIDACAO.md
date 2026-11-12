# Ordem de leitura, restauração e validação

## Snapshot da estrutura

1. `01 - ESTRUTURA ATUAL DO BANCO/01 - DDL DAS TABELAS ATUAIS.sql` — tipos, colunas, constraints e ativação de RLS.
2. `05 - FUNCOES PUBLICAS ATUAIS.sql` — funções que são dependências de políticas, triggers e RPCs.
3. `06 - TRIGGERS ATUAIS.sql` — triggers atuais do schema public.
4. `03 - POLITICAS RLS ATUAIS.sql` — políticas observadas no schema public.
5. `04 - INDICES ATUAIS.sql` — índices não criados automaticamente por PK/UNIQUE.
6. `07 - VIEWS ATUAIS.sql` — fotografia das views (nenhuma foi encontrada na captura).
7. `10 - POLITICAS ATUAIS DO STORAGE.sql` — política no schema gerenciado Storage, apenas para referência.
8. Arquivos JSON — colunas/constraints, privilégios, extensões instaladas e histórico remoto.

## Dados da loja

Os arquivos `02 - DADOS ATUAIS POR LOJA` são fotografias JSON sanitizadas. Não são SQL de importação e não podem reconstituir automaticamente os dados privados omitidos.

A restauração de organizações existentes em projeto novo exige criar usuários do Supabase Auth e associar cada organização ao proprietário correto. O campo `owner_user_id` não é incluído neste repositório público.

## Cuidados obrigatórios

- Não execute os arquivos em produção apenas para "atualizar"; a pasta descreve o schema atual e pode repetir objetos que já existem.
- Não aplique o DDL sobre tabelas atuais, pois constraints, policies, triggers e índices podem duplicar.
- Não aplique migrations antigas sem comparar com as 7 versões listadas em `00 - INVENTARIO ATUAL/02 - MIGRACOES REGISTRADAS NO SUPABASE.json`.
- O schema `auth` e o schema `storage` são gerenciados pelo Supabase e não são recriados pelo DDL de `public`.
- Revise os grants em `09 - PRIVILEGIOS OBSERVADOS PARA AUDITORIA.json` antes de reproduzir. Esse arquivo é uma fotografia, não uma lista automática de GRANT para ser aplicada.
- As funções SECURITY DEFINER e suas permissões precisam de revisão. Remover EXECUTE de uma RPC pública pode quebrar a vitrine.

## Verificação após restauração em projeto de teste

- Confirmar as 11 tabelas públicas, enum `app_role` e RLS.
- Confirmar isolamento entre `apsistemas` e `ki-vitrine`.
- Conferir produtos/categorias/configurações e as URLs da vitrine.
- Conferir o bucket `loja` e recriar objetos de Storage a partir de backup privado.
- Testar login, logout, edição de painel, vitrine raiz, vitrine por slug, leads, CRM, backup e restauração.
- Rodar Supabase Security Advisor e Performance Advisor.

A captura atual mostrou 34 políticas RLS no schema public e um policy no schema storage. A captura atual mostrou também 29 funções públicas, 12 triggers, 39 constraints e 14 índices adicionais.
