/*
╔════════════════════════════════════════════════════════════════════════════╗
║  DESPACHR — MIGRACIÓN 007: cierre de escalada de privilegios (RLS columnar) ║
╚════════════════════════════════════════════════════════════════════════════╝

PROBLEMA (auditoría 2026-08-15 — hallazgos C1, C2, C4, H1)
  Los cuatro tienen la MISMA raíz: **RLS de Postgres es row-level, y en tres
  sitios se escribió como si fuera column-level**. Una policy acota QUÉ FILA se
  puede editar, nunca QUÉ COLUMNAS de esa fila.

  C1 (crítico) — escalada a admin en una sola petición HTTP.
     `profiles_update_self` deja al usuario editar su propia fila. `role` es una
     columna más de esa fila ⇒ cualquier autenticado (incluido un conductor,
     que es TERCERO CONTRATISTA, no empleado) hace
       PATCH /rest/v1/profiles?id=eq.<su_uid>  {"role":"admin"}
     y pasa a leer delivery_financials (pago a cada transportista, margen por
     entrega) y client_invoices (facturación, DSO, tarifa_flete de cada cliente).
     Anula por completo la separación de roles sobre la que se sostiene el
     modelo de seguridad del producto.

  C2 (crítico) — rol autoasignado en el signup.
     handle_new_user() leía el rol de `raw_user_meta_data` (= user_metadata),
     que el cliente ESCRIBE en el propio signup. Hoy sólo está contenido porque
     el registro público está deshabilitado: un toggle del dashboard separa el
     sistema de un "hazte admin al registrarte".

  C4 (crítico) — seed_demo_data() es SECURITY DEFINER y Postgres concede
     EXECUTE a PUBLIC por defecto ⇒ era invocable por **anon** vía RPC y escribía
     datos de demostración dentro de producción.

  H1 (alto) — mismo patrón columnar en deliveries: `deliveries_driver_update`
     acota la fila (entregas de SUS rutas) pero no las columnas, así que el
     conductor podía escribir `valor_flete` — lo que se le COBRA AL CLIENTE por
     esa entrega — además de dirección, cliente y secuencia del punto.

QUÉ HACE
  1. Trigger public.protect_profile_columns() en profiles: sólo un admin puede
     cambiar `role`; `id` queda inmutable para todos salvo el backend.
  2. handle_new_user() pasa a leer el rol de `raw_app_meta_data` (= app_metadata),
     que el usuario NO puede escribir — sólo el service_role / Admin API — y
     además lo valida contra la lista de roles legales (cualquier otra cosa cae
     a 'conductor'). El resto del comportamiento de la 003 se conserva intacto.
  3. revoke execute de seed_demo_data() a public/anon/authenticated.
  4. Trigger public.protect_delivery_columns() en deliveries: si quien escribe
     es un conductor, las columnas COMERCIALES//de planificación se restauran a
     su valor anterior en silencio.

  ALCANCE DELIBERADO DE (4): se protegen sólo las columnas comerciales y de
  planificación (valor_flete, client_id, route_id, address, city, latitude,
  longitude, numero_secuencia). NO se tocan estado, foto_cumplido_url,
  firma_url, recibido_por, observaciones ni las columnas derivadas
  (hora_llegada_punto, hora_salida_punto, tiempo_en_punto_minutos) porque
  **on_llegada_punto() y on_salida_punto() NO son SECURITY DEFINER**: escriben
  esos timestamps con la sesión del propio conductor. Protegerlas revertiría el
  update del trigger y rompería el cronómetro de la Fase 1.1. El conductor
  escribe su operación; nunca la comercial.

  POR QUÉ auth.uid() IS NULL SE PERMITE (ambos triggers): service_role (Admin
  API, dashboard, SQL editor) no lleva JWT ⇒ auth.uid() es NULL y salta RLS.
  Un anónimo NO puede llegar a estos triggers: `profiles_update_self` exige
  id = auth.uid() (NULL no empareja ninguna fila) y `deliveries_driver_update`
  exige ser dueño de la ruta. Un uid NULL que llegó hasta aquí es, por
  construcción, contexto de backend de confianza.

  NUMERACIÓN: 007 se usa AQUÍ. peso_kg/volumen_m3 (planificador de malla) pasa
  a 008 — no lo bloquea nada de esto y sigue esperando requisitos del cliente.

NO CUBRE (acciones manuales tuyas, fuera de SQL)
  C3 — los usuarios *@despachr.test existen en producción y este repo es
  PÚBLICO: scripts/schema.sql documentaba 'password123' para admin@despachr.test.
  Esta migración no puede rotar contraseñas. Rota o elimina esas cuentas en
  Supabase → Authentication → Users. La contraseña se quita del repo en el mismo
  PR que trae esta migración, pero **queda en el historial de git**: rotarla es
  obligatorio, no opcional.
  Verifica también que Authentication → Providers → Email → "Enable signup" siga
  DESHABILITADO (es la segunda capa de C2).

DEPENDENCIAS
  Schema base (profiles, deliveries, get_my_role, handle_new_user, seed_demo_data)
  y migración 003 (handle_new_user null-safe, cuyo comportamiento se preserva).

CÓMO CORRERLO
  Supabase → SQL Editor → New query → pega TODO este archivo → Run.
  Idempotente (create or replace / drop trigger if exists + create / revoke).
  En una sola transacción.

CÓMO VERIFICAR
  -- (a) ¿Hay algún admin inesperado? Córrelo ANTES y DESPUÉS. Si aparece
  --     alguien que no reconoces, C1 ya fue explotado:
  --   select id, email, phone, name, role, created_at from public.profiles
  --    where role in ('admin','coordinador') order by created_at;
  -- (b) Los triggers existen:
  --   select tgname, tgrelid::regclass from pg_trigger
  --    where tgname in ('trg_protect_profile_columns','trg_protect_delivery_columns');
  -- (c) handle_new_user ya no lee user_metadata para el rol (debe salir app_meta):
  --   select pg_get_functiondef('public.handle_new_user()'::regprocedure);
  -- (d) seed_demo_data ya no es ejecutable por anon:
  --   select has_function_privilege('anon','public.seed_demo_data()','execute');  -- false
  -- (e) PRUEBA REAL de C1 — con la sesión de un conductor en la app (consola del
  --     navegador; debe fallar con 42501, antes devolvía 200):
  --   await supabase.from('profiles').update({role:'admin'}).eq('id', (await supabase.auth.getUser()).data.user.id)
  -- (f) PRUEBA REAL de H1 — misma sesión, sobre una entrega suya (valor_flete
  --     debe quedar igual que antes):
  --   await supabase.from('deliveries').update({valor_flete: 999999}).eq('id','<id_de_su_entrega>')
*/

begin;

-- ── (1) C1: nadie que no sea admin cambia profiles.role ──────────────────────
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- auth.uid() NULL ⇒ service_role / SQL editor (ver cabecera): se permite.
  if auth.uid() is not null and public.get_my_role() is distinct from 'admin' then
    if new.role is distinct from old.role then
      raise exception 'No autorizado: el rol solo lo cambia un administrador'
        using errcode = '42501';
    end if;
    -- La PK no se reasigna desde el cliente ni con una policy mal escrita.
    new.id := old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_columns on public.profiles;
create trigger trg_protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ── (2) C2: el rol del signup sale de app_metadata, no de user_metadata ──────
-- app_metadata sólo lo escribe el service_role / Admin API; user_metadata lo
-- escribe el propio cliente en el signup. Se conserva todo lo demás de la 003
-- (email anulable, cadena de fallbacks de name, phone nativo de OTP primero).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, name, role, phone)
  values (
    new.id,
    new.email,   -- puede ser NULL en signups por teléfono
    coalesce(
      new.raw_user_meta_data->>'name',
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),  -- parte local del email si existe
      new.phone,                                                -- si no, el teléfono
      'Usuario'                                                 -- último recurso (name es NOT NULL)
    ),
    -- Lista blanca explícita: un valor ausente, inválido o inyectado cae a
    -- 'conductor', el rol de menor privilegio. Nunca se confía en el input.
    case new.raw_app_meta_data->>'role'
      when 'admin'       then 'admin'
      when 'coordinador' then 'coordinador'
      when 'conductor'   then 'conductor'
      else 'conductor'
    end,
    coalesce(new.phone, new.raw_user_meta_data->>'phone')       -- número nativo de OTP primero
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── (3) C4: seed_demo_data deja de ser invocable por anon ────────────────────
-- Postgres concede EXECUTE a PUBLIC por defecto; sin este revoke la función
-- (SECURITY DEFINER) escribía datos de demo en producción desde la anon key.
revoke all on function public.seed_demo_data() from public, anon, authenticated;

-- ── (4) H1: el conductor no escribe columnas comerciales de deliveries ───────
-- Restauración silenciosa (no raise): el conductor legítimo nunca intenta esto
-- desde la app, así que un error visible sólo rompería la UI ante un payload
-- inesperado. Lo que se cierra es el camino, no la experiencia.
create or replace function public.protect_delivery_columns()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and public.get_my_role() = 'conductor' then
    new.valor_flete      := old.valor_flete;
    new.client_id        := old.client_id;
    new.route_id         := old.route_id;
    new.address          := old.address;
    new.city             := old.city;
    new.latitude         := old.latitude;
    new.longitude        := old.longitude;
    new.numero_secuencia := old.numero_secuencia;
    new.telefono_receptor := old.telefono_receptor;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_delivery_columns on public.deliveries;
create trigger trg_protect_delivery_columns
  before update on public.deliveries
  for each row execute function public.protect_delivery_columns();

commit;
