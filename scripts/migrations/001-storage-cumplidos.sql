/*
╔════════════════════════════════════════════════════════════════════════════╗
║  DESPACHR — MIGRACIÓN 001: Storage de cumplidos (fotos + firmas)            ║
╚════════════════════════════════════════════════════════════════════════════╝

QUÉ HACE
  - Crea el bucket PRIVADO 'cumplidos' (public = false), límite 5 MB,
    MIME permitidos: image/jpeg, image/png, image/webp.
  - Define las políticas RLS sobre storage.objects:
      · conductor   → INSERT solo en paths de rutas asignadas a él
                      (route_id se parsea del path y se valida contra
                       routes.driver_id = auth.uid()).
      · coord/admin → SELECT de todo el bucket (para ver/generar signed URLs).
      · admin       → DELETE.

ESTRUCTURA DE PATHS  (la fija lib/storage.ts — NO cambiar sin actualizar ambas)
    {route_id}/{delivery_id}/cumplido.jpg
    {route_id}/{delivery_id}/firma.png
  storage.foldername(name) devuelve las CARPETAS del path:
      (storage.foldername(name))[1] = route_id      (arrays de Postgres: base 1)
      (storage.foldername(name))[2] = delivery_id
  Comparamos route_id como TEXTO (r.id::text = ...) en vez de castear el
  segmento a uuid: un path malformado simplemente NO hace match (deny limpio)
  en lugar de lanzar una excepción de cast.

CÓMO CORRERLO
  Supabase → SQL Editor → New query → pega TODO este archivo → Run.
  Idempotente: usa `on conflict` en el bucket y `drop policy if exists` en las
  políticas, así que se puede re-correr sin error.
  Requisito: el schema base (scripts/schema.sql) ya debe existir — este script
  reutiliza public.routes y public.get_my_role().

CÓMO VERIFICAR
  1) Bucket:
       select id, public, file_size_limit, allowed_mime_types
         from storage.buckets where id = 'cumplidos';
     Esperado → public = false · file_size_limit = 5242880 ·
                allowed_mime_types = {image/jpeg,image/png,image/webp}

  2) Políticas (deben aparecer 3):
       select policyname, cmd, roles
         from pg_policies
        where schemaname = 'storage' and tablename = 'objects'
          and policyname like 'cumplidos_%';
     Esperado → cumplidos_driver_insert (INSERT) ·
                cumplidos_read (SELECT) ·
                cumplidos_admin_delete (DELETE)

  3) Prueba funcional (logueado en la app, vía lib/storage.ts):
       - conductor sube a {su_route_id}/{delivery_id}/cumplido.jpg  → OK
       - conductor sube a un route_id que NO es suyo                → error RLS
       - coordinador/admin generan signed URL (createSignedUrl)     → OK
       - conductor intenta borrar un objeto                         → error RLS
       - admin borra un objeto                                      → OK

NOTA (re-captura)
  El conductor tiene INSERT pero NO UPDATE, así que lib/storage.ts sube con
  upsert:false: la primera captura crea el objeto; sobreescribir requeriría una
  política UPDATE para el conductor (fuera del alcance de este segmento).
═════════════════════════════════════════════════════════════════════════════
*/

-- 1) BUCKET privado con límites de tamaño y tipo -----------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cumplidos',
  'cumplidos',
  false,                                              -- privado: nunca URLs públicas
  5242880,                                            -- 5 MB (5 * 1024 * 1024)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) POLÍTICAS RLS sobre storage.objects -------------------------------------
--    (RLS ya viene habilitado por defecto en storage.objects en Supabase.)

-- 2a) Conductor: INSERT solo en paths cuyo route_id es de una ruta SUYA.
drop policy if exists "cumplidos_driver_insert" on storage.objects;
create policy "cumplidos_driver_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cumplidos'
    and exists (
      select 1
        from public.routes r
       where r.id::text = (storage.foldername(name))[1]
         and r.driver_id = auth.uid()
    )
  );

-- 2b) Coordinador y admin: SELECT de todo el bucket.
drop policy if exists "cumplidos_read" on storage.objects;
create policy "cumplidos_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'cumplidos'
    and public.get_my_role() in ('admin', 'coordinador')
  );

-- 2c) Solo admin: DELETE.
drop policy if exists "cumplidos_admin_delete" on storage.objects;
create policy "cumplidos_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'cumplidos'
    and public.get_my_role() = 'admin'
  );
