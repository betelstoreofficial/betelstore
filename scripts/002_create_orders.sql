-- Create orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_number text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal integer not null default 0,
  discount integer not null default 0,
  total integer not null default 0,
  status text not null default 'processing' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "orders_select_own" on public.orders for select using (auth.uid() = user_id);
create policy "orders_insert_own" on public.orders for insert with check (auth.uid() = user_id);
create policy "orders_update_own" on public.orders for update using (auth.uid() = user_id);

-- Create a sequence for order numbers
create sequence if not exists order_number_seq start 1000;

-- Function to generate order numbers
create or replace function public.generate_order_number()
returns trigger
language plpgsql
as $$
begin
  new.order_number := 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists set_order_number on public.orders;

create trigger set_order_number
  before insert on public.orders
  for each row
  when (new.order_number = '' or new.order_number is null)
  execute function public.generate_order_number();
