# Checklist de verificação — carga do catálogo (02-dados.sql)

Executado em 27/08/2026 no banco atual do projeto.

## 1. Contagens (05-verificacao.sql 5.1)

| Tabela | Esperado | Obtido | OK |
|---|---|---|---|
| categorias | 9 | 9 | ✅ |
| produtos | 8 | 8 | ✅ |
| configuracoes | 2 | 2 | ✅ |
| leads | 0 | 0 | ✅ |

## 2. RLS ligado em todas as tabelas de `public` (5.2)

`categorias`, `configuracoes`, `leads`, `produtos`, `user_roles` → todas com `rowsecurity = true`. ✅

## 3. Políticas (5.3)

11 políticas, exatamente as esperadas:

- categorias: admin (ALL) + leitura pública ✅
- configuracoes: admin (ALL) + leitura pública ✅
- leads: envio público (INSERT), admin lê, admin exclui ✅
- produtos: admin (ALL), admin lê todos, público lê apenas ativos ✅
- user_roles: usuário lê o próprio papel ✅

## 4. Slugs dos produtos (5.4) — nenhum nulo ✅

| Produto | Slug |
|---|---|
| Agenda PRO | agenda-pro |
| Zap Modelo Pro | zap-modelo-pro |
| Lovable Boost | lovable-boost |
| Crypto Trader Dash | crypto-trader-dash |
| Landing Page Builder | landing-page-builder |
| ERP Dashboard Pro | erp-dashboard-pro |
| Delivery App Completo | delivery-app-completo |
| Agenda & Agendamentos | agenda-agendamentos |

## 5. Consistência de dados e links

| Checagem | Resultado |
|---|---|
| Produtos sem slug | 0 ✅ |
| Categorias órfãs (categoria_id inexistente) | 0 ✅ |
| Produtos sem `checkout_url` | 0 ✅ |
| Produtos sem `imagem_url` | 0 ✅ |
| Produtos sem categoria (`categoria_id` nulo) | 4 — esperado: os 4 itens da vitrine usam `tags` em vez de categoria ℹ️ |
| Seção `destaque` | 4 produtos, todos ativos e marcados como destaque ✅ |
| Seção `vitrine` | 4 produtos, todos ativos ✅ |

## 6. Admin (5.5)

A consulta que cruza `user_roles` com `auth.users` não roda com o papel restrito usado aqui (`permission denied for schema auth`) — isso é esperado neste ambiente. No SQL Editor do Supabase ela funciona normalmente; rode-a depois de criar o usuário e aplicar o `04-admin.sql`.

## 7. Conferência visual no site

- [ ] Home lista 4 destaques + 4 produtos da vitrine, com imagens
- [ ] Popup de vídeo abre (YouTube)
- [ ] `/produto/agenda-pro` abre com descrição e CTAs
- [ ] Botões Comprar / Demo / WhatsApp abrem os links
- [ ] Login admin acessa `/admin` e lista os 8 produtos

## 8. Arquivos no Storage

Rode `node migracao-supabase/upload-storage.mjs` (veja o README) para copiar `public/produtos`, `public/images` e `src/assets` para o bucket `loja`, preservando nomes e caminhos.
