// ============================================================================
// Edge Function (Deno) — check-tiempo-en-punto
// ----------------------------------------------------------------------------
// Detecta entregas donde el conductor lleva >60 min en el punto (estado
// 'en_punto') y genera una alerta para el coordinador:
//   1. Inserta una fila en public.alerts (fuente de verdad).
//   2. Envía el mismo mensaje a Telegram (best-effort; si falla, la alerta
//      igual queda guardada).
// Se invoca por cron cada 5 min (ver README.md). Usa el service role key, que
// hace bypass de RLS (por eso la tabla alerts no expone INSERT a ningún rol).
//
// Env (los primeros dos existen por defecto en edge functions):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID   (secrets; ver README.md)
// ============================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const THRESHOLD_MIN = 60

// PostgREST devuelve los embeds to-one como objeto; algunos SDK los tipan como
// posible arreglo. Este helper normaliza ambos casos.
function one<T>(v: T | T[] | null | undefined): T | undefined {
  return Array.isArray(v) ? v[0] : (v ?? undefined)
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const cutoffIso = new Date(Date.now() - THRESHOLD_MIN * 60_000).toISOString()

  // (a) Entregas en el punto cuya llegada es anterior al umbral.
  const { data: overdue, error: qErr } = await supabase
    .from('deliveries')
    .select(
      'id, route_id, address, hora_llegada_punto, clients ( name ), routes ( drivers ( profiles ( name ) ) )',
    )
    .eq('estado', 'en_punto')
    .lt('hora_llegada_punto', cutoffIso)

  if (qErr) {
    return json({ error: `Query de deliveries falló: ${qErr.message}` }, 500)
  }

  const checked = overdue?.length ?? 0
  let alerted = 0
  let telegramOk = 0

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')

  for (const d of overdue ?? []) {
    // (b) Saltar si ya hay una alerta activa 'tiempo_en_punto' para esta entrega.
    const { data: existing, error: exErr } = await supabase
      .from('alerts')
      .select('id')
      .eq('delivery_id', d.id)
      .eq('tipo', 'tiempo_en_punto')
      .eq('resuelta', false)
      .maybeSingle()

    if (exErr) {
      console.error(`Chequeo de alerta existente falló (${d.id}): ${exErr.message}`)
      continue
    }
    if (existing) continue

    const minutes = Math.floor(
      (Date.now() - new Date(d.hora_llegada_punto).getTime()) / 60_000,
    )
    const driverName = one(one(d.routes)?.drivers)?.profiles?.name ?? 'Conductor'
    const clientName = one(d.clients)?.name ?? 'cliente'
    const address = d.address ?? 'dirección desconocida'
    const mensaje =
      `⏱️ El conductor ${driverName} lleva ${minutes} min en el punto de ` +
      `${clientName} (${address}). Supera el umbral de ${THRESHOLD_MIN} min.`

    // (c) Insertar la alerta. El índice único parcial evita duplicados ante
    //     ejecuciones concurrentes: si otra corrida ya insertó, se ignora.
    const { error: insErr } = await supabase.from('alerts').insert({
      delivery_id: d.id,
      route_id: d.route_id,
      tipo: 'tiempo_en_punto',
      mensaje,
    })

    if (insErr) {
      // 23505 = unique_violation → carrera con otra corrida; no es error real.
      if (insErr.code === '23505') continue
      console.error(`Insert de alerta falló (${d.id}): ${insErr.message}`)
      continue
    }
    alerted++

    // (d/e) Telegram best-effort. La alerta ya está persistida; si Telegram
    //       falla, se registra el error y se continúa.
    if (botToken && chatId) {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: mensaje }),
          },
        )
        if (res.ok) telegramOk++
        else console.error(`Telegram respondió ${res.status}: ${await res.text()}`)
      } catch (err) {
        console.error(
          `Telegram falló: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    } else {
      console.warn('TELEGRAM_BOT_TOKEN/CHAT_ID no configurados; se omite el envío.')
    }
  }

  return json({ checked, alerted, telegram_ok: telegramOk })
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
