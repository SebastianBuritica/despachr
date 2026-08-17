# Supabase — lo que falta y cómo hacerlo (con o sin agente)

**Fecha:** 2026-08-16 · **Proyecto:** `mxgfkwwdhnoumboftjal` · **Estado del código:** v1 completo y mergeado (PRs #29–#42).

Todo lo que queda de v1 es **configuración en Supabase**, no código. Este documento es el
traspaso: qué falta, en qué orden, y qué puede hacer un agente por ti si le das acceso.

> Compañeros: [STATUS.md](STATUS.md) (estado general) · [AGENTS.md](AGENTS.md) (referencia durable) ·
> [supabase/functions/check-tiempo-en-punto/README.md](supabase/functions/check-tiempo-en-punto/README.md)
> (runbook detallado de la tarea ④).

---

## 0) Cómo habilitar al agente — hazlo ANTES de abrir la sesión

Verificado el 2026-08-16 en esta máquina: **la CLI no tiene credencial** (no hay token en
`~/.supabase/`, ni en `~/Library/Application Support/supabase/`, ni en el llavero) y **las
herramientas MCP de Supabase no aparecen en la sesión**.

Dos causas distintas, y una sola solución que arregla las dos:

| Problema | Por qué |
|---|---|
| MCP no visible | Las herramientas MCP se registran **al arrancar la sesión**. Autenticar el conector después no las agrega a una sesión ya corriendo. Además `.mcp.json` lee `${SUPABASE_ACCESS_TOKEN}`. |
| CLI sin token | `supabase login` **no funciona desde el agente**: exige TTY (`LegacyLoginMissingTokenError`). |

### ✅ La solución: exportar el token ANTES de lanzar Claude Code

```bash
# Supabase → Account → Access Tokens → Generate new token (empieza con sbp_)
export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxx
claude          # lanzar la sesión DESPUÉS del export
```

Con eso, en la sesión nueva:
- **`.mcp.json` autentica** → el agente obtiene las herramientas MCP de Supabase (correr SQL, leer
  tablas, revisar logs).
- **La CLI también lo lee** → `supabase link`, `secrets set`, `functions deploy` funcionan.

Para que sobreviva a reinicios, ponlo en `~/.zshrc`. **Nunca lo pegues en el chat** ni lo comitees:
este repo es público y ya hubo un incidente con una contraseña en `schema.sql` (ver migración `007`).

### Qué puede y qué NO puede hacer el agente

| Puede (con el token exportado) | No puede — es tuyo |
|---|---|
| Correr SQL (verificaciones, `pg_cron`, Vault) | Crear el bot en **Telegram** (@BotFather) |
| `supabase link` / `functions deploy` | **Rotar contraseñas** de usuarios (dashboard) |
| Leer estado de tablas, extensiones, jobs | Marcar toggles del dashboard (Redirect URLs, signup) |
| Diagnosticar por qué algo no corrió | `supabase secrets set` (lleva tu token de Telegram) |

> **Alternativa sin token:** la **extensión de Chrome** ya funcionó bien para la migración `007`.
> Sirve para todo lo de dashboard y SQL Editor. Es la vía más rápida si no quieres gestionar tokens.

---

## ① Rotar las contraseñas de prueba · ~5 min · **primero**

**Dashboard → Authentication → Users.** Para `admin@`, `coord@`, `driver@`, `driver2@`,
`driver3@ despachr.test`: menú **⋯ → Reset password** (o Update user) con una contraseña aleatoria
distinta por usuario, guardada en tu gestor.

⚠️ **Rotar, NO borrar.** `routes.driver_id` referencia `drivers(id)` sin `ON DELETE`, así que borrar
un conductor con rutas falla o arrastra datos. La rotación es el camino seguro.

**Por qué urge:** `scripts/schema.sql` publicó una contraseña compartida en un **repo público** hasta
la migración `007`. Está en el historial de git **para siempre**; quitarla del archivo no la
despublicó. `admin@` es la crítica.

De paso, confirma que **"Allow new users to sign up" sigue APAGADO** (se apagó en la remediación
`007` y debe quedarse así — ver AGENTS.md).

**Verificación (SQL, la puede correr el agente):**
```sql
select id, email, role, created_at
  from public.profiles
 where role in ('admin','coordinador')
 order by created_at;
```
Deben salir exactamente 2 filas conocidas: Carlos Admin y Daniela Coord.

---

## ② Redirect URLs del reset de contraseña · ~2 min

**Dashboard → Authentication → URL Configuration → Redirect URLs**, agregar:

```
https://despachr.vercel.app/reset-password
http://localhost:3000/reset-password
```

Sin esto, el correo de recuperación se envía pero **el enlace rebota**.

**Desbloquea:** `/forgot-password` → `/reset-password` (PR #30).

**Cómo probarlo bien:** usa el propio flujo para ponerle la contraseña nueva a `admin@`. Verifica la
tarea ① y la ② de una sola pasada, en la cuenta que más lo necesita.

---

## ③ Coordenadas de las entregas · ~1 min

El mapa del coordinador (PR #40) dibuja `deliveries.latitude/longitude`. Si vienen nulas, muestra un
vacío **explicado** (correcto, pero no ves el mapa funcionando).

```sql
select count(*) as total, count(latitude) as con_coordenadas
  from public.deliveries;
```

Si `con_coordenadas = 0`, dale algo que dibujar:

```sql
update public.deliveries set latitude = 8.7500,  longitude = -75.8814 where city ilike '%monter%';
update public.deliveries set latitude = 10.9639, longitude = -74.7964 where city ilike '%barranquilla%';
```

> El mapa también dibuja la **última posición conocida por ruta**, que sale de las coordenadas de
> `delivery_events`. Esas se llenan solas cuando un conductor marca Llegué/Salí con GPS permitido.

---

## ④ Desplegar las alertas · ~30–45 min · **la grande**

Es lo que hace que la tarjeta de alertas del coordinador **se llene**. Runbook completo:
[supabase/functions/check-tiempo-en-punto/README.md](supabase/functions/check-tiempo-en-punto/README.md).
Resumen del orden:

**a. Telegram (sólo tú).** @BotFather → `/newbot` → guardar el token.
**b. chat_id (sólo tú).** Escríbele al bot, luego abre
`https://api.telegram.org/bot<TOKEN>/getUpdates` y toma `result[].message.chat.id`.

**c. Secrets (sólo tú — lleva el token de Telegram):**
```bash
supabase link --project-ref mxgfkwwdhnoumboftjal
supabase secrets set TELEGRAM_BOT_TOKEN=<token> TELEGRAM_CHAT_ID=<chat_id>
```

**d. Deploy (lo puede hacer el agente):**
```bash
supabase functions deploy check-tiempo-en-punto
```

**e. Probar ANTES de programar.** No programes una función que no probaste: un cron fallando en
silencio cada 5 minutos es peor que no tenerlo.
```sql
-- forzar un caso: envejecer una entrega que esté en punto
update public.deliveries
   set hora_llegada_punto = now() - interval '75 minutes'
 where estado = 'en_punto';
```
```bash
curl -i -X POST \
  'https://mxgfkwwdhnoumboftjal.supabase.co/functions/v1/check-tiempo-en-punto' \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" -H "Content-Type: application/json" -d '{}'
# esperado: { "checked": 1, "alerted": 1, "telegram_ok": 1 }
# correrlo dos veces → la segunda debe dar "alerted": 0 (ya existe la alerta activa)
```

**f. Programar cada 5 min (SQL — lo puede hacer el agente).** Primero verificar extensiones, que
puede que NO estén activas:
```sql
select extname from pg_extension where extname in ('pg_cron','pg_net');
create extension if not exists pg_cron;
create extension if not exists pg_net;
```
Luego Vault + `cron.schedule(...)` — el bloque exacto está en el README de la función.

**Verificar que quedó corriendo:**
```sql
select jobid, jobname, schedule, active from cron.job;

select job.jobname, r.status, r.start_time
  from cron.job_run_details r join cron.job job using (jobid)
 where job.jobname = 'check-tiempo-en-punto-every-5min'
 order by r.start_time desc limit 5;
```

---

## Después: probar

1. **`/qa`** — barrido Playwright de todas las pantallas (desktop + móvil, claro + oscuro) con axe.
   Confirma de paso el trabajo de contraste del PR #41, que se verificó por cálculo pero **no** con
   una corrida real de axe.
2. **E2E manual.** Tres flujos que **nunca se ejercitaron contra red real** porque dependían de las
   tareas de arriba:

| Flujo | Dependía de |
|---|---|
| Reset de contraseña (ida y vuelta) | ② |
| Login por OTP (SMS real) | nada — probar con `573229596618`, ya provisionado |
| Mapa con pines | ③ |

Si alguno falla, es probablemente eso — no un defecto escondido.

**Dos cosas que se van a ver "mal" y están bien:** las 4 pantallas de **admin** muestran cifras
inventadas (mock por decisión de alcance, van a v1.1 y las 4 lo dicen con su aviso), y las
**alertas salen vacías** hasta la tarea ④.

---

## Checklist

- [ ] ① Contraseñas rotadas · signup sigue apagado
- [ ] ② Redirect URLs agregadas · reset probado con `admin@`
- [ ] ③ Coordenadas verificadas (o sembradas)
- [ ] ④ Bot creado · secrets · deploy · curl OK · `pg_cron` programado y corriendo
- [ ] `/qa` en verde
- [ ] E2E manual en PC y celular
