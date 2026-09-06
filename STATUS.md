# Despachr — Current Status (2026-09-05)

**Live:** https://despachr.vercel.app · **Repo:** github.com/SebastianBuritica/despachr · **Supabase:** `mxgfkwwdhnoumboftjal`

**One line:** los 2 primeros agentes (informe, cumplido) están construidos y verificados con datos
reales de la operación; **5 commits siguen sin subir a `main`**; el pago en la consola de Anthropic
lleva días trabado y hay un respaldo con Gemini mientras se resuelve; falta el Excel real de David
para cerrar el ciclo completo.

> Doc map: `AGENTS.md` referencia durable — **la tesis, la regla del núcleo, y ahora `lib/ia/`**
> (auto-cargado) · **este archivo** = estado + siguientes pasos · `CHANGELOG.md` historia completa ·
> `PREGUNTAS-CLIENTE.md` preguntas abiertas.

---

## ✅ Hecho, verificado con datos reales

**Fase 3.1 — informe de cumplimiento.** Migración `008` en prod. `lib/cumplimiento.ts` calcula, el
agente sólo redacta. Verificado contra la base: 85.7% cumplimiento, 91.4% efectividad, cuadrando
exacto.

**Fase 3.2 (parcial) — agente de cumplido.** Con un PDF real de CamScanner (23 facturas selladas a
mano, ver `docs/`) se diseñó de verdad, no se adivinó: número de factura impreso (certeza alta),
fecha real de entrega manuscrita en un sello que cambia de posición y nitidez por punto (por eso es
copiloto, no autopiloto). `lib/cumplidos.ts` parte el PDF en el navegador sin librería — verificado
23/23 páginas contra el archivo real.

**Exportar a Casablanca.** Dos fotos del archivo real que la operación llena a mano cambiaron el
objetivo: el entregable es el Excel del cliente, ya lleno, no un informe propio. Reveló ESTATUS vs
CUMPLIDO (¿llegó? vs ¿volvió el papel firmado?) y la reprogramación (2DA FECHA, migración `010` — el
cumplimiento se mide SIEMPRE contra la fecha original, nunca la reprogramada, por indicación directa
de la dueña). El adaptador vive fuera del núcleo (`lib/exportadores/casablanca.ts`). Verificado con
round-trip real: se escribe el `.xlsx`, se relee, título/encabezados/filas calzan.

**Respaldo de proveedor de IA.** El pago en la consola de Anthropic lleva **varios días** trabado:
"no podemos autenticar" con dos tarjetas de bancos distintos, mismo error → apunta a 3D Secure, no a
fondos. `lib/ia/informe.ts` y `lib/ia/cumplido.ts` centralizan: con `ANTHROPIC_API_KEY` usan Claude;
sin ella, con `GEMINI_API_KEY` (tier gratis real de Google AI Studio, sin tarjeta), usan Gemini. El
día que vuelva la llave de Anthropic, Claude se prefiere solo, cero cambios de código.

**Migraciones `009` y `010` corridas en producción** con el CLI de Supabase (`supabase db query
--linked -f archivo.sql`) — ya logueado y linkeado, cero fricción de navegador. Ese es ahora el
camino para toda migración futura; no volver a montar un prompt para Claude Chrome.

`build` + `lint` + **73 tests** en verde.

---

## ⬜ Cola inmediata

1. **Push + PR.** 5 commits en `feat/informe-cumplimiento` (`9329395`…`54ea8b1`), ninguno subido.
2. **Decidir `docs/reunion-2026-08-24.md`.** Sigue sin commitear — trae márgenes (22%) y nombres del
   equipo; el repo es público. Recomendación: fuera del repo, sólo como contexto del proyecto de
   Claude. Alternativa: `.gitignore`. Sigue pendiente de que Sebastian decida.
3. **Crear el usuario de Girle** como `coordinador` en el dashboard de Supabase — 2 minutos, cero
   código. Sin esto, la persona que más usaría `/dashboard/cumplidos` no tiene por dónde entrar.
4. **Resolver el pago de Anthropic** (o seguir en Gemini): llamar al banco por 3D Secure en compras
   internacionales, probar en incógnito, o usar la tarjeta de alguien más en la misma cuenta.
5. **El Excel real de David** (no sólo las fotos) — para verificar encabezados al 100% antes de
   construir el importador. Sin él, el ciclo completo (Excel → entregas → fotos → Excel lleno) no
   cierra.

---

## 🚧 Gaps honestos

- **Cero facturas reales cargadas.** `numero_factura` funciona y está probado, pero sólo contra la
  semilla sintética (`CB-0824-01`); las reales del PDF (`FEV76883`...) no están en la base, así que
  `/dashboard/cumplidos` va a marcar "sin emparejar" hasta que entre el Excel real.
- **La calidad de Gemini en la tarea difícil no está medida.** Sirve para probar la app de punta a
  punta; no reemplaza medir con Opus 5 antes de confiar el % de aciertos del copiloto.
- **`SignaturePad` sigue sin confirmar con Isaac** si se puede borrar (evidencia duplicada — ver
  AGENTS.md, la restricción del conductor).
- Sin gráficas en el informe — la dueña las pidió explícitamente. Es trabajo del agente de diseño.
- `npm run qa` no se ha corrido desde que se borraron 3 pantallas mock y se agregaron 2 rutas nuevas.
- Landing sigue vendiendo "PWA de gestión logística" — se corrige cuando el agente 1 esté cerrando
  entregas de verdad, no antes.
- Contraste verificado por aritmética, no por `axe`.

---

## ▶️ Siguiente trabajo de ingeniería

1. **Cerrar Fase 3.2** — que el agente de cumplido escriba, no sólo proponga: cablear a
   `confirmarCumplido`/`reportarNovedad` una vez medida la tasa de confirmación sin corrección sobre
   datos reales.
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
  excepción en `.gitignore` — corregido 2026-09-05, ahora sí se commitea.
