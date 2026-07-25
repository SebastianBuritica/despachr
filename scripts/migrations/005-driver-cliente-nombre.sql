/*
╔════════════════════════════════════════════════════════════════════════════╗
║  DESPACHR — MIGRACIÓN 005: nombre del cliente para el conductor (RPC)       ║
╚════════════════════════════════════════════════════════════════════════════╝

QUÉ HACE
  El conductor NO puede leer public.clients (la policy clients_select solo
  permite admin/coordinador), así que el join clients(name) le volvía NULL y las
  tarjetas mostraban "—". No se puede abrir clients por RLS: es row-level, y
  expondría tarifa_flete (precio, dato del coordinador) — la RLS no oculta
  columnas y admin/coordinador/conductor comparten el rol de BD `authenticated`.

  Solución: una función SECURITY DEFINER que devuelve SOLO columnas seguras
  (incluye el nombre del cliente, NUNCA valor_flete ni tarifa_flete), acotada a
  las entregas de una ruta que pertenece al conductor que llama.

  Además, endurece public.get_my_role() (usada en toda la RLS): su search_path
  no incluía pg_temp. Un SECURITY DEFINER sin search_path pineado (con pg_temp
  al final) es secuestrable si un llamador crea un objeto que haga sombra en un
  esquema anterior del path. Se recrea idéntica, solo con el search_path seguro.

ENDURECIMIENTO (SECURITY DEFINER — todos obligatorios)
  1. set search_path = public, pg_temp  (pg_temp al final → no se puede shadowear).
  2. Chequeo de propiedad DENTRO de la función (exists sobre routes con
     driver_id = auth.uid()); si el conductor pasa un route_id ajeno → vacío.
  3. revoke execute a public/anon; grant execute solo a authenticated.
  4. Columnas de retorno en lista blanca: se excluye valor_flete y todo de
     clients salvo name. Nada de select *.

DEPENDENCIAS
  Schema base (scripts/schema.sql): deliveries, clients, routes, profiles.

CÓMO CORRERLO
  Supabase → SQL Editor → New query → pega TODO este archivo → Run.
  Idempotente (create or replace / revoke / grant).

CÓMO VERIFICAR
  -- (a) Funciones con search_path pineado (incluye pg_temp) y security definer:
  --   select p.proname, p.prosecdef as secdef, p.proconfig
  --     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  --    where n.nspname='public' and p.proname in ('entregas_de_ruta','get_my_role');
  --   Esperado: proconfig con {search_path=public, pg_temp}; secdef = true.
  -- (b) Permisos de ejecución (solo authenticated):
  --   select proname, proacl from pg_proc where proname = 'entregas_de_ruta';
  -- (c) Prueba real: en la app, login como conductor → las tarjetas muestran el
  --   nombre del cliente (Makro/Éxito) en vez de "—".
  --   (Desde el SQL Editor auth.uid() es NULL → la función devuelve vacío: es lo
  --    esperado; el chequeo de propiedad hace su trabajo.)
*/

-- ── (1) Endurecer get_my_role() — misma definición, search_path seguro ───────
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── (2) Entregas de una ruta, con nombre de cliente, para el conductor dueño ──
create or replace function public.entregas_de_ruta(p_route_id uuid)
returns table (
  id                  uuid,
  route_id            uuid,
  numero_secuencia    integer,
  address             text,
  city                text,
  telefono_receptor   text,
  estado              text,
  hora_llegada_punto  timestamptz,
  cliente_nombre      text
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
    c.name
  from public.deliveries d
  -- LEFT join a propósito: si client_id es null u huérfano, la entrega NO debe
  -- desaparecer de la lista del conductor. c.name vuelve null → la UI muestra
  -- "—". Un nombre faltante es cosmético; una entrega faltante es operativo
  -- (carga que nadie entrega porque nadie la vio).
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
revoke all on function public.entregas_de_ruta(uuid) from public, anon;
grant execute on function public.entregas_de_ruta(uuid) to authenticated;
