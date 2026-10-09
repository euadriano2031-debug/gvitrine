<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Decisions
- New stores copy the model store (rows with organization_id NULL) via DB trigger `clonar_loja_modelo` — every new admin starts with the same catalog/config.
- Tenant product links use `/loja/$slug/produto/$productSlug`, read through the `public_produto_por_loja` RPC — shareable WhatsApp links land on the exact product.
