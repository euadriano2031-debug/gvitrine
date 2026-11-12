-- Cada configuração pertence a uma única chave por loja.
-- Isso permite salvar alterações de forma idempotente sem depender de uma leitura
-- anterior do registro.
create unique index if not exists configuracoes_organization_chave_uidx
  on public.configuracoes (organization_id, chave);
