# Instalador Supabase — G-Vitrine

Use **somente** a sequência numerada de `SUPABASE_INSTALACAO/` para criar uma instalação nova do banco.

O pacote também preserva os SQLs históricos do repositório:
- `banco-de-dados.sql`
- `migracao-supabase/*.sql`
- `supabase/migrations/*.sql`

A pasta numerada foi montada para o estado SaaS/multi-loja atual e inclui:
- organizações e membros;
- catálogo completo;
- configurações por loja;
- leads;
- Storage privado;
- RLS por organização;
- RPCs públicas da vitrine;
- backup manual por loja;
- backup automático a cada 7 dias;
- ciclo de 60 dias;
- restauração com bloqueio cruzado entre lojas.

O código-fonte continua sendo o repositório completo. Dependências não são empacotadas; são instaladas com o gerenciador do projeto a partir do `package.json`/lockfile.

## Variáveis

Crie um `.env` local com:
```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=SUA_CHAVE_ANON
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE_ROLE
```

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no frontend.
