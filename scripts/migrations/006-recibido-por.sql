/*
╔════════════════════════════════════════════════════════════════════════════╗
║  DESPACHR — MIGRACIÓN 006: evidencia del cumplido (recibido_por + firma_url) ║
╚════════════════════════════════════════════════════════════════════════════╝

QUÉ HACE
  Fase 1.2 hace real el cumplido: foto + firma se suben a Storage y se persisten.
  Faltan dos columnas donde guardar la evidencia y hay que exponerlas al conductor.

  1. public.deliveries.recibido_por (text, NULLABLE): nombre de quien recibe.
     Se captura en la UI (campo "Recibido por") pero no tenía dónde ir.
  2. public.deliveries.firma_url (text, NULLABLE): path en el bucket 'cumplidos'
     de la firma (PNG). foto_cumplido_url ya existía (base schema) para la foto;
     no existía el equivalente de la firma → se agrega. NO se duplica la foto.
     La firma es OPCIONAL (hay receptores que no firman; la foto de la factura
     sellada es la evidencia legal real), por eso nullable.
  3. Se REEMPLAZA public.entregas_de_ruta (RPC del conductor, migración 005) para
     que DEVUELVA foto_cumplido_url, firma_url y recibido_por — así la app puede
     reflejar lo realmente capturado. Mismo endurecimiento SECURITY DEFINER:
     search_path pineado, chequeo de propiedad, lista blanca (SIN valor_flete),
     LEFT join a clients (una entrega nunca desaparece por client_id huérfano),
     y permisos revocados de public/anon + concedidos solo a authenticated.

     OJO: create or replace NO puede cambiar el tipo de retorno (005 devolvía 9
     columnas; aquí son 12) → Postgres lo rechaza. Hay que DROP FUNCTION antes del
     CREATE, con el tipo de argumento explícito (el nombre puede sobrecargarse).
     Y tras un drop+create Postgres concede EXECUTE a PUBLIC por defecto: el
     revoke del final es LOAD-BEARING, no defensivo. Por eso todo (drop, create,
     revoke, grant) va en UNA sola transacción (begin/commit): fuera de ella la
     función solo se ve ya con los permisos correctos, sin ventana pública.

  NUMERACIÓN: peso_kg/volumen_m3 pasa de 006 a 007 (este corre antes).

DEPENDENCIAS
  Migración 005 (creó entregas_de_ruta). Schema base: deliveries, clients, routes.

CÓMO CORRERLO
  Supabase → SQL Editor → New query → pega TODO este archivo → Run.
  Idempotente (add column if not exists / drop function if exists + create /
  revoke / grant). Distinto mecanismo que 005 (allí era create or replace); aquí
  es drop + create por el cambio de tipo de retorno. Envuelto en begin/commit.

CÓMO VERIFICAR
  -- (a) Columnas nuevas (nullable):
  --   select column_name, data_type, is_nullable from information_schema.columns
  --    where table_schema='public' and table_name='deliveries'
  --      and column_name in ('recibido_por','firma_url');   -- ambas text | YES
  -- (b) La RPC devuelve las columnas nuevas y sigue endurecida:
  --   select p.prosecdef as secdef, p.proconfig
  --     from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  --    where n.nspname='public' and p.proname='entregas_de_ruta';  -- secdef=true; search_path=public, pg_temp
  -- (c) Prueba real: en la app, confirma un cumplido con foto (+firma opcional);
  --   luego revisa deliveries.foto_cumplido_url / firma_url / recibido_por.
*/

-- Todo en una sola transacción: el revoke debe aplicarse junto con el create
-- para que la RPC nunca quede, ni por un instante visible fuera, ejecutable por
-- PUBLIC (Postgres concede EXECUTE a PUBLIC por defecto tras drop+create).
begin;

-- ── (1) Columnas de evidencia ────────────────────────────────────────────────
alter table public.deliveries
  add column if not exists recibido_por text;

alter table public.deliveries
  add column if not exists firma_url text;

comment on column public.deliveries.recibido_por is
  'Nombre de quien recibe la entrega (capturado en el cumplido). Nullable.';
comment on column public.deliveries.firma_url is
  'Path en el bucket cumplidos de la firma (PNG). Nullable — la firma es opcional.';

-- ── (2) RPC del conductor: ahora devuelve la evidencia ───────────────────────
-- DROP antes del CREATE: create or replace no puede cambiar el tipo de retorno
-- (005 devolvía 9 columnas; aquí 12). Arg type explícito → evita ambigüedad por
-- sobrecarga de nombre.
drop function if exists public.entregas_de_ruta(uuid);

create function public.entregas_de_ruta(p_route_id uuid)
returns table (
  id                  uuid,
  route_id            uuid,
  numero_secuencia    integer,
  address             text,
  city                text,
  telefono_receptor   text,
  estado              text,
  hora_llegada_punto  timestamptz,
  cliente_nombre      text,
  foto_cumplido_url   text,
  firma_url           text,
  recibido_por        text
)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select
    d.id,
    d.route_id,
    d.numero_secuencia,
    d.address,
    d.city,
    d.telefono_receptor,
    d.estado,
    d.hora_llegada_punto,
    c.name,
    d.foto_cumplido_url,
    d.firma_url,
    d.recibido_por
  from public.deliveries d
  -- LEFT join a propósito: si client_id es null u huérfano, la entrega NO debe
  -- desaparecer de la lista del conductor. c.name vuelve null → la UI muestra "—".
  left join public.clients c on c.id = d.client_id
  where d.route_id = p_route_id
    -- Propiedad: el llamador debe ser el conductor de la ruta. Si no, vacío.
    and exists (
      select 1 from public.routes r
       where r.id = p_route_id
         and r.driver_id = auth.uid()
    )
  order by d.numero_secuencia;
$$;

-- ── (3) Permisos: solo usuarios autenticados ─────────────────────────────────
-- LOAD-BEARING: tras drop+create la función es EXECUTE-para-PUBLIC por defecto.
-- Este revoke, en la MISMA transacción que el create, cierra esa ventana.
revoke all on function public.entregas_de_ruta(uuid) from public, anon;
grant execute on function public.entregas_de_ruta(uuid) to authenticated;

commit;
