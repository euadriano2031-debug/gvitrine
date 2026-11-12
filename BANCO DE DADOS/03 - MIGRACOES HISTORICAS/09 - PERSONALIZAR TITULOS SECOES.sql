-- Permite que visitantes carreguem a personalização dos títulos/ícones
-- das seções da vitrine de cada loja ativa.
drop policy if exists "Configuracoes publicas de lojas ativas" on public.configuracoes;
create policy "Configuracoes publicas de lojas ativas"
  on public.configuracoes
  for select
  to anon
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
        'categoria_botoes',
        'botao_ver_mais',
        'titulos_secoes',
        'favicon'
      )
    )
  );
