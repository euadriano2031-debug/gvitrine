# Instalação completa G-Vitrine no Supabase

Este diretório é o **instalador canônico** do banco usado pelo código atual da G-Vitrine.

## Ordem obrigatória

1. `01-extensoes-tipos.sql`
2. `02-tabelas.sql`
3. `03-funcoes.sql`
4. `04-triggers.sql`
5. `05-rls-grants-politicas.sql`
6. `06-planos.sql`
7. `07-storage.sql`
8. `08-backup-7d-60d.sql`
9. `09-admin-e-loja-inicial.sql`
10. `10-dados-iniciais.sql`
11. `11-verificacao.sql`

Execute **um arquivo por vez** no SQL Editor do projeto Supabase novo e aguarde o término antes de executar o próximo.

### Antes do passo 9

Crie o usuário administrativo em **Authentication → Users**. O script 09 procura o e-mail definido em `SET app.admin_email` e interrompe com erro claro se o usuário não existir.

### Importante

Não execute em paralelo os arquivos numerados. Não é necessário rodar novamente `banco-de-dados.sql` ou os arquivos antigos de `migracao-supabase/` depois de concluir esta pasta; os arquivos antigos permanecem no repositório apenas para histórico/compatibilidade.

O arquivo `.env` real não faz parte do pacote. Configure as variáveis no seu ambiente usando o `.env.example` incluído pelo código ou as configurações do Vercel.

O banco não contém binários de imagens/vídeos. As referências de mídia são armazenadas no banco; os assets que pertencem ao código estão dentro do repositório. Arquivos enviados para o Storage precisam ser copiados para o bucket `loja`.

## Multi-loja

Categorias, produtos, configurações, leads e backups usam `organization_id`. As constraints principais são por organização e as políticas RLS impedem acesso cruzado entre lojas.

## Backup

O sistema de backup é por loja, permite backup manual a qualquer hora e possui rotina automática a cada 7 dias. O ciclo de 60 dias é reiniciado automaticamente. O script 08 tenta instalar `pg_cron` e `pg_net`; se o ambiente não disponibilizar a extensão, a instalação do banco não falha, mas o agendamento automático precisará ser habilitado posteriormente.

## Depois de instalar

Execute `11-verificacao.sql`. O resultado deve mostrar RLS ativo, as tabelas principais, a loja inicial, o administrador, o bucket `loja` e o job de backup quando `pg_cron` estiver disponível.
