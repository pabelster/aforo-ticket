-- Aforo: eventos, boletos de un solo uso y acceso de staff.
-- Ejecutar completo en el editor SQL de Supabase.

create extension if not exists pgcrypto;

create table if not exists public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  event_date date not null,
  start_time time not null,
  location text not null,
  price numeric(12, 2) not null check (price >= 0),
  capacity integer not null check (capacity > 0),
  image_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete restrict,
  attendee_name text not null,
  email text not null,
  phone text,
  qr_token uuid not null default gen_random_uuid(),
  ticket_number text not null,
  status text not null default 'unused' check (status in ('unused', 'used')),
  purchase_date timestamptz not null default now(),
  used_at timestamptz,
  constraint tickets_qr_token_key unique (qr_token),
  constraint tickets_event_number_key unique (event_id, ticket_number),
  constraint tickets_used_at_check check (
    (status = 'unused' and used_at is null)
    or (status = 'used' and used_at is not null)
  )
);

create index if not exists tickets_event_id_idx on public.tickets (event_id);
create index if not exists events_schedule_idx on public.events (status, event_date, start_time);

comment on column public.tickets.qr_token is
  'Único valor codificado en el QR. No incluye nombre, correo ni teléfono.';

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_touch_updated_at on public.events;
create trigger events_touch_updated_at
before update on public.events
for each row execute function public.touch_updated_at();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff where user_id = auth.uid()
  );
$$;

create or replace function public.list_public_events()
returns table (
  id uuid,
  name text,
  description text,
  event_date date,
  start_time time,
  location text,
  price numeric,
  capacity integer,
  image_url text,
  status text,
  remaining integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.name,
    e.description,
    e.event_date,
    e.start_time,
    e.location,
    e.price,
    e.capacity,
    e.image_url,
    e.status,
    (e.capacity - coalesce(s.sold, 0))::integer as remaining
  from public.events e
  left join (
    select event_id, count(*)::integer as sold
    from public.tickets
    group by event_id
  ) s on s.event_id = e.id
  where e.status = 'active'
  order by e.event_date, e.start_time;
$$;

create or replace function public.get_public_event(p_event_id uuid)
returns table (
  id uuid,
  name text,
  description text,
  event_date date,
  start_time time,
  location text,
  price numeric,
  capacity integer,
  image_url text,
  status text,
  remaining integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.name,
    e.description,
    e.event_date,
    e.start_time,
    e.location,
    e.price,
    e.capacity,
    e.image_url,
    e.status,
    (e.capacity - coalesce(s.sold, 0))::integer as remaining
  from public.events e
  left join (
    select t.event_id, count(*)::integer as sold
    from public.tickets t
    group by t.event_id
  ) s on s.event_id = e.id
  where e.id = p_event_id
    and e.status = 'active';
$$;

create or replace function public.purchase_tickets(
  p_event_id uuid,
  p_quantity integer,
  p_attendee_name text,
  p_email text,
  p_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ev public.events%rowtype;
  sold integer;
  i integer;
  inserted public.tickets%rowtype;
  created jsonb := '[]'::jsonb;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 10 then
    raise exception 'INVALID_QUANTITY';
  end if;

  if p_attendee_name is null or char_length(trim(p_attendee_name)) < 2 or char_length(trim(p_attendee_name)) > 120 then
    raise exception 'INVALID_NAME';
  end if;

  if p_email is null
    or char_length(trim(p_email)) > 200
    or trim(p_email) !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'INVALID_EMAIL';
  end if;

  if p_phone is not null and char_length(trim(p_phone)) > 40 then
    raise exception 'INVALID_PHONE';
  end if;

  select * into ev from public.events where id = p_event_id for update;
  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  if ev.status <> 'active' then
    raise exception 'EVENT_INACTIVE';
  end if;

  select count(*)::integer into sold from public.tickets where event_id = p_event_id;
  if sold + p_quantity > ev.capacity then
    raise exception 'SOLD_OUT';
  end if;

  for i in 1..p_quantity loop
    insert into public.tickets (event_id, attendee_name, email, phone, ticket_number)
    values (
      p_event_id,
      trim(p_attendee_name),
      lower(trim(p_email)),
      nullif(trim(coalesce(p_phone, '')), ''),
      lpad((sold + i)::text, 4, '0')
    )
    returning * into inserted;

    created := created || jsonb_build_array(
      jsonb_build_object(
        'id', inserted.id,
        'event_id', inserted.event_id,
        'attendee_name', inserted.attendee_name,
        'email', inserted.email,
        'phone', inserted.phone,
        'qr_token', inserted.qr_token,
        'ticket_number', inserted.ticket_number,
        'status', inserted.status,
        'purchase_date', inserted.purchase_date,
        'event_name', ev.name,
        'event_date', ev.event_date,
        'start_time', ev.start_time,
        'location', ev.location
      )
    );
  end loop;

  return created;
end;
$$;

create or replace function public.validate_ticket(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.tickets%rowtype;
  existing public.tickets%rowtype;
  ev_name text;
begin
  if not public.is_staff() then
    return jsonb_build_object('result', 'forbidden');
  end if;

  update public.tickets
  set status = 'used',
      used_at = now()
  where qr_token = p_token
    and status = 'unused'
  returning * into updated;

  if found then
    select name into ev_name from public.events where id = updated.event_id;
    return jsonb_build_object(
      'result', 'valid',
      'attendee_name', updated.attendee_name,
      'ticket_number', updated.ticket_number,
      'event_name', ev_name,
      'used_at', updated.used_at
    );
  end if;

  select * into existing from public.tickets where qr_token = p_token;
  if not found then
    return jsonb_build_object('result', 'invalid');
  end if;

  select name into ev_name from public.events where id = existing.event_id;
  return jsonb_build_object(
    'result', 'used',
    'attendee_name', existing.attendee_name,
    'ticket_number', existing.ticket_number,
    'event_name', ev_name,
    'used_at', existing.used_at
  );
end;
$$;

alter table public.staff enable row level security;
alter table public.events enable row level security;
alter table public.tickets enable row level security;

drop policy if exists "staff_read_events" on public.events;
drop policy if exists "staff_insert_events" on public.events;
drop policy if exists "staff_update_events" on public.events;
drop policy if exists "staff_delete_events" on public.events;
drop policy if exists "staff_read_tickets" on public.tickets;

create policy "staff_read_events"
on public.events for select to authenticated
using (public.is_staff());

create policy "staff_insert_events"
on public.events for insert to authenticated
with check (public.is_staff());

create policy "staff_update_events"
on public.events for update to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "staff_delete_events"
on public.events for delete to authenticated
using (public.is_staff());

create policy "staff_read_tickets"
on public.tickets for select to authenticated
using (public.is_staff());

revoke all on function public.is_staff() from public;
revoke all on function public.list_public_events() from public;
revoke all on function public.get_public_event(uuid) from public;
revoke all on function public.purchase_tickets(uuid, integer, text, text, text) from public;
revoke all on function public.validate_ticket(uuid) from public;

grant execute on function public.is_staff() to authenticated;
grant execute on function public.list_public_events() to anon, authenticated;
grant execute on function public.get_public_event(uuid) to anon, authenticated;
grant execute on function public.purchase_tickets(uuid, integer, text, text, text) to anon, authenticated;
grant execute on function public.validate_ticket(uuid) to authenticated;
