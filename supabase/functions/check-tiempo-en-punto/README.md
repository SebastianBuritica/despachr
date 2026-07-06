# check-tiempo-en-punto — despliegue y programación

Edge function que revisa entregas con el conductor **>60 min en el punto** y
genera una alerta (in-app en `public.alerts` + Telegram best-effort).

> **Requisito previo:** correr `scripts/migrations/002-alerts.sql` en Supabase
> (crea la tabla `alerts` que esta función escribe).

Todo lo de abajo lo ejecutas **tú** manualmente. El agente no despliega ni corre nada.

---

## a) Crear el bot de Telegram y obtener el token

1. En Telegram, abre un chat con **@BotFather**.
2. Envía `/newbot` y sigue los pasos (nombre + username que termine en `bot`).
3. BotFather responde con el **token**, algo como:
   `123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. Guárdalo: es `TELEGRAM_BOT_TOKEN`.

## b) Obtener el chat_id del coordinador

El bot solo puede escribir a chats que ya interactuaron con él.

1. **Chat directo:** el coordinador abre el bot y le envía cualquier mensaje
   (ej. `/start`).
   **O grupo:** agrega el bot al grupo del coordinador y manda un mensaje ahí.
2. En el navegador (reemplaza `<TOKEN>`):
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
3. En el JSON busca `result[].message.chat.id`:
   - Chat directo → número positivo (ej. `987654321`).
   - Grupo → número negativo (ej. `-1001234567890`).
4. Ese número es `TELEGRAM_CHAT_ID`.

> Si `getUpdates` viene vacío, envía otro mensaje al bot y recarga.

## c) Configurar los secrets de la función

Desde la raíz del repo (proyecto ya linkeado con `supabase link`):

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=123456789:AAE... TELEGRAM_CHAT_ID=987654321
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` **ya existen** por defecto en el
runtime de edge functions — no hay que setearlos.

Verificar:
```bash
supabase secrets list
```

## d) Desplegar la función

```bash
supabase functions deploy check-tiempo-en-punto
```

La URL queda:
`https://<PROJECT_REF>.supabase.co/functions/v1/check-tiempo-en-punto`
(`<PROJECT_REF>` es `mxgfkwwdhnoumboftjal`).

> La función queda con `verify_jwt = true` (default). El cron la invoca pasando
> el **service role key** como `Authorization: Bearer …` (es un JWT válido), lo
> que además impide que terceros la llamen. No uses `--no-verify-jwt`.

## f) Probar manualmente con curl (antes de programar)

```bash
curl -i -X POST \
  'https://mxgfkwwdhnoumboftjal.supabase.co/functions/v1/check-tiempo-en-punto' \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Respuesta esperada (JSON):
```json
{ "checked": 1, "alerted": 1, "telegram_ok": 1 }
```
- `checked`  → entregas que superaban el umbral.
- `alerted`  → alertas nuevas insertadas (las repetidas se omiten).
- `telegram_ok` → cuántos envíos a Telegram respondieron OK.

Correrlo dos veces seguidas debe dar `alerted: 0` la segunda vez (ya existe la
alerta activa). Para forzar un caso de prueba: en la seed hay una entrega
`en_punto`; puedes envejecer su llegada:
```sql
update public.deliveries
   set hora_llegada_punto = now() - interval '75 minutes'
 where estado = 'en_punto';
```

---

## e) Programar cada 5 minutos con pg_cron + pg_net

### ⛔ STOP — primero verifica/habilita las extensiones

`pg_cron` y `pg_net` son extensiones; puede que no estén activas. **No asumas
que lo están.** Corre en el SQL Editor:

```sql
-- ¿Están habilitadas?
select extname from pg_extension where extname in ('pg_cron', 'pg_net');
```

Si faltan, habilítalas (Dashboard → Database → Extensions, o por SQL):
```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
```

> `pg_cron` se instala en la base `postgres`; en Supabase el scheduler ya corre
> ahí. Si el Dashboard ofrece el toggle, es la vía más simple.

### Guardar el service role key en Vault (recomendado)

Evita pegar el secreto en texto plano dentro del comando del cron:

```sql
select vault.create_secret(
  '<SERVICE_ROLE_KEY>',
  'service_role_key',
  'Service role key para invocar edge functions desde cron'
);
```

### Crear el schedule

```sql
select cron.schedule(
  'check-tiempo-en-punto-every-5min',   -- nombre del job
  '*/5 * * * *',                        -- cada 5 minutos
  $$
  select net.http_post(
    url     := 'https://mxgfkwwdhnoumboftjal.supabase.co/functions/v1/check-tiempo-en-punto',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
         where name = 'service_role_key'
      )
    ),
    body    := '{}'::jsonb
  );
  $$
);
```

> Alternativa rápida (menos segura): reemplaza el bloque `'Bearer ' || (select …)`
> por `'Bearer <SERVICE_ROLE_KEY>'` en texto plano. No recomendado.

### Verificar / administrar el job

```sql
-- Jobs programados:
select jobid, jobname, schedule, active from cron.job;

-- Últimas corridas (status 'succeeded' / 'failed'):
select job.jobname, r.status, r.start_time, r.end_time
  from cron.job_run_details r
  join cron.job job using (jobid)
 where job.jobname = 'check-tiempo-en-punto-every-5min'
 order by r.start_time desc
 limit 10;

-- Respuestas HTTP de pg_net (para ver el JSON que devolvió la función):
select id, status_code, content
  from net._http_response
 order by created desc
 limit 10;

-- Quitar el schedule:
select cron.unschedule('check-tiempo-en-punto-every-5min');
```

---

## Resumen del orden de ejecución

1. `scripts/migrations/002-alerts.sql` en SQL Editor.
2. (a)(b) Crear bot + obtener `chat_id`.
3. (c) `supabase secrets set …`
4. (d) `supabase functions deploy check-tiempo-en-punto`
5. (f) Probar con `curl`.
6. (e) Habilitar `pg_cron`/`pg_net` → guardar key en Vault → `cron.schedule(...)`.
