-- Corrige o acesso público das lojas multi-tenant.
-- Categorias e produtos ativos de lojas ativas devem ser visíveis sem login.

drop policy if exists "Categorias publicas legadas" on public.categorias;
create policy "Categorias publicas de lojas ativas"
  on public.categorias
  for select to anon
  using (
    organization_id is null
    or public.is_organization_active(organization_id)
  );

drop policy if exists "Produtos ativos legados sao publicos" on public.produtos;
create policy "Produtos ativos de lojas ativas sao publicos"
  on public.produtos
  for select to anon
  using (
    ativo = true
    and (
      organization_id is null
      or public.is_organization_active(organization_id)
    )
  );

drop policy if exists "Configuracoes publicas legadas" on public.configuracoes;
create policy "Configuracoes publicas de lojas ativas"
  on public.configuracoes
  for select to anon
  using (
    organization_id is null
    or (
      public.is_organization_active(organization_id)
      and chave in (
        'banner',
        'ajuda',
        'marca',
        'card_textos',
        'compartilhamento',
        'produto_beneficios',
        'favicon'
      )
    )
  );
