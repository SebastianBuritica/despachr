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

> **Tokens a revocar (2026-08-17):** hay **dos** rondando. El del 2026-08-16 se pegó en un chat, y
> `.claude/settings.local.json` tiene otro literal (`sbp_d30596…`) dentro de entradas de allowlist de
> permisos. Ese archivo **no está en git** — pero sólo lo salvaba el gitignore GLOBAL del equipo, así
> que se agregó al `.gitignore` del repo. Verificado: **ningún token real llegó a la historia de git**
> (los `sbp_...` que aparecen en los docs son placeholders). Revoca los dos en
> Supabase → Account → Access Tokens y genera uno nuevo que viva sólo en `~/.zshrc`.

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

> ⚠️ **Se volvió a abrir solo, una vez.** El 2026-08-16 se apagó y se confirmó apagado tras recargar;
> horas después estaba **encendido** otra vez. Se cerró de nuevo vía Management API
> (`PATCH /v1/projects/{ref}/config/auth {"disable_signup": true}`) y se verificó con una relectura
> independiente. **No se pudo determinar la causa:** los audit logs de organización requieren plan
> Team/Enterprise (este org es Free) y el toggle de "Write audit logs" de Auth sólo registra eventos
> de sesión, no cambios de configuración. Se descartó el mecanismo más común revisando el repo: **no
> hay** GitHub Actions, `vercel.json`, `supabase/config.toml` ni ramas de Supabase branching, y
> `deploy.sh` no toca Supabase. Quedan como hipótesis un `supabase link --yes` corrido esa noche, una
> sesión humana en el dashboard, o que nunca llegó a persistir.
>
> **Canario:** el `site_url` se fijó a producción el mismo día. Si vuelve a `http://localhost:3000`
> por su cuenta, hay algo re-aplicando configuración y hay que buscarlo en serio. Si sigue en
> producción, el incidente fue puntual. **Verificar ambos valores al empezar la próxima sesión:**
> ```bash
> curl -s -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
>   https://api.supabase.com/v1/projects/mxgfkwwdhnoumboftjal/config/auth \
>   | python3 -c "import json,sys; d=json.load(sys.stdin); print('disable_signup =', d['disable_signup']); print('site_url =', d['site_url'])"
> ```

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

✅ **Hecho el 2026-08-16.** Las dos URLs están en la allow list. De paso se corrigió el **Site URL**,
que era `http://localhost:3000` en un proyecto de PRODUCCIÓN: cualquier correo de auth que caiga al
redirect por defecto mandaba al usuario a su propia máquina. Ahora es `https://despachr.vercel.app`.

---

## ③ Coordenadas de las entregas · ✅ YA ESTÁ

Verificado el 2026-08-16: **6 de 6 entregas tienen coordenadas.** El mapa del coordinador dibuja
pines, no el vacío explicado. No hay nada que hacer aquí.

```sql
-- por si se quiere re-verificar
select count(*) as total, count(latitude) as con_coordenadas from public.deliveries;
```

> El mapa también dibuja la **última posición conocida por ruta**, que sale de las coordenadas de
> `delivery_events`. Esas se llenan solas cuando un conductor marca Llegué/Salí con GPS permitido.

---

## ④ Desplegar las alertas · ✅ CASI TODO HECHO (2026-08-17)

**Ya está corriendo en producción:**
- `pg_cron 1.6.4` y `pg_net 0.20.4` **habilitadas** (no lo estaban).
- Función `check-tiempo-en-punto` **desplegada**.
- Probada: primera corrida `{"checked":1,"alerted":1}`, segunda `{"alerted":0}` →
  el índice único parcial evita duplicados, como estaba diseñado.
- **Cron cada 5 min programado y verificado corriendo** (`succeeded`, HTTP 200).
- Hay una alerta real en `public.alerts` → la tarjeta del coordinador ya muestra datos vivos.

**NO hizo falta Vault.** El README pedía guardar la service role key ahí para que el cron
autenticara. Resultó innecesario: la función se autentica contra la BD con *sus propias*
credenciales inyectadas por el runtime, así que la cabecera `Authorization` sólo tiene que pasar
`verify_jwt` — y la **publishable key** (que es pública, viaja en el bundle) sirve. El cron usa esa.
Un secreto menos que rotar, y ninguna key privada quedó guardada en la base.

**LO ÚNICO QUE FALTA — Telegram (sólo tú):**
```bash
# @BotFather → /newbot → token; escríbele al bot; luego
# https://api.telegram.org/bot<TOKEN>/getUpdates → result[].message.chat.id
supabase secrets set TELEGRAM_BOT_TOKEN=<token> TELEGRAM_CHAT_ID=<chat_id>
```
**No hay que re-desplegar:** los secrets se leen en cada invocación. En la próxima corrida del cron
`telegram_ok` pasa de 0 a 1. Hasta entonces las alertas **in-app funcionan igual** — Telegram es el
canal de aviso, no el sistema.

> ⚠️ **Dato de siembra viejo:** la alerta actual dice "73638 min en el punto" (~51 días). Es correcta:
> hay una entrega de la seed en `en_punto` desde finales de junio. Aparecerá así en el E2E; no es un
> bug, es la seed.

<details>
<summary>Runbook original (por si hay que rehacerlo)</summary>

## Detalle · ~30–45 min

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

**f. Programar cada 5 min (SQL — lo puede hacer el agente).** Verificado el 2026-08-16: **ninguna de
las dos está instalada** (`cron.job` ni siquiera existe), así que este paso es obligatorio:
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

</details>

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

- [ ] ① Contraseñas rotadas (el agente de Chrome NO hace esto: no teclea credenciales)
- [x] ~~② Redirect URLs~~ + Site URL corregido a producción
- [x] ~~③ Coordenadas~~ — 6/6 ya las tienen
- [ ] Revocar los dos tokens `sbp_` y dejar el nuevo sólo en `~/.zshrc`
- [ ] Re-verificar el canario (`disable_signup` y `site_url`) al abrir la próxima sesión
- [x] ~~④ extensiones · deploy · prueba · cron programado y verificado~~
- [ ] ④ (resto) Bot de Telegram + `supabase secrets set` — sin re-deploy
- [ ] `/qa` en verde
- [ ] E2E manual en PC y celular
