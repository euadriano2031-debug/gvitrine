# Inventário do Supabase — G-Vitrine

Verificado em 2026-10-10. Projeto ref: jxyhzpvgihfkeduvomlu.

## Schema public

Os totais de linhas são uma fotografia do banco no momento da consulta e podem mudar conforme o uso da aplicação.

| Tabela | Linhas no momento da consulta | RLS |
|---|---:|---|
| organizations | 2 | habilitado |
| user_roles | 1 | habilitado |
| saas_plans | 1 | habilitado |
| organization_members | 2 | habilitado |
| organization_subscriptions | 2 | habilitado |
| categorias | 18 | habilitado |
| produtos | 29 | habilitado |
| configuracoes | 14 | habilitado |
| leads | 0 | habilitado |
| loja_backups | 2 | habilitado |

## Relacionamentos e áreas

- organizations é a entidade central das lojas/tenants.
- organization_members associa usuários às lojas e seus papéis.
- user_roles guarda papéis globais da aplicação.
- organization_subscriptions referencia organizações e planos.
- produtos referencia categorias e organizações.
- categorias, configuracoes, leads e loja_backups mantêm organization_id para o isolamento por loja.
- RLS estava habilitado em todas as 10 tabelas listadas no schema public.

## Storage

| Bucket | Visibilidade | Objetos |
|---|---|---:|
| loja | privado | 2 |

Os objetos armazenados não estão dentro dos arquivos SQL. O script ENTREGA/exportar-storage.mjs exporta arquivos do bucket para backup local quando executado com uma credencial administrativa local.

## Migrations

O repositório contém SQL em supabase/migrations/, mais scripts em migracao-supabase/ e SUPABASE_INSTALACAO/. A listagem de migrations remotas consultada pelo conector retornou uma lista vazia. Não interprete isso como prova de que a base esteja vazia ou sem alterações: o schema e os dados estão presentes. Compare o histórico e os scripts antes de aplicar migrations.

## Limites deste inventário

Este documento é um resumo, não um dump completo do DDL. Para exportar funções, triggers, políticas, dados e papéis de forma compatível com Supabase, use o script de backup e o Supabase CLI. Credenciais, chaves JWT, configurações do Auth/SMTP, e arquivos do Storage exigem cuidado e/ou exportação separada.
