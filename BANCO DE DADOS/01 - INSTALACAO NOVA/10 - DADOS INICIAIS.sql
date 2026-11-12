-- PASSO 10 — catálogo inicial da loja principal
do $$
declare
  v_org_id uuid;
begin
  select id into v_org_id
  from public.organizations
  where slug='ki-vitrine'
  limit 1;

  if v_org_id is null then
    raise exception 'Loja ki-vitrine não encontrada. Execute 09-admin-e-loja-inicial.sql primeiro.';
  end if;

  insert into public.categorias(organization_id,nome,slug,ordem)
  values
    (v_org_id,'Sites','sites',1),
    (v_org_id,'Streaming','streaming',2),
    (v_org_id,'WhatsApp','whatsapp',3),
    (v_org_id,'IA','ia',4),
    (v_org_id,'Trading','trading',5),
    (v_org_id,'Painéis','paineis',6),
    (v_org_id,'Apps','apps',7),
    (v_org_id,'E-commerce','ecommerce',8),
    (v_org_id,'Marketing','marketing',9)
  on conflict (organization_id,slug) do update
  set nome=excluded.nome, ordem=excluded.ordem;

  insert into public.produtos(
    organization_id,titulo,slug,descricao,imagem_url,preco,preco_antigo,parcelamento,selo,
    desconto,categoria_id,checkout_url,video_url,demo_url,whatsapp_url,popup_video_url,
    popup_video_tipo,popup_imagem_url,secao,tags,comprar_texto,comprar_cor,comprar_provedor,
    comprar_ativo,demo_texto,demo_cor,demo_ativo,desconto_cor,desconto_ativo,destaque,ativo,
    ordem,pix_icone,site_url,site_texto,site_cor,site_ativo,botoes_ordem,
    whatsapp_compartilhar_ativo,whatsapp_compartilhar_cor,whatsapp_compartilhar_texto,
    video_legenda_ativa
  )
  values
  (
    v_org_id,'Agenda PRO','agenda-pro',
    'Sistema de Agendamento inteligente. Código-fonte completo, pronto para uso.',
    'https://minio.afcode.com.br/afcode-uploads/product-covers/products/f1b9af14-fee8-4ba9-98fc-4c3652a5e6f1.webp',
    147.90,597.00,'12x de R$ 12,35','DESTAQUE','GANHE ATÉ 50% OFF',
    (select id from public.categorias where organization_id=v_org_id and slug='streaming'),
    'https://wa.me/5571999559427','https://www.youtube.com/watch?v=aQzPU4q5rXQ',
    'https://wa.me/5571999559427',null,'https://youtube.com/embed/aQzPU4q5rXQ','youtube',
    'https://minio.afcode.com.br/afcode-uploads/product-covers/products/f1b9af14-fee8-4ba9-98fc-4c3652a5e6f1.webp',
    'destaque','{"Micro SAAS"}','Comprar','#3b82f6','Kiwify',true,'Detalhes','#dc2626',true,
    '#f97316',true,true,true,1,'pix',null,'Ver Site','#16a34a',true,
    array['comprar','video','site','whatsapp'],true,'#25D366','Compartilhar no WhatsApp',true
  ),
  (
    v_org_id,'Zap Modelo Pro','zap-modelo-pro',
    'Disparos automáticos, transparentes e seguros em grupos do WhatsApp com painel completo.',
    '/__l5e/assets-v1/dae78b96-34f4-4a00-94ce-d508ac350074/whatsapp.jpg',
    197.00,397.00,'12x de R$ 19,70','POPULAR','60% OFF',
    (select id from public.categorias where organization_id=v_org_id and slug='whatsapp'),
    'https://checkout.exemplo.com/zap-modelo-pro','https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://wa.me/5571999559427',null,null,'auto',
    '/__l5e/assets-v1/dae78b96-34f4-4a00-94ce-d508ac350074/whatsapp.jpg',
    'destaque','{}','Comprar','#3b82f6','personalizado',true,'Saiba Mais','#dc2626',true,
    '#f97316',true,true,true,2,'pix',null,'Ver Site','#16a34a',true,
    array['comprar','video','site','whatsapp'],true,'#25D366','Compartilhar no WhatsApp',true
  ),
  (
    v_org_id,'Lovable Boost','lovable-boost',
    'Extraia o máximo do seu editor de IA: prompts, templates e boosters para seus projetos.',
    '/__l5e/assets-v1/21df422d-5661-41e9-aa98-5ccc86341cde/ia.jpg',
    97.00,197.00,'6x de R$ 16,17','NOVO','LANÇAMENTO',
    (select id from public.categorias where organization_id=v_org_id and slug='ia'),
    'https://checkout.exemplo.com/lovable-boost','https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://exemplo.com/demo/lovable-boost',null,null,'auto',
    '/__l5e/assets-v1/21df422d-5661-41e9-aa98-5ccc86341cde/ia.jpg',
    'destaque','{}','Comprar','#3b82f6','personalizado',true,'Ver Demo','#dc2626',true,
    '#f97316',true,true,true,3,'pix',null,'Ver Site','#16a34a',true,
    array['comprar','video','site','whatsapp'],true,'#25D366','Compartilhar no WhatsApp',true
  ),
  (
    v_org_id,'Crypto Trader Dash','crypto-trader-dash',
    'Painel de trading com gráficos avançados, alertas e integrações com as principais corretoras.',
    '/__l5e/assets-v1/69486e6d-07db-47ea-b6f7-84ecad4ec226/crypto.jpg',
    397.00,797.00,'12x de R$ 39,70','PREMIUM','50% OFF',
    (select id from public.categorias where organization_id=v_org_id and slug='trading'),
    'https://checkout.exemplo.com/crypto-trader-dash','https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://exemplo.com/demo/crypto-trader-dash',null,null,'auto',
    '/__l5e/assets-v1/69486e6d-07db-47ea-b6f7-84ecad4ec226/crypto.jpg',
    'destaque','{}','Comprar','#3b82f6','personalizado',true,'Ver Demo','#dc2626',true,
    '#f97316',true,true,true,4,'pix',null,'Ver Site','#16a34a',true,
    array['comprar','video','site','whatsapp'],true,'#25D366','Compartilhar no WhatsApp',true
  ),
  (
    v_org_id,'Landing Page Builder','landing-page-builder',
    'Construtor de landing pages de alta conversão com editor visual, formulários e integrações de pagamento.',
    '/__l5e/assets-v1/64fbbad6-f3e3-42ef-9e5e-05813dc6f5af/landing.jpg',
    147.00,297.00,'6x de R$ 24,50','NOVO','50% OFF',null,
    'https://checkout.exemplo.com/landing-builder','https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://exemplo.com/demo/landing-builder',null,null,'auto',
    '/__l5e/assets-v1/64fbbad6-f3e3-42ef-9e5e-05813dc6f5af/landing.jpg',
    'vitrine','{"Sites","Marketing"}','Comprar','#3b82f6','personalizado',true,'Ver Demo','#dc2626',true,
    '#f97316',true,false,true,10,'pix',null,'Ver Site','#16a34a',true,
    array['comprar','video','site','whatsapp'],true,'#25D366','Compartilhar no WhatsApp',true
  ),
  (
    v_org_id,'ERP Dashboard Pro','erp-dashboard-pro',
    'Sistema completo de gestão com dashboards, relatórios, controle de estoque e financeiro.',
    '/__l5e/assets-v1/b5bc0eca-e4d6-489d-9eef-9477d7ee5ef2/erp.jpg',
    497.00,897.00,'12x de R$ 49,70','PREMIUM','45% OFF',null,
    'https://checkout.exemplo.com/erp-dashboard','https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://exemplo.com/demo/erp-dashboard',null,null,'auto',
    '/__l5e/assets-v1/b5bc0eca-e4d6-489d-9eef-9477d7ee5ef2/erp.jpg',
    'vitrine','{"Gestão","Dashboards"}','Comprar','#3b82f6','personalizado',true,'Ver Demo','#dc2626',true,
    '#f97316',true,false,true,11,'pix',null,'Ver Site','#16a34a',true,
    array['comprar','video','site','whatsapp'],true,'#25D366','Compartilhar no WhatsApp',true
  ),
  (
    v_org_id,'Delivery App Completo','delivery-app-completo',
    'Aplicativo de delivery com pedidos em tempo real, pagamento online e painel do restaurante.',
    '/__l5e/assets-v1/16cb5585-9349-4c5e-82e9-6b40491ff330/delivery.jpg',
    347.00,697.00,'12x de R$ 34,70','POPULAR','50% OFF',null,
    'https://checkout.exemplo.com/delivery-app','https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://exemplo.com/demo/delivery-app',null,null,'auto',
    '/__l5e/assets-v1/16cb5585-9349-4c5e-82e9-6b40491ff330/delivery.jpg',
    'vitrine','{"Apps","Delivery"}','Comprar','#3b82f6','personalizado',true,'Ver Demo','#dc2626',true,
    '#f97316',true,false,true,12,'pix',null,'Ver Site','#16a34a',true,
    array['comprar','video','site','whatsapp'],true,'#25D366','Compartilhar no WhatsApp',true
  ),
  (
    v_org_id,'Agenda & Agendamentos','agenda-agendamentos',
    'Plataforma de agendamento online com lembretes automáticos por WhatsApp e link público de reservas.',
    '/__l5e/assets-v1/e8195778-2d21-40de-80e1-1ae89e21ebd1/agenda.jpg',
    197.00,397.00,'10x de R$ 19,70','DESTAQUE','50% OFF',null,
    'https://checkout.exemplo.com/agenda-online','https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://exemplo.com/demo/agenda-online',null,null,'auto',
    '/__l5e/assets-v1/e8195778-2d21-40de-80e1-1ae89e21ebd1/agenda.jpg',
    'vitrine','{"Apps","Automação"}','Comprar','#3b82f6','personalizado',true,'Ver Demo','#dc2626',true,
    '#f97316',true,false,true,13,'pix',null,'Ver Site','#16a34a',true,
    array['comprar','video','site','whatsapp'],true,'#25D366','Compartilhar no WhatsApp',true
  )
  on conflict (organization_id,slug) do update
  set titulo=excluded.titulo,
      descricao=excluded.descricao,
      imagem_url=excluded.imagem_url,
      preco=excluded.preco,
      preco_antigo=excluded.preco_antigo,
      parcelamento=excluded.parcelamento,
      selo=excluded.selo,
      desconto=excluded.desconto,
      categoria_id=excluded.categoria_id,
      checkout_url=excluded.checkout_url,
      video_url=excluded.video_url,
      demo_url=excluded.demo_url,
      popup_video_url=excluded.popup_video_url,
      popup_video_tipo=excluded.popup_video_tipo,
      popup_imagem_url=excluded.popup_imagem_url,
      secao=excluded.secao,
      tags=excluded.tags,
      comprar_texto=excluded.comprar_texto,
      comprar_cor=excluded.comprar_cor,
      comprar_provedor=excluded.comprar_provedor,
      comprar_ativo=excluded.comprar_ativo,
      demo_texto=excluded.demo_texto,
      demo_cor=excluded.demo_cor,
      demo_ativo=excluded.demo_ativo,
      destaque=excluded.destaque,
      ativo=excluded.ativo,
      ordem=excluded.ordem,
      updated_at=now();

  insert into public.configuracoes(organization_id,chave,valor)
  values
  (v_org_id,'ajuda','{"ativo":true,"icone":"telefone","texto":"Precisa de Ajuda?","numero":"5571999559427","posicao":"bottom-left","tamanho":"pequeno","mensagem":"Olá! Preciso de ajuda para escolher um produto da loja.","cor_fundo":"#25D366","cor_texto":"#ffffff"}'::jsonb),
  (v_org_id,'banner','{"tipo":"youtube","ativo":true,"titulo":"Códigos-fonte, automações e IA prontos para vender","mp4_url":"","posicao":"center","autoplay":false,"capa_url":"","controles":true,"cor_fundo":"","cor_texto":"","descricao":"Marketplace de produtos digitais premium para você lançar seu próprio negócio em minutos.","subtitulo":"Lançamento","video_url":"https://www.youtube.com/embed/xFLaqcsRP40","selo_tipo":"texto","selo_imagem_url":"","selo_tamanho_fonte":14,"selo_cor_texto":"#111827","selo_cor_fundo":"#ffffff","selo_icone_modo":"icone","selo_icone_cor":"#16a34a","selo_icone_imagem_url":"","selo_icone_tamanho":18}'::jsonb)
  (v_org_id,'rodape','{"texto":"© {{ANO}} {{LOJA}} — Todos os direitos reservados."}'::jsonb),
  on conflict (organization_id,chave) do update
  set valor=excluded.valor, updated_at=now();

  raise notice 'Catálogo inicial configurado para organization_id=%', v_org_id;
end $$;
