-- 011 — coordinador/admin pueden subir evidencia al bucket `cumplidos`
--
-- POR QUÉ: Fase 3.2 cierra el cumplido desde el LOTE ESCANEADO que sube el
-- coordinador (Girle), no desde el conductor en el punto. La política
-- `cumplidos_driver_insert` (migración 001) sólo deja subir a quien es
-- driver_id de la ruta — coordinador/admin sólo tenían `cumplidos_read`
-- (SELECT). Sin esta política, `uploadCumplido` desde `/dashboard/cumplidos`
-- falla con RLS en el primer intento.
--
-- Espeja exactamente el alcance de `cumplidos_read`: mismo bucket, mismos
-- roles. No se toca `cumplidos_driver_insert` — el conductor sigue igual.

drop policy if exists "cumplidos_coord_insert" on storage.objects;
create policy "cumplidos_coord_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cumplidos'
    and public.get_my_role() in ('admin', 'coordinador')
  );

/*
VERIFICACIÓN
  select policyname, cmd from pg_policies
   where schemaname = 'storage' and tablename = 'objects' and policyname like 'cumplidos_%';
  Esperado → cumplidos_driver_insert, cumplidos_coord_insert (INSERT) ·
             cumplidos_read (SELECT) · cumplidos_admin_delete (DELETE)
*/
