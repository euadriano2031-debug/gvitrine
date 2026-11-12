# Dados privados não exportados

Esta pasta será versionada em um repositório GitHub público. A consulta ao Supabase em 12/11/2026 mostrou que há dados operacionais que não devem ser publicados como texto aberto.

## Contagens que foram preservadas no inventário

| Tipo de registro | Total |
|---|---:|
| Leads | 1 |
| Atividades CRM | 1 |
| Backups da loja | 10 |
| Membros de organizações | 2 |
| Assinaturas | 2 |
| Roles globais | 0 |
| Objetos no bucket privado `loja` | 2 |

O lead e sua atividade pertencem à AP SISTEMAS. Nenhum conteúdo dessas linhas foi exportado. Os dez backups também foram omitidos integralmente, pois a coluna `payload` guarda cópias de dados das lojas.

## Campos sensíveis removidos/mascarados nos snapshots de loja

- `owner_user_id`, `created_by`, `external_customer_id` e `external_subscription_id`.
- Campos de telefone/e-mail e chaves chamadas `numero`, `telefone`, `phone`, `email`.
- URLs assinadas do Storage que contêm `/storage/v1/object/sign/` ou parâmetro `token=`.
- Links `wa.me` / `api.whatsapp.com` que expõem números de contato.
- Nomes/caminhos de arquivos do bucket privado.

Os UUIDs de organização, produto e categoria são mantidos nos snapshots para documentar as relações e os vínculos entre dados públicos da loja. Eles não são chaves de autenticação.

## Como obter o backup integral com segurança

1. Gere o dump do PostgreSQL em máquina local usando uma connection string obtida em Supabase Dashboard → Connect.
2. Inclua dados de clientes/backups somente em armazenamento privado com controle de acesso.
3. Exporte arquivos binários do Storage separadamente, mantendo o bucket privado.
4. Recrie os usuários e configurações de Auth no projeto de destino sem exportar hashes/senhas para o Git.

Não coloque connection strings, service-role keys, tokens, dumps integrais ou arquivos privados do Storage no repositório público.
