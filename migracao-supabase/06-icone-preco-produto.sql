-- ============================================================
-- PASSO 6 — ÍCONE DO PREÇO POR PRODUTO
-- Opções suportadas pela interface: pix, cartao, raio.
-- ============================================================

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS pix_icone text NOT NULL DEFAULT 'pix';

UPDATE public.produtos
SET pix_icone = 'pix'
WHERE pix_icone IS NULL OR pix_icone = '';
