import { MessageCircle } from "lucide-react";
import { whatsappLink, type AjudaConfig } from "@/lib/loja";

const tamanhos = {
  pequeno: "size-14",
  medio: "size-18",
  grande: "size-24",
} as const;

export function HelpButton({ cfg, preview = false }: { cfg: AjudaConfig; preview?: boolean }) {
  if (!cfg.ativo) return null;

  const pos = cfg.posicao === "bottom-left" ? "left-6" : "right-6";

  return (
    <a
      href={cfg.destino_tipo === "link" && cfg.url_destino ? cfg.url_destino : whatsappLink(cfg.numero, cfg.mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={cfg.texto}
      className={`${preview ? "relative" : `fixed bottom-6 ${pos} z-50`} inline-flex animate-pulse items-center justify-center overflow-hidden rounded-full shadow-xl transition hover:scale-105 hover:animate-none ${tamanhos[cfg.tamanho] ?? tamanhos.medio}`}
      style={{
        backgroundColor: cfg.imagem_url ? "transparent" : cfg.cor_fundo,
        color: cfg.cor_texto,
        boxShadow: `0 10px 30px -8px ${cfg.cor_fundo}`,
      }}
    >
      {cfg.imagem_url ? (
        <img src={cfg.imagem_url} alt={cfg.texto || "Abrir atendimento"} className="h-full w-full object-cover" />
      ) : (
        <MessageCircle className="h-7 w-7" />
      )}
    </a>
  );
}
