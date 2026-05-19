create extension if not exists "pgcrypto";

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'Submitted',
  product_id text not null,
  product_name text not null,
  orientation text,
  deceased_name text not null,
  memorial_dates text,
  theme_style text,
  colors text,
  religious_or_spiritual_elements text,
  hobbies_interests_places text,
  quote_or_message text,
  general_instructions text,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address_line_1 text not null,
  shipping_address_line_2 text,
  shipping_city text not null,
  shipping_region text not null,
  shipping_postal_code text not null,
  shipping_country text not null,
  customer_notes text,
  approved_artwork_url text,
  approved_mockup_url text,
  internal_notes text
);

create table if not exists public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  order_id uuid references public.orders(id) on delete set null,
  file_url text not null,
  file_name text not null,
  file_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_previews (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  order_id uuid references public.orders(id) on delete set null,
  product_id text not null,
  prompt_used text,
  artwork_url text,
  mockup_url text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_uploaded_files_session_id on public.uploaded_files(session_id);
create index if not exists idx_generated_previews_session_id on public.generated_previews(session_id);
