-- Industry/sector on brand_kits — enriches AI campaign copy and prefills NewCampaign
alter table public.brand_kits
  add column if not exists industry text not null default '';
