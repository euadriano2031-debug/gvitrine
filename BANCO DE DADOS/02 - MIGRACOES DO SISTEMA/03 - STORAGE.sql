-- ============================================================
-- PASSO 3 — STORAGE (bucket de imagens/vídeos da loja)
-- Rode depois de criar o bucket pelo painel (Storage > New bucket)
-- Nome: loja   |   Public: NÃO (privado)
-- ============================================================

-- Alternativa via SQL (equivalente a criar pelo painel):
INSERT INTO storage.buckets (id, name, public)
VALUES ('loja', 'loja', false)
ON CONFLICT (id) DO NOTHING;

-- Somente administradores podem ler/enviar/apagar arquivos do bucket.
-- O app gera links assinados (createSignedUrl) para exibir na loja.
CREATE POLICY "Admins gerenciam arquivos da loja"
  ON storage.objects FOR ALL TO authenticated
  USING      (bucket_id = 'loja' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'loja' AND public.has_role(auth.uid(), 'admin'));

-- OBSERVAÇÃO: se preferir que as imagens tenham URL permanente e pública,
-- marque o bucket como público e troque a policy de leitura por:
--   CREATE POLICY "Leitura publica loja"
--     ON storage.objects FOR SELECT TO anon, authenticated
--     USING (bucket_id = 'loja');
-- (nesse caso mantenha a policy de admin apenas para INSERT/UPDATE/DELETE)
