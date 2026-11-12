-- PASSO 1 — extensões e tipos
create extension if not exists pgcrypto;

do $$
begin
  execute 'create extension if not exists pg_cron with schema pg_catalog';
exception when others then
  raise notice 'pg_cron não disponível neste projeto; o banco continuará instalando sem o agendamento automático.';
end $$;

do $$
begin
  execute 'create extension if not exists pg_net';
exception when others then
  raise notice 'pg_net não disponível neste projeto; o banco continuará instalando.';
end $$;

do $$
begin
  create type public.app_role as enum ('admin', 'user');
exception when duplicate_object then
  null;
end $$;
