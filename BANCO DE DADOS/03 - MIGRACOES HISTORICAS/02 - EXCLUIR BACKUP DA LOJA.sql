-- Exclusão manual e segura de backups individuais por loja.
-- O painel usa esta função para remover definitivamente o registro e o payload
-- do backup no banco do Supabase, sempre dentro da organização ativa.

create or replace function public.excluir_backup_da_loja(
  _organization_id uuid,
  _backup_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_deleted integer := 0;
begin
  if not (
    public.is_organization_admin(_organization_id)
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  ) then
    raise exception 'Apenas administradores da loja podem excluir backups.';
  end if;

  if _organization_id is null or _backup_id is null then
    raise exception 'Loja ou backup inválido.';
  end if;

  delete from public.loja_backups
  where id = _backup_id
    and organization_id = _organization_id;

  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    raise exception 'Backup não encontrado para esta loja.';
  end if;

  return true;
end;
$function$;

revoke all on function public.excluir_backup_da_loja(uuid, uuid) from public, anon;
grant execute on function public.excluir_backup_da_loja(uuid, uuid) to authenticated, service_role;
