/*
╔════════════════════════════════════════════════════════════════════════════╗
║  DESPACHR — MIGRACIÓN 003: Fix signup por teléfono (Supabase Phone Auth)    ║
╚════════════════════════════════════════════════════════════════════════════╝

PROBLEMA
  El signup por OTP de SMS (solo teléfono, sin email) fallaba con
  500 "Database error saving new user". El trigger on_auth_user_created →
  public.handle_new_user() insertaba en public.profiles usando:
    - new.email directo → NULL en signups por teléfono, pero profiles.email
      era NOT NULL ⇒ el insert abortaba toda la transacción.
    - name = split_part(new.email,'@',1) → NULL cuando no hay email ⇒
      profiles.name (NOT NULL) también fallaba.
    - phone = raw_user_meta_data->>'phone' → en OTP el número real llega en
      la columna nativa new.phone, no en los metadatos ⇒ quedaba vacío.

FIX (Opción B — email anulable)
  1) profiles.email pasa a NULLABLE: un usuario solo-teléfono (los conductores)
     tiene email = NULL en vez de guardar el teléfono dentro de la columna email.
  2) handle_new_user() corregida:
     - email = new.email (puede ser NULL).
     - name  = cadena de fallbacks que nunca da NULL.
     - phone = coalesce(new.phone, metadata.phone)  → número nativo primero.

DEPENDENCIAS / ORDEN
  Requiere el schema base ya aplicado (scripts/schema.sql). Esta migración es
  idempotente: DROP NOT NULL y CREATE OR REPLACE se pueden re-correr sin error.
  (scripts/schema.sql ya fue actualizado con esta misma definición, para que
   una instalación NUEVA no reintroduzca el bug; esta migración arregla las
   bases EXISTENTES.)

CÓMO CORRERLO
  Supabase → SQL Editor → New query → pega TODO este archivo → Run.

CÓMO VERIFICAR
  1) email quedó anulable:
       select is_nullable from information_schema.columns
        where table_schema='public' and table_name='profiles' and column_name='email';
     Esperado → YES

  2) Función actualizada (debe contener coalesce(new.phone, ...)):
       select pg_get_functiondef('public.handle_new_user()'::regprocedure);

  3) Prueba funcional: en Supabase → Authentication → Providers habilita Phone
     (Twilio Verify) y haz un signup por SMS. Debe crear la fila en profiles:
       select id, email, name, phone, role from public.profiles
        where phone is not null order by created_at desc limit 5;
     Esperado → email NULL, phone = número E.164, role 'conductor'.
═════════════════════════════════════════════════════════════════════════════
*/

-- 1) email anulable (los usuarios solo-teléfono no tienen correo) ------------
alter table public.profiles alter column email drop not null;

-- 2) Trigger corregido: NULL-safe en email/name y phone desde new.phone ------
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
    new.email,   -- puede ser NULL en signups por teléfono
    coalesce(
      new.raw_user_meta_data->>'name',
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),  -- parte local del email si existe
      new.phone,                                                -- si no, el teléfono
      'Usuario'                                                 -- último recurso (name es NOT NULL)
    ),
    coalesce(new.raw_user_meta_data->>'role', 'conductor'),
    coalesce(new.phone, new.raw_user_meta_data->>'phone')       -- número nativo de OTP primero
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
