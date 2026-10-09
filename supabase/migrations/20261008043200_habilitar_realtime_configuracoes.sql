-- Permite que alterações de configurações da loja sejam recebidas em tempo real pelo site público.
alter publication supabase_realtime add table public.configuracoes;
