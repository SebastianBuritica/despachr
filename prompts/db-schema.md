# Prompt: Generación del Schema de Base de Datos

> Prompt reutilizable para (re)generar el schema de Supabase de Despachr.
> Ejecutado por primera vez el 2026-06-23. Output: `scripts/schema.sql`.

---

## Prompt

Lee el AGENTS.md completo.

Crea el schema completo de base de datos para Despachr en Supabase.
Genera un archivo `scripts/schema.sql` listo para ejecutar en el
SQL Editor de Supabase.

El schema debe incluir:

### TABLAS
- `profiles` (extiende auth.users de Supabase, incluye rol y datos del usuario)
- `clients` (empresas que contratan el servicio logístico)
- `drivers` (conductores terceros)
- `weekly_plans` (la malla semanal)
- `routes` (cada día/ruta dentro de la malla)
- `deliveries` (cada entrega dentro de una ruta)
- `delivery_events` (cada acción del conductor en tiempo real:
  llegada, salida, cumplido, novedad, inicio_ruta, fin_ruta)
- `issues` (novedades detalladas de entregas con problema)
- `client_invoices` (facturas generadas, integración Sistran/Cigo)

### REQUISITOS TÉCNICOS
1. UUID para todos los IDs (`gen_random_uuid()`)
2. `created_at` y `updated_at` en todas las tablas
3. Row Level Security (RLS) activado en todas las tablas:
   - drivers: solo ven sus propias rutas del día activo
   - coordinators: ven todo excepto facturación y márgenes
   - admins: acceso total
4. Triggers:
   - Al insertar `delivery_event` tipo "llegada_punto" →
     actualizar `deliveries.hora_llegada_punto` y estado a "en_punto"
   - Al insertar `delivery_event` tipo "salida_punto" →
     calcular `tiempo_en_punto_minutos` automáticamente
   - Al marcar todos los deliveries de una ruta como completados →
     actualizar `routes.estado` a "completada"
   - `updated_at` automático en todas las tablas
5. Índices en columnas de búsqueda frecuente:
   `route_id`, `client_id`, `driver_id`, `fecha`, `estado`, `weekly_plan_id`
6. Foreign keys con CASCADE donde corresponde

### SEED DATA (datos de prueba realistas)
- 3 usuarios: 1 admin, 1 coordinator, 1 driver
- 2 clientes: Makro y Grupo Éxito (con tarifas diferentes)
- 3 conductores con placas reales colombianas
- 1 `weekly_plan` activo (semana actual)
- 2 `routes` con 3-4 deliveries cada una en diferentes estados
- Algunos `delivery_events` para simular una ruta en progreso

### DOCUMENTACIÓN AL FINAL DEL ARCHIVO
- Cómo ejecutarlo en Supabase
- Qué variables de entorno se necesitan
- Cómo resetear la DB si es necesario

Usa el glosario del AGENTS.md para los nombres de campos y comentarios.

---

## Notas de ejecución

- **Output:** `scripts/schema.sql`
- **Glosario aplicado:** cumplido, malla, novedad, punto, evento, flete, consolidado, exclusivo
- **Para regenerar:** ajustar este prompt y volver a ejecutarlo, sobrescribiendo `scripts/schema.sql`

### Decisiones tomadas al ejecutar (2026-06-23, Opus)

- **Usuarios de prueba vía trigger `handle_new_user()`**, no UUIDs hardcodeados.
  El profile se crea solo al registrar el usuario en Auth, leyendo `role`/`name`/`phone`
  de `raw_user_meta_data`. Evita violar la FK `profiles.id → auth.users(id)`.
- **RLS sin recursión:** helper `get_my_role()` con `SECURITY DEFINER` en vez de
  subconsultas a `profiles` dentro de las policies de `profiles`.
- **Seed como función `seed_demo_data()`** (idempotente, `SECURITY DEFINER`): se corre
  DESPUÉS de crear los usuarios en Auth; resuelve UUIDs reales por email y arma
  clientes → drivers → malla → rutas → entregas → eventos en orden correcto.
- **Status en español** alineados al glosario (`pendiente`, `en_punto`, `completada`,
  `iniciada`, `rechazada`, `fallida`; eventos: `inicio_ruta`, `fin_ruta`, `llegada_punto`,
  `salida_punto`, `foto_cumplido`, `novedad`).
- Flujo de ejecución en 3 pasos documentado al final de `scripts/schema.sql`.
