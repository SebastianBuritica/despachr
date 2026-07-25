/*
╔════════════════════════════════════════════════════════════════════════════╗
║  DESPACHR — Helper de PRUEBA (NO es migración): Fase 1.1 app del conductor  ║
╚════════════════════════════════════════════════════════════════════════════╝

QUÉ HACE (manipula DATOS, no el schema)
  Deja tu usuario conductor (login por OTP/teléfono) listo para probar la app
  con datos reales en el teléfono:
    1. Resuelve tu profile por número de teléfono.
    2. Asegura tu fila en `drivers` (routes.driver_id y los eventos la exigen).
    3. Toma la ruta del seed que tiene entregas, la pone a TU nombre y con
       fecha = HOY (zona America/Bogota, igual que la query getRutaDelDia).
    4. Pone un teléfono REAL en el punto 1 para probar el botón "Llamar".
    5. Reinicia las entregas a 'pendiente' para probar el flujo llegada→salida
       desde cero.

CÓMO USARLO
  1. Haz login por OTP una vez en la app para que exista tu profile conductor.
  2. Edita v_phone (tu número, formato del OTP). v_llamar por defecto = v_phone
     (te llamas a ti mismo: número real y dialeable sin molestar a nadie).
     Cámbialo si quieres marcar otra línea real.
  3. Supabase → SQL Editor → pega TODO → Run. Reversible: reasignar la ruta a
     otro driver la devuelve.

RUTA DE VERIFICACIÓN (lo que pide el spec)
  App: OTP login → ves tus entregas → "Llegué al punto" → en Supabase revisa
  delivery_events (llegada_punto con lat/long) → "Capturar cumplido" →
  "Confirmar entrega" → revisa delivery_events (salida_punto) y que el trigger
  calculó deliveries.tiempo_en_punto_minutos. Las queries de verificación están
  al final de este archivo.
*/

do $$
declare
  v_phone  text := '+57XXXXXXXXXX';   -- <<< TU teléfono (el que usas para el OTP)
  v_llamar text := null;               -- null → usa v_phone. Cámbialo por otra línea real si quieres.
  v_driver uuid;
  v_route  uuid;
begin
  v_llamar := coalesce(v_llamar, v_phone);

  -- 1) Tu profile conductor
  select id into v_driver
    from public.profiles
   where phone = v_phone and role = 'conductor';
  if v_driver is null then
    raise exception
      'No hay profile conductor con phone %. Haz login por OTP una vez para crearlo.', v_phone;
  end if;

  -- 2) Fila en drivers (license_plate y document_number son NOT NULL UNIQUE → valores de prueba)
  insert into public.drivers (id, vehicle_id, license_plate, document_number, phone_number, is_active)
  values (v_driver, 'Vehículo de prueba', 'TEST-001', 'DOC-TEST-001', v_phone, true)
  on conflict (id) do nothing;

  -- 3) Ruta del seed que tenga entregas → a tu nombre y HOY (Bogota)
  select r.id into v_route
    from public.routes r
    join public.deliveries d on d.route_id = r.id
   group by r.id
   order by r.created_at
   limit 1;
  if v_route is null then
    raise exception 'No hay rutas con entregas. Corre  select public.seed_demo_data();  primero.';
  end if;

  update public.routes
     set driver_id = v_driver,
         fecha     = (now() at time zone 'America/Bogota')::date,
         estado    = 'en_curso'
   where id = v_route;

  -- 4) Teléfono REAL en el punto 1 (botón "Llamar")
  update public.deliveries
     set telefono_receptor = v_llamar
   where route_id = v_route and numero_secuencia = 1;

  -- 5) Entregas a cero para probar el flujo completo
  update public.deliveries
     set estado = 'pendiente',
         hora_llegada_punto = null,
         hora_salida_punto = null,
         tiempo_en_punto_minutos = null
   where route_id = v_route;

  raise notice 'Listo. Ruta % → conductor % (%), HOY. "Llamar" en punto 1: %',
    v_route, v_phone, v_driver, v_llamar;
end $$;

-- ── VERIFICACIÓN ────────────────────────────────────────────────────────────

-- (a) Eventos que registró la app — espera llegada_punto y salida_punto, con
--     lat/long si concediste permiso de ubicación (NULL si lo negaste: es válido).
-- select tipo_evento, latitude, longitude, "timestamp"
--   from public.delivery_events
--  order by "timestamp" desc
--  limit 10;

-- (b) Que el trigger de salida calculó el tiempo en punto:
-- select numero_secuencia, estado, hora_llegada_punto, hora_salida_punto,
--        tiempo_en_punto_minutos, telefono_receptor
--   from public.deliveries d
--   join public.routes r on r.id = d.route_id
--  where r.fecha = (now() at time zone 'America/Bogota')::date
--  order by numero_secuencia;
