/*
╔════════════════════════════════════════════════════════════════════════════╗
║  DESPACHR — MIGRACIÓN 002: Alertas (sistema de alertas del coordinador)     ║
╚════════════════════════════════════════════════════════════════════════════╝

QUÉ HACE
  - Crea la tabla public.alerts: alertas que el sistema genera para el
    coordinador (ej: un conductor lleva >60 min en un punto).
  - Índice único parcial: una sola alerta ACTIVA (sin resolver) por
    (delivery_id, tipo) → evita duplicados mientras el problema persiste.
  - RLS: coordinador y admin LEEN y ACTUALIZAN (para resolver). NADIE hace
    INSERT desde el cliente; las alertas las inserta la edge function con el
    service role key (que hace bypass de RLS). El conductor no tiene acceso.
  - Trigger trg_updated_at reutilizando public.set_updated_at() (schema.sql).

  NOTA sobre updated_at: la lista de columnas del spec no la mencionaba, pero
  el trigger updated_at solicitado la requiere; se añade `updated_at` como en
  todas las demás tablas del schema (patrón consistente).

DEPENDENCIAS
  Requiere el schema base (scripts/schema.sql) ya aplicado: usa deliveries,
  routes, profiles, public.get_my_role() y public.set_updated_at().

CÓMO CORRERLO
  Supabase → SQL Editor → New query → pega TODO este archivo → Run.
  Idempotente (create ... if not exists, drop policy/trigger if exists).

CÓMO VERIFICAR
  1) Tabla + columnas:
       select column_name, data_type, is_nullable
         from information_schema.columns
        where table_schema = 'public' and table_name = 'alerts'
        order by ordinal_position;

  2) Índice único parcial:
       select indexname, indexdef from pg_indexes
        where schemaname = 'public' and tablename = 'alerts'
          and indexname = 'uniq_alerts_activa';
     Esperado → un UNIQUE index sobre (delivery_id, tipo) WHERE (resuelta = false)

  3) Políticas (2: select + update; NO debe haber insert):
       select policyname, cmd from pg_policies
        where schemaname = 'public' and tablename = 'alerts';
     Esperado → alerts_select (SELECT), alerts_update (UPDATE)

  4) Prueba del índice (dos alertas activas iguales deben fallar):
       insert into public.alerts (delivery_id, route_id, tipo, mensaje)
       select d.id, d.route_id, 'tiempo_en_punto', 'test'
         from public.deliveries d limit 1;
       -- repetir el mismo insert → debe dar "duplicate key value violates
       --   unique constraint uniq_alerts_activa"
       -- limpiar:  delete from public.alerts where mensaje = 'test';
═════════════════════════════════════════════════════════════════════════════
*/

create table if not exists public.alerts (
  id            uuid primary key default gen_random_uuid(),
  delivery_id   uuid not null references public.deliveries(id) on delete cascade,
  route_id      uuid not null references public.routes(id) on delete cascade,
  tipo          text not null
                  check (tipo in ('tiempo_en_punto', 'ruta_no_iniciada', 'novedad')),
  mensaje       text not null,
  resuelta      boolean not null default false,
  resuelta_por  uuid references public.profiles(id),
  resuelta_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.alerts enable row level security;

-- Una sola alerta ACTIVA por (delivery_id, tipo). Cuando se resuelve
-- (resuelta = true) deja de contar, permitiendo una nueva si reaparece.
create unique index if not exists uniq_alerts_activa
  on public.alerts (delivery_id, tipo)
  where resuelta = false;

-- RLS: coordinador y admin leen y resuelven. Sin policy de INSERT →
-- ningún rol puede insertar; solo la edge function (service role) lo hace.
create policy "alerts_select" on public.alerts
  for select using (public.get_my_role() in ('admin', 'coordinador'));

create policy "alerts_update" on public.alerts
  for update using (public.get_my_role() in ('admin', 'coordinador'))
  with check (public.get_my_role() in ('admin', 'coordinador'));

create index if not exists idx_alerts_delivery on public.alerts(delivery_id);
create index if not exists idx_alerts_route     on public.alerts(route_id);
create index if not exists idx_alerts_tipo       on public.alerts(tipo);
create index if not exists idx_alerts_resuelta   on public.alerts(resuelta);

-- updated_at automático (mismo patrón que las demás tablas del schema).
drop trigger if exists trg_updated_at on public.alerts;
create trigger trg_updated_at
  before update on public.alerts
  for each row execute function public.set_updated_at();
