/*
╔════════════════════════════════════════════════════════════════════════════╗
║                      DESPACHR — DATABASE SCHEMA                             ║
║              PostgreSQL schema completo para Supabase                       ║
╚════════════════════════════════════════════════════════════════════════════╝

GLOSARIO (ver AGENTS.md):
  cumplido      → prueba de entrega (foto de factura firmada por el receptor)
  malla         → plan semanal consolidado de rutas (multi-cliente)  → weekly_plans
  novedad       → problema en una entrega (rechazo, faltante, daño…)  → issues
  punto         → ubicación de entrega dentro de una ruta             → deliveries
  evento        → acción con timestamp del conductor                  → delivery_events
  flete         → pago al transportista por el servicio
  consolidado   → varios clientes en un mismo camión
  exclusivo     → carga completa para un solo cliente, tarifa fija

ORDEN DE EJECUCIÓN (ver bloque "INSTRUCCIONES" al final):
  1. Correr este archivo completo en Supabase → SQL Editor.
  2. Crear los usuarios de prueba en Auth → Users (el trigger crea el profile solo).
  3. Correr:  select public.seed_demo_data();
═════════════════════════════════════════════════════════════════════════════
*/

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ============================================================================
-- HELPER: get_my_role()
-- SECURITY DEFINER → evita recursión de RLS al leer profiles desde una policy
-- ============================================================================

create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================================
-- TABLA: profiles  (extiende auth.users con rol y datos del usuario)
-- ============================================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null,
  role        text not null check (role in ('admin', 'coordinator', 'driver')),
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada quien lee su propio perfil; admin y coordinator leen todos.
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid()
    or public.get_my_role() in ('admin', 'coordinator')
  );

create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_admin_all" on public.profiles
  for all using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- ============================================================================
-- TABLA: clients  (empresas que contratan el servicio logístico)
-- ============================================================================

create table if not exists public.clients (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text not null unique,
  phone           text,
  address         text,
  city            text not null,
  department      text not null,
  contact_person  text,
  tipo_cliente    text check (tipo_cliente in ('exclusivo', 'consolidado')),
  tarifa_flete    numeric(12,2),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.clients enable row level security;

-- Coordinator y admin leen; solo admin escribe (tarifas = dato sensible).
create policy "clients_select" on public.clients
  for select using (public.get_my_role() in ('admin', 'coordinator'));

create policy "clients_admin_write" on public.clients
  for all using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

create index if not exists idx_clients_city       on public.clients(city);
create index if not exists idx_clients_department on public.clients(department);

-- ============================================================================
-- TABLA: drivers  (conductores terceros — extiende profiles)
-- ============================================================================

create table if not exists public.drivers (
  id               uuid primary key references public.profiles(id) on delete cascade,
  vehicle_id       text,
  license_plate    text not null unique,
  document_number  text not null unique,
  phone_number     text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.drivers enable row level security;

-- El conductor se ve a sí mismo; coordinator y admin ven a todos.
create policy "drivers_select" on public.drivers
  for select using (
    id = auth.uid()
    or public.get_my_role() in ('admin', 'coordinator')
  );

create policy "drivers_admin_write" on public.drivers
  for all using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

create index if not exists idx_drivers_is_active on public.drivers(is_active);

-- ============================================================================
-- TABLA: weekly_plans  (la malla semanal)
-- ============================================================================

create table if not exists public.weekly_plans (
  id               uuid primary key default gen_random_uuid(),
  week_start_date  date not null,
  week_end_date    date not null,
  estado           text not null default 'borrador'
                     check (estado in ('borrador', 'activa', 'cerrada', 'archivada')),
  created_by       uuid not null references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.weekly_plans enable row level security;

create policy "weekly_plans_select" on public.weekly_plans
  for select using (public.get_my_role() in ('admin', 'coordinator'));

create policy "weekly_plans_write" on public.weekly_plans
  for all using (public.get_my_role() in ('admin', 'coordinator'))
  with check (public.get_my_role() in ('admin', 'coordinator'));

create index if not exists idx_weekly_plans_week_start on public.weekly_plans(week_start_date);
create index if not exists idx_weekly_plans_estado     on public.weekly_plans(estado);

-- ============================================================================
-- TABLA: routes  (cada día/ruta dentro de la malla)
-- ============================================================================

create table if not exists public.routes (
  id              uuid primary key default gen_random_uuid(),
  weekly_plan_id  uuid not null references public.weekly_plans(id) on delete cascade,
  driver_id       uuid not null references public.drivers(id),
  fecha           date not null,
  estado          text not null default 'pendiente'
                    check (estado in ('pendiente', 'iniciada', 'completada', 'cancelada')),
  hora_inicio     timestamptz,
  hora_fin        timestamptz,
  distancia_km    numeric(10,2),
  flete_pactado   numeric(12,2),
  notas           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.routes enable row level security;

-- El conductor ve solo SUS rutas; coordinator y admin ven todas.
create policy "routes_select" on public.routes
  for select using (
    driver_id = auth.uid()
    or public.get_my_role() in ('admin', 'coordinator')
  );

-- El conductor puede actualizar SUS rutas (ej: iniciar/cerrar).
create policy "routes_driver_update" on public.routes
  for update using (
    driver_id = auth.uid()
    or public.get_my_role() in ('admin', 'coordinator')
  );

create policy "routes_coord_write" on public.routes
  for insert with check (public.get_my_role() in ('admin', 'coordinator'));

create index if not exists idx_routes_weekly_plan on public.routes(weekly_plan_id);
create index if not exists idx_routes_driver      on public.routes(driver_id);
create index if not exists idx_routes_fecha        on public.routes(fecha);
create index if not exists idx_routes_estado       on public.routes(estado);

-- ============================================================================
-- TABLA: deliveries  (cada entrega/punto dentro de una ruta)
-- ============================================================================

create table if not exists public.deliveries (
  id                       uuid primary key default gen_random_uuid(),
  route_id                 uuid not null references public.routes(id) on delete cascade,
  client_id                uuid not null references public.clients(id),
  address                  text not null,
  city                     text not null,
  latitude                 numeric(10,8),
  longitude                numeric(11,8),
  numero_secuencia         integer not null,
  estado                   text not null default 'pendiente'
                             check (estado in ('pendiente', 'en_punto', 'completada', 'fallida', 'rechazada')),
  hora_llegada_punto       timestamptz,
  hora_salida_punto        timestamptz,
  tiempo_en_punto_minutos  integer,
  foto_cumplido_url        text,
  observaciones            text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.deliveries enable row level security;

-- El conductor ve las entregas de SUS rutas; coordinator y admin ven todas.
create policy "deliveries_select" on public.deliveries
  for select using (
    route_id in (select id from public.routes where driver_id = auth.uid())
    or public.get_my_role() in ('admin', 'coordinator')
  );

-- El conductor actualiza el estado de las entregas de SUS rutas.
create policy "deliveries_driver_update" on public.deliveries
  for update using (
    route_id in (select id from public.routes where driver_id = auth.uid())
    or public.get_my_role() in ('admin', 'coordinator')
  );

create policy "deliveries_coord_write" on public.deliveries
  for insert with check (public.get_my_role() in ('admin', 'coordinator'));

create index if not exists idx_deliveries_route  on public.deliveries(route_id);
create index if not exists idx_deliveries_client on public.deliveries(client_id);
create index if not exists idx_deliveries_estado on public.deliveries(estado);
create index if not exists idx_deliveries_city   on public.deliveries(city);

-- ============================================================================
-- TABLA: delivery_events  (eventos en tiempo real del conductor)
-- ============================================================================

create table if not exists public.delivery_events (
  id            uuid primary key default gen_random_uuid(),
  delivery_id   uuid not null references public.deliveries(id) on delete cascade,
  route_id      uuid not null references public.routes(id) on delete cascade,
  driver_id     uuid not null references public.drivers(id),
  tipo_evento   text not null
                  check (tipo_evento in ('inicio_ruta', 'fin_ruta', 'llegada_punto',
                                         'salida_punto', 'foto_cumplido', 'novedad')),
  timestamp     timestamptz not null default now(),
  latitude      numeric(10,8),
  longitude     numeric(11,8),
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

alter table public.delivery_events enable row level security;

-- El conductor inserta eventos de SUS rutas.
create policy "events_driver_insert" on public.delivery_events
  for insert with check (
    driver_id = auth.uid()
    and route_id in (select id from public.routes where driver_id = auth.uid())
  );

-- Conductor (sus eventos), coordinator y admin pueden leer.
create policy "events_select" on public.delivery_events
  for select using (
    driver_id = auth.uid()
    or public.get_my_role() in ('admin', 'coordinator')
  );

create index if not exists idx_events_delivery  on public.delivery_events(delivery_id);
create index if not exists idx_events_route      on public.delivery_events(route_id);
create index if not exists idx_events_driver     on public.delivery_events(driver_id);
create index if not exists idx_events_tipo        on public.delivery_events(tipo_evento);
create index if not exists idx_events_timestamp   on public.delivery_events("timestamp");

-- ============================================================================
-- TABLA: issues  (novedades detalladas de entregas con problema)
-- ============================================================================

create table if not exists public.issues (
  id                uuid primary key default gen_random_uuid(),
  delivery_id       uuid not null references public.deliveries(id) on delete cascade,
  tipo_novedad      text not null
                      check (tipo_novedad in ('direccion_errada', 'cliente_no_encontrado',
                                              'paquete_danado', 'acceso_denegado', 'otro')),
  descripcion       text not null,
  foto_novedad_url  text,
  estado            text not null default 'reportada'
                      check (estado in ('reportada', 'pendiente', 'resuelta')),
  resuelto_por      uuid references public.profiles(id),
  fecha_resolucion  timestamptz,
  notas_resolucion  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.issues enable row level security;

-- El conductor reporta novedades sobre entregas de SUS rutas.
create policy "issues_driver_insert" on public.issues
  for insert with check (
    delivery_id in (
      select d.id from public.deliveries d
      join public.routes r on r.id = d.route_id
      where r.driver_id = auth.uid()
    )
  );

create policy "issues_select" on public.issues
  for select using (
    public.get_my_role() in ('admin', 'coordinator')
    or delivery_id in (
      select d.id from public.deliveries d
      join public.routes r on r.id = d.route_id
      where r.driver_id = auth.uid()
    )
  );

-- Coordinator y admin resuelven novedades.
create policy "issues_coord_update" on public.issues
  for update using (public.get_my_role() in ('admin', 'coordinator'));

create index if not exists idx_issues_delivery on public.issues(delivery_id);
create index if not exists idx_issues_tipo      on public.issues(tipo_novedad);
create index if not exists idx_issues_estado    on public.issues(estado);

-- ============================================================================
-- TABLA: client_invoices  (facturación — integración Sistran/Cigo)
-- ============================================================================

create table if not exists public.client_invoices (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references public.clients(id),
  weekly_plan_id        uuid not null references public.weekly_plans(id),
  numero_factura        text unique,
  total_entregas        integer,
  entregas_completadas  integer,
  entregas_fallidas     integer,
  valor_total           numeric(14,2),
  valor_flete_cobrado   numeric(14,2),
  margen_operativo      numeric(14,2),
  estado                text not null default 'borrador'
                          check (estado in ('borrador', 'enviada_sistran', 'facturada', 'pagada', 'cancelada')),
  fecha_emision         date,
  fecha_vencimiento     date,
  sistran_sync_id       text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.client_invoices enable row level security;

-- Facturación y márgenes: SOLO admin (coordinator no ve dinero).
create policy "invoices_admin_only" on public.client_invoices
  for all using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

create index if not exists idx_invoices_client       on public.client_invoices(client_id);
create index if not exists idx_invoices_weekly_plan  on public.client_invoices(weekly_plan_id);
create index if not exists idx_invoices_estado        on public.client_invoices(estado);

-- ============================================================================
-- TRIGGER: handle_new_user()
-- Crea el profile automáticamente al registrar un usuario en Auth.
-- El rol/nombre/teléfono se leen de raw_user_meta_data (lo defines al crear
-- el usuario en la UI de Supabase, en "User Metadata").
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'driver'),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- TRIGGER 1: llegada_punto → marca hora_llegada y estado 'en_punto'
-- ============================================================================

create or replace function public.on_llegada_punto()
returns trigger
language plpgsql
as $$
begin
  if new.tipo_evento = 'llegada_punto' then
    update public.deliveries
       set hora_llegada_punto = new."timestamp",
           estado = 'en_punto',
           updated_at = now()
     where id = new.delivery_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_llegada_punto on public.delivery_events;
create trigger trg_llegada_punto
  after insert on public.delivery_events
  for each row execute function public.on_llegada_punto();

-- ============================================================================
-- TRIGGER 2: salida_punto → calcula tiempo_en_punto_minutos
-- ============================================================================

create or replace function public.on_salida_punto()
returns trigger
language plpgsql
as $$
begin
  if new.tipo_evento = 'salida_punto' then
    update public.deliveries
       set hora_salida_punto = new."timestamp",
           tiempo_en_punto_minutos = case
             when hora_llegada_punto is not null
               then round(extract(epoch from (new."timestamp" - hora_llegada_punto)) / 60)::int
             else null
           end,
           updated_at = now()
     where id = new.delivery_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_salida_punto on public.delivery_events;
create trigger trg_salida_punto
  after insert on public.delivery_events
  for each row execute function public.on_salida_punto();

-- ============================================================================
-- TRIGGER 3: si todas las entregas de la ruta están cerradas → ruta 'completada'
-- ============================================================================

create or replace function public.check_route_completion()
returns trigger
language plpgsql
as $$
begin
  if new.estado in ('completada', 'rechazada', 'fallida') then
    if not exists (
      select 1 from public.deliveries
       where route_id = new.route_id
         and estado not in ('completada', 'rechazada', 'fallida')
    ) then
      update public.routes
         set estado = 'completada',
             hora_fin = now(),
             updated_at = now()
       where id = new.route_id
         and estado <> 'completada';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_route_completion on public.deliveries;
create trigger trg_route_completion
  after update on public.deliveries
  for each row execute function public.check_route_completion();

-- ============================================================================
-- TRIGGER 4: updated_at automático en todas las tablas
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'clients', 'drivers', 'weekly_plans',
    'routes', 'deliveries', 'issues', 'client_invoices'
  ] loop
    execute format('drop trigger if exists trg_updated_at on public.%I;', t);
    execute format(
      'create trigger trg_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end;
$$;

-- ============================================================================
-- SEED: seed_demo_data()
-- Idempotente. Córrela DESPUÉS de crear los usuarios de prueba en Auth.
-- Busca los UUIDs reales por email y arma malla + rutas + entregas + eventos.
-- ============================================================================

create or replace function public.seed_demo_data()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin   uuid;
  v_coord   uuid;
  v_drv1    uuid;
  v_drv2    uuid;
  v_drv3    uuid;
  v_makro   uuid;
  v_exito   uuid;
  v_plan    uuid;
  v_route1  uuid;
  v_route2  uuid;
  v_deliv   uuid;
  v_week_start date := current_date - extract(dow from current_date)::int + 1; -- lunes
begin
  -- Resolver usuarios por email (deben existir en Auth → profiles vía trigger)
  select id into v_admin from public.profiles where email = 'admin@despachr.test';
  select id into v_coord from public.profiles where email = 'coord@despachr.test';
  select id into v_drv1  from public.profiles where email = 'driver@despachr.test';
  select id into v_drv2  from public.profiles where email = 'driver2@despachr.test';
  select id into v_drv3  from public.profiles where email = 'driver3@despachr.test';

  if v_admin is null or v_coord is null or v_drv1 is null then
    return 'FALTAN USUARIOS. Crea en Auth: admin@, coord@, driver@ (y opcional driver2@, driver3@) antes de correr seed_demo_data().';
  end if;

  -- Clientes (idempotente por email)
  insert into public.clients (name, email, phone, address, city, department, contact_person, tipo_cliente, tarifa_flete)
  values
    ('Makro Colombia', 'logistica@makro.com.co', '+57 1 123 4567', 'Cra 50 # 80-10', 'Montería', 'Córdoba', 'Roberto Gómez', 'consolidado', 45000.00),
    ('Grupo Éxito',    'despacho@exito.com.co',  '+57 1 234 5678', 'Cra 45 # 72-20', 'Barranquilla', 'Atlántico', 'María López', 'consolidado', 52000.00)
  on conflict (email) do nothing;

  select id into v_makro from public.clients where email = 'logistica@makro.com.co';
  select id into v_exito from public.clients where email = 'despacho@exito.com.co';

  -- Drivers (placas reales colombianas). Solo para profiles con rol driver existentes.
  insert into public.drivers (id, vehicle_id, license_plate, document_number, phone_number, is_active)
  values (v_drv1, 'Nissan Frontier 2022', 'AZW-123', '1085312789', '+57 303 345 6789', true)
  on conflict (id) do nothing;

  if v_drv2 is not null then
    insert into public.drivers (id, vehicle_id, license_plate, document_number, phone_number, is_active)
    values (v_drv2, 'Chevrolet NLR 2021', 'BXC-456', '1087654321', '+57 304 456 7890', true)
    on conflict (id) do nothing;
  end if;

  if v_drv3 is not null then
    insert into public.drivers (id, vehicle_id, license_plate, document_number, phone_number, is_active)
    values (v_drv3, 'Ford F-150 2023', 'CYD-789', '1082233445', '+57 305 567 8901', true)
    on conflict (id) do nothing;
  end if;

  -- Malla semanal activa (una por semana). Si ya hay una, reutilizar y no re-sembrar rutas.
  select id into v_plan from public.weekly_plans
   where week_start_date = v_week_start and estado = 'activa' limit 1;

  if v_plan is not null then
    return 'OK (la malla de esta semana ya existía; no se re-sembraron rutas).';
  end if;

  insert into public.weekly_plans (week_start_date, week_end_date, estado, created_by)
  values (v_week_start, v_week_start + 4, 'activa', v_admin)
  returning id into v_plan;

  -- Ruta 1 (driver 1) — en progreso
  insert into public.routes (weekly_plan_id, driver_id, fecha, estado, hora_inicio, flete_pactado)
  values (v_plan, v_drv1, current_date, 'iniciada', now() - interval '90 minutes', 95000.00)
  returning id into v_route1;

  -- Entregas ruta 1 (3 puntos, distintos estados)
  insert into public.deliveries (route_id, client_id, address, city, latitude, longitude, numero_secuencia, estado, hora_llegada_punto, hora_salida_punto, tiempo_en_punto_minutos)
  values
    (v_route1, v_makro, 'Cra 50 # 80-10, Makro Montería', 'Montería', 8.74798000, -75.88143000, 1, 'completada', now() - interval '80 minutes', now() - interval '55 minutes', 25),
    (v_route1, v_exito, 'Cl 41 # 22-15, Éxito Montería',  'Montería', 8.75100000, -75.87900000, 2, 'en_punto',   now() - interval '20 minutes', null, null)
  returning id into v_deliv;

  insert into public.deliveries (route_id, client_id, address, city, latitude, longitude, numero_secuencia, estado)
  values
    (v_route1, v_makro, 'Cl 29 # 10-40, Bodega Sur', 'Montería', 8.73500000, -75.88500000, 3, 'pendiente');

  -- Ruta 2 (driver 2 si existe, si no driver 1) — pendiente
  insert into public.routes (weekly_plan_id, driver_id, fecha, estado, flete_pactado)
  values (v_plan, coalesce(v_drv2, v_drv1), current_date, 'pendiente', 78000.00)
  returning id into v_route2;

  insert into public.deliveries (route_id, client_id, address, city, latitude, longitude, numero_secuencia, estado)
  values
    (v_route2, v_exito, 'Cra 38 # 64-90, Éxito Norte',   'Barranquilla', 11.00410000, -74.80700000, 1, 'pendiente'),
    (v_route2, v_makro, 'Cl 79 # 42-30, Makro B/quilla', 'Barranquilla', 10.99600000, -74.79900000, 2, 'pendiente'),
    (v_route2, v_exito, 'Cra 53 # 75-120, CC Buenavista','Barranquilla', 11.01200000, -74.81100000, 3, 'pendiente');

  -- Eventos para simular la ruta 1 en progreso (inicio + llegada/salida del punto 1)
  insert into public.delivery_events (delivery_id, route_id, driver_id, tipo_evento, "timestamp", latitude, longitude, metadata)
  select d.id, v_route1, v_drv1, 'inicio_ruta', now() - interval '90 minutes', 8.74700000, -75.88200000, '{"origen":"bodega"}'::jsonb
    from public.deliveries d where d.route_id = v_route1 and d.numero_secuencia = 1;

  -- Nota: los eventos llegada/salida del punto 1 dispararían los triggers; aquí los
  -- omitimos porque ya sembramos las horas directamente para evitar doble cálculo.

  return 'OK. Malla, 2 rutas, 5 entregas y eventos demo creados para la semana del ' || v_week_start || '.';
end;
$$;

/*
═════════════════════════════════════════════════════════════════════════════
INSTRUCCIONES
═════════════════════════════════════════════════════════════════════════════

PASO 1 — Correr el schema
  Supabase → SQL Editor → New query → pega TODO este archivo → Run.
  Crea tablas, RLS, triggers, handle_new_user() y seed_demo_data().

PASO 2 — Crear usuarios de prueba en Auth
  Supabase → Authentication → Users → "Add user" (Create new user).
  Crea estos (password sugerido: password123) y en "User Metadata" (JSON)
  define el rol. Ejemplo de metadata para el coordinador:

    { "name": "Daniela Coordinadora", "role": "coordinator", "phone": "+57 302 234 5678" }

  Usuarios mínimos:
    admin@despachr.test    →  { "name": "Carlos Admin",     "role": "admin" }
    coord@despachr.test    →  { "name": "Daniela Coord",    "role": "coordinator" }
    driver@despachr.test   →  { "name": "Juan Conductor",   "role": "driver" }
  Opcionales (para tener 3 conductores con placa):
    driver2@despachr.test  →  { "name": "Pedro Conductor",  "role": "driver" }
    driver3@despachr.test  →  { "name": "Luis Conductor",   "role": "driver" }

  El trigger on_auth_user_created crea el profile automáticamente.

PASO 3 — Sembrar datos demo
  Supabase → SQL Editor:   select public.seed_demo_data();
  Devuelve un texto de confirmación (o te dice qué usuario falta).

VARIABLES DE ENTORNO (la app, no este script)
  NEXT_PUBLIC_SUPABASE_URL       → URL del proyecto
  NEXT_PUBLIC_SUPABASE_ANON_KEY  → publishable/anon key
  (Ya configuradas en Vercel y .env.local)

REALTIME (para el mapa del coordinador)
  Database → Replication → activar las tablas routes, deliveries, delivery_events.

RESET / BORRAR TODO (peligroso)
  drop schema public cascade; create schema public;
  -- luego vuelve a correr este archivo y repite PASO 2 y 3.
  Para borrar SOLO los datos demo conservando el schema:
  truncate public.delivery_events, public.issues, public.deliveries,
           public.routes, public.weekly_plans, public.client_invoices,
           public.drivers, public.clients restart identity cascade;
  -- (profiles se borra al eliminar los usuarios en Auth)

VERIFICACIÓN RÁPIDA (RLS)
  - Login como driver@  → solo ve su ruta del día y sus entregas.
  - Login como coord@   → ve rutas/entregas/novedades, NO client_invoices.
  - Login como admin@   → ve todo, incluida facturación.
═════════════════════════════════════════════════════════════════════════════
*/
