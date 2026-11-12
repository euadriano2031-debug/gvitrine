-- PASSO 6 — planos SaaS
insert into public.saas_plans(
  code,name,description,price_monthly,max_products,max_leads,max_members,active
)
values (
  'free','Free','Plano inicial da G-Vitrine',0,20,100,1,true
)
on conflict (code) do update
set name=excluded.name,
    description=excluded.description,
    price_monthly=excluded.price_monthly,
    max_products=excluded.max_products,
    max_leads=excluded.max_leads,
    max_members=excluded.max_members,
    active=true,
    updated_at=now();
