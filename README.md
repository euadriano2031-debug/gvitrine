# Loja Vitrine / G-Vitrine — código-fonte completo

Este pacote contém o código-fonte atual do site, Painel Admin, componentes de personalização, integração Supabase, migrations e o instalador SQL numerado para um banco Supabase novo.

## 1. Instalação do banco Supabase novo

1. Crie um projeto novo no Supabase.
2. Abra **SQL Editor**.
3. Leia `SUPABASE_INSTALACAO/00-LEIA-ME-ORDEM.md`.
4. Execute **um arquivo de cada vez**, na ordem `01` até `11`, aguardando cada um terminar.
5. Antes de executar `09-admin-e-loja-inicial.sql`, crie o usuário proprietário em **Authentication → Users** com o e-mail administrativo definido nesse script.
6. Execute `11-verificacao.sql` e revise os resultados.

Use apenas `SUPABASE_INSTALACAO/01-...sql` a `11-...sql` para provisionar um banco vazio. A pasta `supabase/migrations/` é o histórico de alterações incrementais para um banco que já usa este sistema; **não execute o instalador completo e depois todas as migrations por cima do mesmo banco**.

## 2. Configurar a aplicação para seu Supabase

1. Instale Node.js LTS compatível (Node 20.19+).
2. Copie `.env.example` para `.env`.
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com os dados do seu próprio projeto Supabase.
4. Nunca use `SUPABASE_SERVICE_ROLE_KEY` em variáveis `VITE_*`, no navegador ou em código cliente. Ela é secreta.
5. No terminal, execute:

```bash
npm install
npm run dev
```

Abra a URL local indicada pelo terminal. Para validar a compilação de produção:

```bash
npm run build
```

O build produz a saída de aplicação e gera a pasta `dist/` para arquivos estáticos compatíveis; veja a observação de hospedagem abaixo.

## 3. Publicar na Vercel

Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em **Project Settings → Environment Variables**, marque Production/Preview/Development conforme necessário e faça um novo deploy. O código mantém um fallback para a conexão de produção atual quando essas variáveis não existem, por isso é importante configurar o seu próprio projeto antes de compilar o pacote para outra instalação.

## 4. O que há no pacote

- `src/`: site, rotas, Painel Admin e componentes.
- `supabase/migrations/`: migrations incrementais do schema.
- `SUPABASE_INSTALACAO/`: scripts SQL numerados para provisionar banco novo.
- `public/`: arquivos públicos e assets da aplicação.
- `scripts/`: scripts de empacotamento e geração de `dist/`.
- `.env.example`: modelo sem credenciais privadas.
- `docs/`: documentação técnica.

## 5. Limites importantes

O ZIP inclui o código, estrutura SQL e dados iniciais de exemplo; **não é um dump dos dados privados atuais de produção**. Imagens e vídeos que foram enviados por usuários para o Storage não são embutidos no código-fonte: precisam ser migrados separadamente para o bucket `loja`. URLs externas dos produtos permanecem como referências armazenadas no banco.

O projeto usa TanStack Start/Nitro (renderização de servidor). Hospedagem estática simples, sem suporte a Node/SSR, não hospeda todas as funções do sistema de forma equivalente. Use Vercel ou um host com suporte ao runtime da aplicação para o site completo.

Consulte `SUPABASE_INSTALACAO/README.md` e `SUPABASE_INSTALACAO/00-LEIA-ME-ORDEM.md` para detalhes do banco e do backup automático.
