-- ============================================================
-- PASSO 4 — CONCEDER ACESSO DE ADMINISTRADOR
-- Rode SÓ DEPOIS de criar o usuário no novo projeto
-- (Authentication > Users > Add user, ou cadastrando pela tela /auth)
-- Os IDs de auth.users NÃO são migrados: são novos no projeto novo.
-- ============================================================

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('diano.baiano2015@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Conferir:
SELECT u.email, r.role
FROM public.user_roles r
JOIN auth.users u ON u.id = r.user_id;
