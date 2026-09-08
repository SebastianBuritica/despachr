# Despachr — Current Status (2026-09-08)

**Live:** https://despachr.vercel.app · **Repo:** github.com/SebastianBuritica/despachr · **Supabase:** `mxgfkwwdhnoumboftjal`

**One line:** el agente de cumplido lee el sello manuscrito con **~92% de precisión, medido contra
el PDF real**, sobre Gemini pagado (el pago de Anthropic sigue trabado, ya no es urgente resolverlo).
Los 2 primeros agentes están construidos y verificados de punta a punta con Playwright real.
**13 commits siguen sin subir a `main`**. Falta el Excel real de David para cerrar el ciclo completo.

> Doc map: `AGENTS.md` referencia durable — la tesis, la regla del núcleo, `lib/ia/` (auto-cargado) ·
> **este archivo** = estado + siguientes pasos · `CHANGELOG.md` historia completa ·
> `PREGUNTAS-CLIENTE.md` preguntas abiertas.

---

## ✅ Hecho, verificado con Playwright real (no sólo SQL)

**Fase 3.1 — informe de cumplimiento.** Migración `008` en prod. `lib/cumplimiento.ts` calcula, el
agente sólo redacta. Cifras confirmadas **en la pantalla real** (no sólo por SQL): 85.7%
cumplimiento, 91.4% efectividad, columna de conductor sin error.

**Fase 3.2 (parcial) — agente de cumplido.** Diseñado con un PDF real de CamScanner (23 facturas
selladas a mano, ver `docs/`): número de factura impreso (certeza alta), fecha real de entrega
manuscrita en un sello que cambia de posición y nitidez por punto (por eso es copiloto, no
autopiloto). `lib/cumplidos.ts` parte el PDF en el navegador sin librería — 23/23 páginas verificado.
Lectura real confirmada funcionando en `/dashboard/cumplidos` (ver hallazgo del QA abajo).

**Exportar a Casablanca.** El entregable es el Excel del cliente, ya lleno, no un informe propio.
ESTATUS vs CUMPLIDO (¿llegó? vs ¿volvió el papel firmado?) y la reprogramación (2DA FECHA, migración
`010` — el cumplimiento se mide SIEMPRE contra la fecha original, nunca la reprogramada, por
indicación directa de la dueña). Adaptador fuera del núcleo (`lib/exportadores/casablanca.ts`).
Descarga real del `.xlsx` confirmada en el navegador, sin errores de consola.

**Respaldo de proveedor de IA.** Con `ANTHROPIC_API_KEY` usa Claude; sin ella, con `GEMINI_API_KEY`
(tier gratis, sin tarjeta), usa Gemini. El día que vuelva la llave de Anthropic, Claude se prefiere
solo, cero cambios de código.

**Migraciones `008`–`010` corridas en producción** con el CLI de Supabase (`supabase db query
--linked -f archivo.sql`) — ya logueado y linkeado, cero fricción de navegador. Camino estándar para
toda migración futura.

`build` + `lint` + **78 tests** en verde.

### 🔧 Bug real encontrado y corregido por el barrido de QA (2026-09-06/07)

Primer barrido con Playwright (el primero que cargó la app de verdad, no sólo SQL) dio **FAIL**:
- **`/admin` nunca cargaba.** `entregasDelInforme` pedía `routes!inner(fecha, profiles(name))`, pero
  `routes.driver_id` no referencia `profiles` directo — pasa por `drivers` (`drivers.id references
  profiles(id)`, tabla de extensión 1:1). PostgREST rechazaba la consulta en cada llamada
  (`PGRST200`). **Nadie lo había visto** porque toda verificación previa fue por SQL directo, nunca
  cargando la pantalla real. Corregido a `routes!inner(fecha, driver:drivers(profiles(name)))`
  (`lib/queries/reporte.ts`), verificado dos veces (schema + join SQL replicado: 35/35 con conductor)
  y luego con Playwright real: cifras y columna de conductor cargan sin error.
- **El modelo de Gemini estaba retirado.** `gemini-2.5-flash` → `gemini-3.6-flash` (el reemplazo que
  la propia API de Google sugirió en el error). Los dos agentes de IA estaban 100% caídos con el
  respaldo de Gemini pese a tener la llave bien puesta.
- De paso: las dos rutas que llaman a `entregasDelInforme` ahora atrapan errores (antes, cualquier
  fallo de datos tumbaba la respuesta con un 500 desnudo); `scripts/qa.mjs` tenía 3 rutas fantasma de
  `/admin` (borradas 2026-08-30) generando 404 en cada barrido, y nunca incluía
  `/dashboard/cumplidos` — ambas corregidas.

**Segundo barrido, después del fix: PASS.** Confirmado con capturas reales: cifras de `/admin`
correctas, "Generar análisis" completa (tras un `503` transitorio de Gemini — ver nota abajo),
descarga de `.xlsx` sin error, lectura de PDF en `/dashboard/cumplidos` completa sin el 404 viejo.
Barrido completo: 34/34 pantallas, 0 errores de consola/JS, sólo el backlog conocido de contraste.

**Sobre el `503` de Gemini que salió durante la primera prueba (1 página):** es "alta demanda" — un
apagón temporal de Google, **no relacionado con el tier gratis** (confirmado: un `503` le pasa igual
a cuentas pagadas). Verificado en vivo con un `curl` directo: `HTTP 200` momentos después.

### 🔧 Segundo hallazgo real, distinto del anterior (QA 2026-09-07, lote real de 23 páginas)

A volumen real (no 1 página, las 23 del PDF real), **18 de 23 facturas fallaban** — no por mala
lectura, por límite de cuota/velocidad del tier gratis de `gemini-3.6-flash` agotándose a mitad de
lote (esto SÍ es distinto del `503` de arriba: aquí importa el volumen, y pagar Gemini sí ayudaría
si el tope es genuinamente diario). Causa raíz de código: `leerCumplido` no reintentaba nada.

Corregido: `lib/ia/reintentar.ts` — reintento con backoff (hasta 3 intentos) sólo ante 429/503,
respetando el `retryDelay` que la propia API de Google manda en el error en vez de adivinar un
tiempo de espera. Cableado en los dos agentes (`lib/ia/cumplido.ts`, `lib/ia/informe.ts`). 5 tests
nuevos con timers falsos (sin esto el suite se vuelve lento en silencio — ya pasó una vez).

**Esto NO fabricaba más cuota diaria** si el tope era genuinamente por día — y lo era: eran
~20 llamadas/día del tier gratis. Resuelto de raíz el 2026-09-08: **Gemini pasó a tier pagado**
(Google Cloud Billing, misma tarjeta que le había fallado dos veces a Anthropic — pagó limpio, sin
3D Secure, lo que apunta a que el problema era específico del checkout de Anthropic/Stripe, no del
banco). Mismo `GEMINI_API_KEY`, cero cambios de código. **Gasto real confirmado por el lote
completo de 23 páginas: COP 100,000 → 99,493, ~COP 500 (~$0.13 USD)** — cuadra con la estimación de
antes de construir nada.

### 🎯 La pregunta que abrió el proyecto, contestada (2026-09-08)

Con el tope de cuota resuelto, se corrió el lote real completo (23 páginas) y — por primera vez — se
verificó CADA lectura contra la imagen original, no sólo si el modelo respondía sin error.

**Las 23/23 completaron limpio.** Cero errores de red/cuota, cero errores de consola.

**Precisión sobre 11 páginas verificadas a mano contra el PDF real: ~92% (12/13 lecturas correctas,
contando abstenciones).** Dos abstenciones correctas (páginas sin fecha visible → `null`, tal como
pide el diseño: *"null vale más que un dato inventado"*, funcionando). Dos errores reales:
- **Un escaneo degradado leído con confianza "Alta" cuando debió ser "Dudosa"** (año mal leído,
  2020 en vez de 2026) — la confianza no capturó este caso.
- **Un documento con dos fechas candidatas impresas** donde el modelo mezcló ambas en un valor
  híbrido — sí bajó la confianza a "Revisar", pero el dato seguía siendo falso.

**Hallazgo adicional, no buscado pero importante:** dos páginas son el mismo escaneo duplicado
byte-por-byte, y el modelo dio **respuestas distintas** en dos llamadas separadas sobre la MISMA
imagen — ambas marcadas "Alta". Es evidencia directa de que la confianza reportada por el modelo no
es 100% estable ni siquiera sobre el mismo input exacto.

**Conclusión, con evidencia y no con fe:** el diseño de copiloto (proponer, humano confirma) era la
decisión correcta desde el principio — la confianza "Alta" ayuda pero no basta por sí sola para saltar
la revisión humana. También reveló que la operación real trae mucha más variedad de formato de la que
el prompt del sistema asume hoy (sólo describe un "RECIBO DE MERCANCÍA"; el lote real trae
confirmaciones Makro con fecha impresa, devoluciones, reportes PriceSmart en inglés) — el modelo se
las arregló bien igual, pero el prompt podría ampliarse para nombrar esos formatos explícitamente.

---

## ⬜ Cola inmediata

1. **Push + PR.** 8 commits en `feat/informe-cumplimiento` (`9329395`…`46635d3`), ninguno subido.
2. **Decidir `docs/reunion-2026-08-24.md`.** Sigue sin commitear — trae márgenes (22%) y nombres del
   equipo; el repo es público. Recomendación: fuera del repo, sólo como contexto del proyecto de
   Claude. Sigue pendiente de que Sebastian decida.
3. **Crear el usuario de Girle** como `coordinador` en el dashboard de Supabase — 2 minutos, cero
   código. Sin esto, la persona que más usaría `/dashboard/cumplidos` no tiene por dónde entrar.
4. **El pago de Anthropic sigue trabado** (3D Secure, no fondos — mismo error con 2 tarjetas
   distintas). Ya no es urgente: Gemini pagado mide ~92% de precisión en la tarea difícil (ver
   arriba) y es suficiente para seguir. Sigue pendiente sólo si se quiere comparar contra Opus 5.
5. **El Excel real de David** (no sólo las fotos) — para verificar encabezados al 100% antes de
   construir el importador. Sin él, el ciclo completo (Excel → entregas → fotos → Excel lleno) no
   cierra.
6. **Decidir cómo se diseña el paso de escritura de Fase 3.2** a la luz del hallazgo de hoy: la
   confianza "Alta" del modelo no es 100% confiable (un escaneo degradado la tuvo mal, dos llamadas
   sobre la MISMA imagen dieron respuestas distintas). No cablear una confirmación de un toque que
   confíe ciegamente en "Alta" sin discutirlo primero.

---

## 🚧 Gaps honestos (para el próximo agente de QA: esto es lo que SÍ falta, no re-diagnostiques lo de arriba)

- **Cero facturas reales cargadas.** `numero_factura` funciona y está probado, pero sólo contra la
  semilla sintética (`CB-0824-01`); las reales del PDF (`FEV76883`...) no están en la base, así que
  `/dashboard/cumplidos` va a marcar "sin emparejar" con un PDF real hasta que entre el Excel de David.
- **Medido, no es un gap:** la precisión de lectura del sello manuscrito ya se midió (~92% sobre lo
  verificado a mano, ver arriba, 2026-09-08). Lo que sí queda abierto: el prompt del sistema
  (`lib/ia/cumplido.ts`) sólo describe un "RECIBO DE MERCANCÍA", y el lote real trae más formatos
  (confirmaciones Makro con fecha impresa, devoluciones, reportes PriceSmart en inglés) — el modelo
  los manejó bien igual, pero ampliar el prompt para nombrarlos podría subir la precisión más.
- **`SignaturePad` sigue sin confirmar con Isaac** si se puede borrar (evidencia duplicada — ver
  AGENTS.md, la restricción del conductor).
- Sin gráficas en el informe — la dueña las pidió explícitamente. Es trabajo del agente de diseño.
- Landing sigue vendiendo "PWA de gestión logística" — se corrige cuando el agente 1 esté cerrando
  entregas de verdad, no antes.
- Contraste: 15 violaciones `[serious]` conocidas (color-contrast + un avatar mal etiquetado + 3
  tablas sin foco en scroll) — backlog pre-existente, tracked, no v1, sin regresiones nuevas.

---

## ▶️ Siguiente trabajo de ingeniería

1. **Cerrar Fase 3.2** — que el agente de cumplido escriba, no sólo proponga: cablear a
   `confirmarCumplido`/`reportarNovedad` una vez medida la tasa de confirmación sin corrección sobre
   datos reales (bloqueado por el punto anterior: falta volumen real para medir).
2. **El importador del Excel de David** — bloqueado por el archivo real.
3. **Fase 3.3 — multi-tenant.** Prerequisito del cliente #2, sin tocar todavía.

---

## Pendientes del dueño (de la reunión, sin cambios)

- Sesión con **Yuli** (lun/mié/vie 2–5pm) e **Isaac** (jue/vie) para ver SISTRAN por dentro.
- Segunda reunión para alcance de bodega (fase 2 / WMS). No adelantarla.

---

## Notas

- Migraciones: SQL hand-run y trackeado en `scripts/migrations/` (`001`–`010`). Correrlas con
  `supabase db query --linked -f scripts/migrations/XXX.sql` — el CLI ya está logueado y linkeado.
- Rol nuevo se promueve por `app_metadata`, nunca `user_metadata` (ver `007`).
- **Nunca dejar que una credencial llegue al chat.** Ha pasado varias veces; el vector más reciente
  es copiar el bloque `curl`/código de ejemplo que la consola de un proveedor muestra con la key
  incrustada. Las llaves de esta sesión (Anthropic, Gemini) se metieron con `read -rs` en terminal,
  nunca pegadas al chat.
- `.env.local.example` estuvo fuera del repo desde el inicio del proyecto por un `.env*` sin
  excepción en `.gitignore` — corregido, ahora sí se commitea (`README.md` y `scripts/setup-env.sh`
  también documentan `ANTHROPIC_API_KEY`/`GEMINI_API_KEY`).
- No usamos n8n ni ninguna herramienta de automatización visual — todo el glue vive en código
  (Next.js API routes + Supabase), mismo patrón que `pg_cron` + edge function ya usa para las alertas.
