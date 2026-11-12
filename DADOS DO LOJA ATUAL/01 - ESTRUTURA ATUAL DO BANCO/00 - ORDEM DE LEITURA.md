# Estrutura atual do banco — G-Vitrine

Os arquivos deste diretório foram consultados diretamente no projeto Supabase `jxyhzpvgihfkeduvomlu` em 12/11/2026.

- 11 tabelas do schema public.
- 140 colunas.
- 39 constraints (PK, UNIQUE, FK, CHECK).
- 34 políticas RLS no schema public.
- 14 índices adicionais não criados automaticamente por PK/UNIQUE constraints.
- 29 funções no schema public.
- 12 triggers.
- 0 views.
- 7 extensões efetivamente instaladas.
- 1 policy para arquivos no schema storage.
- 11 tabelas public com RLS ativo; `crm_activities` também com FORCE RLS.

Ordem recomendada de leitura em ambiente vazio: DDL de tabelas e constraints, extensões/dependências, funções, triggers, políticas RLS, índices e privilégios revisados. Esta ordem é orientativa: tabelas em Auth/Storage e extensões Supabase precisam já estar disponíveis.

Os arquivos `DDL`, `RLS`, `FUNCOES`, `TRIGGERS` e `INDICES` são snapshots de referência. Não execute sobre produção nem sobre uma base que já tenha esses objetos.
