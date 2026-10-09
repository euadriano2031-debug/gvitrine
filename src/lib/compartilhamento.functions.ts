import { createServerFn } from "@tanstack/react-start";

export type CompartilhamentoPublico = {
  imagem_url: string;
  titulo: string;
  descricao: string;
  site_url: string;
};

const padrao: CompartilhamentoPublico = {
  imagem_url: "",
  titulo: "G-Vitrine",
  descricao: "Loja digital com produtos e soluções prontas para você.",
  site_url: "https://g-vitrine.lovable.app/",
};

export const obterCompartilhamentoPublico = createServerFn({ method: "GET" }).handler(
  async (): Promise<CompartilhamentoPublico> => {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key =
      process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) return padrao;

    try {
      const resposta = await fetch(
        `${url}/rest/v1/configuracoes?chave=in.(compartilhamento,favicon)&select=chave,valor`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        },
      );

      if (!resposta.ok) return padrao;

      const registros = (await resposta.json()) as Array<{
        chave: string;
        valor?: Record<string, unknown>;
      }>;

      const compartilhamento = registros.find((registro) => registro.chave === "compartilhamento")?.valor;
      const favicon = registros.find((registro) => registro.chave === "favicon")?.valor;

      const titulo =
        typeof compartilhamento?.titulo === "string" && compartilhamento.titulo.trim()
          ? compartilhamento.titulo.trim()
          : padrao.titulo;
      const descricao =
        typeof compartilhamento?.descricao === "string" && compartilhamento.descricao.trim()
          ? compartilhamento.descricao.trim()
          : padrao.descricao;
      const siteUrl =
        typeof compartilhamento?.site_url === "string" && valueUrl(compartilhamento.site_url)
          ? compartilhamento.site_url.trim()
          : padrao.site_url;

      const faviconUrl =
        typeof favicon?.url === "string" && favicon.url.trim()
          ? favicon.url.trim()
          : "/favicon.ico";

      return {
        imagem_url: absoluteUrl(faviconUrl, siteUrl),
        titulo,
        descricao,
        site_url: siteUrl,
      };
    } catch {
      return padrao;
    }
  },
);

function absoluteUrl(value: string, base: string) {
  try {
    return new URL(value, base).href;
  } catch {
    return "";
  }
}

function valueUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
