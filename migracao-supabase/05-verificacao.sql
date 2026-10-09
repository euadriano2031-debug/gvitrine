-- ============================================================
-- PASSO 5 — VERIFICAÇÃO FINAL (rode no novo projeto)
-- ============================================================

-- 5.1 Contagem de registros (esperado: 9 | 8 | 2 | 0)
SELECT (SELECT count(*) FROM public.categorias)    AS categorias,
       (SELECT count(*) FROM public.produtos)      AS produtos,
       (SELECT count(*) FROM public.configuracoes) AS configuracoes,
       (SELECT count(*) FROM public.leads)         AS leads;

-- 5.2 Todas as tabelas de public precisam estar com RLS ligado (rowsecurity = true)
SELECT tablename, rowsecurity
FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- 5.3 Políticas criadas (esperado: 11 no total)
SELECT tablename, policyname, cmd, roles
FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- 5.4 Slugs dos produtos (usados em /produto/:slug) — nenhum pode estar nulo
SELECT titulo, slug FROM public.produtos ORDER BY ordem;

-- 5.5 Admin configurado
SELECT u.email, r.role
FROM public.user_roles r JOIN auth.users u ON u.id = r.user_id;
