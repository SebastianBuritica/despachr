# Despachr — Current Status (2026-08-31)

**Live:** https://despachr.vercel.app · **Repo:** github.com/SebastianBuritica/despachr · **Supabase:** `mxgfkwwdhnoumboftjal`

**One line:** el producto **cambió de forma** — dejó de ser "PWA de gestión logística" (paneles que
la gente opera) y pasa a ser **back-office agéntico** (trabajo que se hace solo). El primer agente
está construido y corriendo local; falta commit, saldo de API y conectarlo a datos reales.

> Doc map: `AGENTS.md` referencia durable + **la tesis y la regla del núcleo** (auto-cargado) ·
> **este archivo** = estado + siguientes pasos · `CHANGELOG.md` historia ·
> `SUPABASE-PENDIENTE.md` runbook de infra · `PREGUNTAS-CLIENTE.md` preguntas abiertas.

---

## Lo que cambió esta sesión (y por qué)

La reunión con la dueña del 2026-08-24 (notas en Notion, transcritas) reordenó el producto. Tres
hallazgos que no estaban en ningún documento del repo:

1. **El dolor #1 no era lo construido.** No es la app del conductor ni el mapa: es **Girle**,
   llenando a mano el Excel que manda el cliente, persiguiendo cumplidos que llegan **15–20 días
   tarde**, con un cuaderno físico de respaldo, y filtrando a mano para sacar el % de la reunión de
   los viernes. Ese puesto existe en toda transportadora del país.
2. **La fecha comprometida sí existe** — viene en el Excel del cliente, por factura. Era el dato que
   `STATUS.md` daba por imposible y que bloqueaba el "% a tiempo". Una columna (`008`).
3. **El RNDC ya lo resuelve SISTRAN** para este cliente. La cuña regulatoria es real para el mercado,
   pero **no es el camino de entrada al piloto**. No construir RNDC.

---

## ✅ Hecho

**Fase 3.1 — informe de cumplimiento (el agente 2).**
- Migración `008` (`deliveries.fecha_programada`) corrida en producción.
- Semilla de una semana real de Casablanca (35 entregas, 3 novedades, 2 fuera de fecha).
- `lib/cumplimiento.ts` — la aritmética, con 4 tests. **Los números los calcula código, nunca el
  modelo**: este informe se le entrega a un cliente que paga.
- `app/api/informe/route.ts` — el agente redactor (`claude-opus-5`, salida estructurada). Verifica
  sesión y rol propios porque **el matcher del middleware excluye `/api`** a propósito.
- `app/admin/page.tsx` — el informe, ahora la única pantalla del admin.
- Verificado contra la base: **85.7% cumplimiento · 91.4% efectividad**. Cuadra exacto.

**Limpieza (−425 líneas netas).** Borradas las tres pantallas mock del admin (Métricas, Clientes,
Facturación), sus cuatro componentes exclusivos, `lib/mock/` entero y `demo-data-notice.tsx`. **No
queda un solo dato inventado en la UI.** No eran deuda a completar: eran vistas para mirar, y ninguna
le quitaba trabajo a nadie.

`build` + `lint` + 54 tests en verde.

---

## ⬜ Cola inmediata

1. **Commit.** Todo está suelto en `main`. Va en rama `feat/informe-cumplimiento`.
   ⚠️ **No usar `git add -A`**: hay sin trackear `SECURITY-AUDIT-2026-08-15.md` (que por decisión
   propia **no entra al repo público** — tiene pasos de explotación), `docs/` y cinco
   `.claude/skills/`.
2. **Saldo de API.** La consola está en $0.00 y el pago falla con "no podemos autenticar" con **dos**
   tarjetas distintas → probable bloqueo de extensiones sobre el iframe de 3D Secure. Probar en
   incógnito. Sin saldo, las cifras salen igual; sólo falta la redacción.
3. **Rotación hecha:** una `sk-ant-…` se filtró al chat el 2026-08-30 y fue revocada. La nueva caduca
   el 31 dic 2026.

---

## 🚧 Gaps honestos

- **Los datos reales no entran.** Hoy viven en SISTRAN, el Excel del cliente y fotos de WhatsApp. El
  informe corre sobre **semilla**. Al mostrarlo hay que decirlo: es la *forma* del entregable, no la
  semana real.
- **El agente de cumplido no existe.** Es el que de verdad le quita el trabajo a Girle. Sin él,
  alguien sigue tecleando.
- **Sin gráficas.** La dueña pidió *"con dashboards, con gráficas"*. Hoy son cifras y una tabla.
- **Girle no tiene rol.** No es admin (no debe ver rentabilidad), ni coordinadora, ni conductora. La
  persona que más va a usar el informe no tiene por dónde entrar.
- **Falta "qué carro entregó"** en la tabla. El cliente lo pide y el dato está (`routes.driver_id`).
- **Single-tenant.** Cero `company_id`, 27 policies por rol. Bloquea al cliente #2 — el activo que
  más pesa para YC.
- Landing desalineada: sigue vendiendo "PWA de gestión logística". Cambiarla **cuando** el agente de
  cumplido exista, no antes: escribir la promesa primero es prometer lo que no se cumple.
- Contraste verificado por aritmética, no por `axe`. `npm run qa` sigue sin correrse de verdad.

---

## ▶️ Siguiente trabajo de ingeniería

1. **Fase 3.2 — agente de cumplido, en COPILOTO.** Lee la foto de la factura firmada → propone los
   campos → un humano confirma con un toque. La **tasa de confirmación sin corrección** decide
   cuándo se quita el humano.
2. **Fase 3.3 — multi-tenant.** Prerequisito del cliente #2 (y del primero fuera de Colombia: son la
   misma migración). Su costo sólo sube con datos reales encima.
3. Post: agentes de despacho (Isaac) y facturación (Yuli). **Nunca** el de Osmelia.

---

## Pendientes del dueño (de la reunión)

- Sesión con **Yuli** (lun/mié/vie 2–5pm) e **Isaac** (jue/vie) para ver SISTRAN por dentro. Es cloud.
- Segunda reunión para alcance de bodega (fase 2 / WMS). **No adelantarla.**
- Costo de tokens: **contestado** — ~$0.04 por informe; ~$1.60/mes con 10 clientes semanales.
  Envolver la IA en la app sale mucho más barato que dos suscripciones de $20.

---

## Notas

- Migraciones: SQL hand-run y trackeado en `scripts/migrations/` (`001`–`008`).
- Rol nuevo se promueve por `app_metadata`, nunca `user_metadata` (ver `007`).
- **Nunca dejar que una credencial llegue al chat.** Ha pasado tres veces. El vector nuevo
  (2026-08-30): copiar el bloque `curl` de ejemplo que la consola de Anthropic muestra con la key
  incrustada.
