import { createFileRoute, notFound } from "@tanstack/react-router";
import { fetchProdutoPorSlug } from "@/lib/loja";
import { ProdutoDetalheVitrine } from "@/components/loja/ProdutoDetalheVitrine";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ params }) => {
    const produto = await fetchProdutoPorSlug(params.slug, null);
    if (!produto) throw notFound();
    return { produto };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Produto não encontrado — Loja Vitrine" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const p = loaderData.produto;
    const desc = (p.descricao || "Produto digital pronto para uso.").slice(0, 155);
    const imagem = p.imagem_url && /^https:\/\//i.test(p.imagem_url) ? p.imagem_url : null;
    return {
      meta: [
        { title: `${p.titulo} — Loja Vitrine`.slice(0, 60) },
        { name: "description", content: desc },
        { property: "og:title", content: p.titulo },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(imagem
          ? [
              { property: "og:image", content: imagem },
              { name: "twitter:image", content: imagem },
            ]
          : []),
      ],
    };
  },
  component: ProdutoLegacyPage,
});


function ProdutoLegacyPage() {
  const { produto } = Route.useLoaderData();
  return <ProdutoDetalheVitrine produto={produto} organizationId={null} organizationSlug={null} />;
}
