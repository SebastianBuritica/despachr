# Despachr — Changelog

Append-only history of completed work. **This file is NOT auto-loaded into agent context** —
it exists so the "why" of past changes is recoverable on demand. To know the *current* state and
what to do next, read [STATUS.md](STATUS.md); for durable product/stack/conventions, [AGENTS.md](AGENTS.md).

> Convention: newest first. When you finish a unit of work, add a short paragraph here and
> overwrite STATUS.md — do **not** grow a status log inside AGENTS.md.

---

## PR ledger

| PR | Work |
|----|------|
| #21 | docs: sync agent context to end-of-session state |
| #20 | Segment 5 — assets cleanup + docs sync |
| #19 | Segment 4 — driver phone OTP login |
| #18 | Segment 3 — `alerts` table + 60-min edge function |
| #17 | Segment 2 — storage bucket + `lib/storage.ts` helpers |
| #16 | Segment 1 — mock state vocabulary aligned to schema |
| #15 | Bug-fix pass — 5 real bugs |

---

## Fase 3.2 — el agente de cumplido cierra la entrega (no sólo propone)

- **`feat/informe-cumplimiento`:** `/dashboard/cumplidos` ganó un botón "Confirmar" por fila — la
  lectura del sello sigue siendo copiloto (nunca se auto-cierra, ni con confianza "Alta"; el hallazgo
  del 2026-09-08 de que la confianza no es 100% estable sigue vigente), pero ahora la confirmación
  humana efectivamente cierra la entrega. El plan original en el código decía "cablear a
  `confirmarCumplido`/`reportarNovedad`" (las funciones del conductor) — trazar el camino completo
  mostró que eso habría fallado, no sólo estado mal diseñado: esas funciones insertan un
  `delivery_event` con `driver_id = auth.uid()`, y quien confirma el lote (Girle) no tiene fila en
  `drivers`, así que el insert habría violado la FK. Y aunque no la violara, habría grabado el GPS y
  la hora de HOY en la oficina como si fuera la entrega real, de hace días. Se escribieron dos
  funciones nuevas en `lib/queries/coordinator.ts` (`cerrarCumplidoDesdeExtraccion`,
  `cerrarNovedadDesdeExtraccion`) que llaman directo a los primitivos ya probados
  (`marcarEntregada`-equivalente, `crearNovedad`+`marcarConNovedad`) sin pasar por el evento de GPS.
  Esto reveló un segundo problema real: `lib/cumplimiento.ts` deriva "a tiempo" de
  `hora_salida_punto`, que normalmente sólo pone el trigger del evento de salida — sin ese evento, la
  columna se habría quedado `null` para siempre y la entrega habría desaparecido del informe **en
  silencio**. Se corrigió escribiendo `hora_salida_punto` directo desde la fecha (+ hora opcional)
  manuscrita que extrajo el modelo — es, de hecho, un dato más fiel que un evento GPS de la oficina
  días después. Tercer hallazgo: la policy de storage `cumplidos_driver_insert` sólo dejaba subir al
  conductor dueño de la ruta; coordinador/admin sólo tenían SELECT. Migración `011` agrega
  `cumplidos_coord_insert` (espeja `cumplidos_read`, mismo bucket, mismos roles), ya corrida en
  producción. 3 tests nuevos para `horaSalidaDesdeExtraccion` (la conversión de zona horaria: un
  error ahí correría el cumplimiento un día sin que nadie lo note hasta comparar contra el papel).

---

## Segmento F — contraste, tablas en móvil y barra de estado

- **`chore/a11y-polish`:** los 30 avisos `color-contrast` del audit no eran 30 problemas sino **tres tokens** usados en muchos sitios, así que se arreglaron en la raíz en vez de parchear pantallas. Se calcularon los ratios reales antes de tocar nada, y ese cálculo cambió el arreglo obvio: **(1)** `text-brand` como TEXTO daba **2.86:1** sobre superficie oscura. La tentación era aclarar `--brand`, pero blanco sobre `#1D9E75` sólo da **3.39:1** y eso habría roto todos los FONDOS de marca (avatares, barras de progreso, el check del cumplido). Se separaron los usos: `--brand` sigue siendo color de fondo (blanco encima = 6.20:1) y el nuevo **`--brand-ink`** es el verde de texto, que sí se aclara en oscuro (5.23:1). Migrados los 14 sitios que lo usaban como texto; de paso desaparece el parche manual `text-brand dark:text-white` que se repetía en 7 archivos. **(2)** `--faint` daba **2.56:1** sobre blanco. Sólo `#71717a` pasa, que es exactamente `--muted-foreground` — sobre fondo blanco **no hay margen** entre "legible" y "más tenue", y se documentó así para que nadie lo vuelva a aclarar. En oscuro quedó `#85858e` (antes 3.67:1). **(3)** Landing: la atribución del mapa en `white/40` (3.74:1) y un gris del mockup en 2.56:1. **Todos los pares verificados ≥4.5:1 por cálculo** (script de ratios WCAG, no a ojo). **Tablas en móvil:** el diagnóstico del audit era "clipean", pero el contenedor ya tenía `overflow-x-auto` — el problema real es que `<table class="w-full">` se **encoge** para caber, así que nunca desborda y las columnas se apelmazan; con `min-w-*` ahora desbordan y se deslizan. **Barra de estado:** `theme_color` es un valor único en el manifiesto, así que no puede seguir al tema; se dejó alineado a `--background` oscuro y el color por tema se resuelve con `viewport.themeColor` y media queries en el layout, que es lo que el navegador sí honra.

---

## Fase 2.2 — mapa real y alertas conectadas

- **`feat/coordinador-mapa-alertas`:** el placeholder del mapa (que dibujaba rutas SVG y pines con nombres inventados) se reemplaza por **MapLibre GL con tiles de CARTO**. MapLibre y no Mapbox por la misma razón que la landing ya usaba CARTO: **sin token y sin cuenta de facturación**, una dependencia menos que administrar para un piloto que no paga nada. El estilo sigue el tema de la app (`dark_all` / `light_all`). Dibuja dos cosas, ambas reales: las **entregas** por `deliveries.latitude/longitude`, con color por estado y popup con cliente, dirección y número de punto; y la **última posición conocida de cada ruta**. Esto último merece explicación: **el schema no guarda tracking continuo** del vehículo, no hay tabla de posiciones. Lo que sí existe son las coordenadas de los EVENTOS del conductor (llegada, salida, novedad) que captura `lib/geo.ts`. La última de esas es el mejor "dónde va" disponible y es un dato real, no una interpolación — por eso el popup **muestra la hora del reporte**: una posición de hace tres horas no es "ahora", y presentarla como si lo fuera sería el mismo tipo de mentira que la ETA inventada que se quitó en 2.1. Si no hay una sola coordenada (entregas sembradas sin lat/lon, o GPS denegado), **no se pinta un mapa vacío que parezca roto**: se explica por qué está vacío. **Alertas conectadas** a la tabla `alerts`: se listan las activas con conductor, ciudad y hora, y se pueden **resolver** dejando constancia de `resuelta_por` y `resuelta_at` — una alerta que desaparece sin dueño no sirve para revisar después qué pasó ese día. No hay función de "crear alerta" a propósito: las inserta la edge function con service role, y la RLS del coordinador (migración 002) sólo le da SELECT y UPDATE. Mientras la edge function siga sin desplegar la lista sale vacía, que **es la verdad, no un error** — y el estado vacío lo dice como buena noticia ("Nada que atender ahora mismo"), no como pantalla triste. Con esto `lib/mock/coordinator.ts` **se elimina**: el coordinador ya no tiene una sola línea de dato falso.

---

## Fase 2.1 — el coordinador sobre datos reales

- **`feat/coordinador-datos-reales`:** las 4 pantallas del coordinador (operación en vivo, rutas, conductores, clientes) pasan de `lib/mock/coordinator.ts` a Supabase, con **Realtime** sobre `routes`/`deliveries`/`delivery_events` — si una entrega cambia y el coordinador no lo ve, termina preguntando por WhatsApp, que es el hábito que este producto elimina. **Camino propio, no el del conductor:** `entregas_de_ruta` filtra por `driver_id = auth.uid()`, así que para el coordinador devolvería vacío siempre; tampoco hace falta RPC porque su RLS ya concede SELECT directo sobre routes, deliveries, drivers, profiles y clients (lo único que no ve son las tablas financieras, que están aparte justo por eso). **Lo importante fue qué NO existe en el schema.** El mock inventaba campos que no tienen respaldo, y en vez de fabricarlos: `routes` no tiene *nombre* ni *zona* → se muestran las **ciudades de sus puntos**; **no hay ETA en ninguna parte** y estimarla sería justo el dato falso que este proyecto viene quitando (la optimización de rutas es post-v1) → la columna ETA se reemplazó por la **hora de cierre real** (`hora_fin`); `DriverCard` mostraba *cumplimiento* y *rating* — el rating era invención pura y el cumplimiento exige una hora objetivo por entrega que no se guarda → se cambiaron por **avance de hoy, tiempo promedio en punto y novedades**, las tres derivables de verdad; la tabla de clientes mostraba *entregas/mes*, *on-time* y *próxima entrega* → se dejaron **rutas y entregas de hoy**, que sí son ciertas. **`retrasada`** se deriva de una entrega parada >60 min en el punto, **el mismo umbral que usa la edge function de alertas**: si difirieran, el tablero y las alertas se contradirían. Quedan mock **las alertas y el mapa**, y por eso NO llevan aviso de página completa (el resto de la pantalla ya es real, sería mentir en la otra dirección) sino un `<DemoTag/>` compacto en la pieza misma — el mapa además muestra nombres y placas inventados. `lib/mock/coordinator.ts` se reduce a las alertas; `lib/estados.ts` y `lib/fecha.ts` recogen lo que era presentación y fechas compartidas.

---

## Fase 1.3 — novedades (el otro final de una entrega)

- **`feat/driver-novedades`:** la tabla `issues` existía desde el schema base pero no había forma de escribir en ella; una entrega sólo podía terminar bien. **Decisión de negocio del dueño: una novedad CIERRA la entrega** — no es un estado intermedio del que se sale reintentando, el conductor reporta y sigue su ruta. Encaja con lo que el schema ya decía: `check_route_completion` cuenta `novedad` entre los estados cerrados, así que una ruta puede completarse con novedades dentro, y resolverlas es trabajo del coordinador. La UI ofrece los **6 tipos del CHECK de `issues`** (rechazo, faltante, dañado, cliente ausente, dirección errada, otro) con una línea de ayuda cada uno, **descripción obligatoria** (es lo único que el coordinador lee para decidir qué hacer: un tipo sin texto no le sirve) y **foto opcional** como evidencia del daño o el faltante, al mismo bucket y bajo la misma RLS que el cumplido (`{routeId}/{deliveryId}/novedad.jpg`, que es lo que la política parsea). `lib/novedad.ts` es hermana de `lib/cumplido.ts` y por las mismas razones: dependencias inyectadas para poder probar el orden, progreso mutable para reanudar, y **el cambio de estado SIEMPRE de último** — cerrar antes dejaría una entrega marcada con novedad sin novedad que la explique, y el coordinador sin nada que resolver. Es **encolable offline** con la foto como Blob, igual que el cumplido, con id de cliente para que reenviar no la duplique. La pantalla avisa en amarillo que reportar **cierra la entrega** antes de enviar, porque es irreversible desde la app del conductor. 8 pruebas nuevas (41 en total). Se agregó `components/ui/textarea.tsx` (faltaba el primitivo).

---

## Fase 1.4 — el conductor trabaja sin señal

- **`feat/driver-offline-queue` + `feat/driver-service-worker`:** tres piezas, porque "offline" no es una sola cosa. **(1) Cola en IndexedDB.** Dos hechos del schema la condicionaron, ambos resueltos sin migración porque el cliente puede aportarlos: `delivery_events.timestamp` tiene default `now()` —o sea la hora del INSERT, así que un conductor que llega a las 10:00 sin señal y sincroniza a las 14:00 quedaría con `hora_llegada_punto = 14:00` y un `tiempo_en_punto_minutos` absurdo— y el `id` lo genera el servidor sin restricción única, así que un reenvío duplicaría el evento. Ahora los eventos llevan **id y hora de cliente**, capturados cuando el conductor actúa: el id da idempotencia (choque de PK al reenviar = ya estaba, que además cubre el caso "se mandó pero se perdió la respuesta") y la hora es la del hecho. **Contrapartida aceptada:** se confía en el reloj del dispositivo — va sincronizado por red en Android/iOS, y sin señal la hora del servidor sería con certeza la equivocada. IndexedDB y no localStorage porque hay que guardar la **foto como Blob** (una imagen en base64 revienta la cuota de 5 MB) y porque debe sobrevivir a recargar, cerrar la app o quedarse sin batería, cosas que un `File` en estado de React no sobrevive. Sin librería: son cuatro operaciones. El reenvío va **en orden de creación y corta al primer fallo** (los triggers derivan el estado de la secuencia; saltarse uno la corrompe), un cumplido encolado **reanuda** vía `lib/cumplido.ts` con su progreso guardado en vez de re-subir la foto, y sus **coords son las del momento de entregar** — al sincronizar el conductor puede estar a 50 km y una lectura nueva ubicaría la entrega donde no fue. Candado contra pasadas concurrentes (el evento `online` y el reintento de 30 s pueden coincidir). **(2) Service worker** (`public/sw.js`, ~40 líneas, sin Workbox): red primero para navegaciones con caída al shell cacheado —nunca caché primero, o un despliegue tardaría en llegarle al conductor—, caché primero para `/_next/static/**` (llevan hash, son inmutables), y **Supabase, `/api/` y cualquier otro origen jamás se cachean**. Registrado sólo bajo `/driver` y sólo en producción. **(3) Snapshot de la ruta**, que es el hueco que quedaba: el SW sirve el shell, pero las entregas vienen de Supabase, así que un arranque en frío sin señal mostraba la pantalla de error en vez de las paradas. Se guarda la última carga buena y se usa **sólo si la carga falla**, con la hora del dato visible — un conductor sin sus paradas no puede trabajar, pero uno con las de ayer creyéndolas de hoy está peor. **La UI no miente:** la pantalla de confirmación dice que el cumplido quedó guardado en el equipo y se enviará, no que llegó a coordinación, y la evidencia dice "Guardada en el equipo" en vez de "Foto ✓" (el servidor todavía no tiene la foto). **Límite conocido y documentado:** `navigator.onLine` dice si hay interfaz de red, no si hay internet — un celular pegado a una antena sin backhaul reporta `true`; por eso el envío directo se intenta siempre y la cola es el respaldo cuando de verdad falla. 6 pruebas nuevas (33 en total) sobre orden, corte, reintento, enrutamiento y el candado; contrato del SW verificado contra un servidor real.

---

## Seguridad — bypass de middleware en Next (CVE) + audit a cero

- **`fix/next-middleware-bypass`:** `npm audit` (corrido al instalar Vitest) destapó **11 vulnerabilidades, 8 high**, ninguna introducida por Vitest — todas preexistentes. La que importa: **`next@16.2.9` es vulnerable a [GHSA-6gpp-xcg3-4w24](https://github.com/advisories/GHSA-6gpp-xcg3-4w24), *Middleware / Proxy bypass in App Router applications using Turbopack and single locale*.** Esta app cumple las tres condiciones (App Router ✓, Turbopack ✓, locale único ✓) y **`middleware.ts` es toda su frontera de autorización por rol** — es el archivo que impide que un conductor abra `/admin`. El impacto real *hoy* era bajo porque admin y coordinador siguen en mock y la RLS (+ los triggers de la migración 007) protegen el dato de verdad; habría sido alto en cuanto la Fase 2 conecte datos reales. Arreglo: **Next 16.3.1**, patch y no major. De paso cerró el `postcss` que STATUS.md daba por diferido *"hasta que Next parchee su postcss embebido"* — resultó que ya lo hizo, así que la nota llevaba meses obsoleta. El resto (`undici`, `js-yaml`, `brace-expansion`, `ip-address`, `fast-uri`, `hono`, `@hono/node-server`, `sharp`) salió con `npm audit fix` **sin `--force`**. **`npm audit`: 0 vulnerabilidades.** `next` y `eslint-config-next` se re-pinearon **exactos** (sin caret) para que sigan en lockstep, como estaban. Verificado: 27 pruebas, `tsc --noEmit`, lint y build en verde con la versión nueva.

---

## Pruebas — reanudación del cumplido (Vitest)

- **`test/cumplido-resilience`:** el proyecto no tenía pruebas de lógica. `scripts/qa.mjs` (Playwright) demuestra que las 42 pantallas **renderizan**, pero no dice nada sobre el reintento del cumplido, que es la lógica más cara de equivocar: si el cierre falla a medias, el conductor cree que entregó y la operación cree que no. Y la Fase 1.4 iba a montar una cola offline justo encima de eso. **El obstáculo real era de diseño, no de herramientas:** la orquestación vivía dentro de `DriverApp` (850 líneas) enredada con `useRef` y estado de React, así que no había forma de probarla sin montar la pantalla completa. Se extrajo a **`lib/cumplido.ts`** con las dependencias inyectadas (`subirFoto`, `subirFirma`, `registrarSalida`, `marcarEntregada`, `capturarUbicacion`), conservando la semántica exacta de los refs: el objeto `CumplidoProgreso` se **muta en el sitio** para que, cuando un paso lance, quien llama conserve lo ya logrado y el reintento reanude. Beneficio doble: la Fase 1.4 necesita interceptar exactamente esas cuatro operaciones y ahora son un punto único. **27 casos** verifican el orden real (`foto → salida → entregada`, con el flip a `entregado` SIEMPRE de último), que un fallo temprano **no** marque la entrega (sigue `en_punto`, reintentable), que el reintento no re-suba la foto (choca con `upsert:false`) ni duplique el evento de salida (duplicaría el cálculo de `tiempo_en_punto` del trigger), que la firma nunca bloquee —incluido el caso `toBlob() → null`, que antes se descartaba en silencio—, y la normalización de teléfonos contra el número real de producción. Vitest en entorno node, sin jsdom ni React Testing Library: se prueba lógica, no pantallas. Config en `vitest.config.mts` (`.mts` y no `.ts` para que Vite lo cargue como ESM sin warning).

---

## Segmento G — marca de datos de demostración

- **`feat/demo-data-banner`:** las 8 pantallas que todavía leen de `lib/mock/*` (4 del coordinador + 4 del admin) muestran ahora un aviso **"Datos de demostración"**. Es la misma lógica de `<ComingSoon>` pero aplicada al **dato** en vez de al control: un CTA muerto se nota, una métrica inventada no — se lee idéntica a una real. Sin la marca, cualquiera que abra el panel (el dueño, la coordinadora, un cliente al que se le muestre la herramienta) toma decisiones sobre cifras que no existen, o reporta como bug una diferencia que no lo es. **Se pone por página, no en el layout, a propósito:** la Fase 2 conecta las vistas de a una, y así se borra sólo la línea de la pantalla que ya quedó real mientras el resto sigue marcado honestamente. Regla registrada en AGENTS.md: *una página que importe de `lib/mock/*` renderiza `<DemoDataNotice />`*; cuando ninguna lo importe, el componente se borra. Estilo consistente con el tono `warning` que ya usa `StatCard` (ámbar en claro y oscuro), con `role="note"`.

---

## Fase 1.3b — login del conductor por OTP (Segmento B)

- **`feat/driver-otp-login`:** el backend de OTP existía desde el PR #19 pero **no había pantalla**; los conductores entraban con email/password. Ahora `/login` tiene dos pestañas y **teléfono va primero**: los conductores son la mayoría de los inicios de sesión diarios y son los que entran desde la calle. Flujo: número → `signInWithOtp` → SMS → código de 6 dígitos → `verifyOtp` → su panel según rol. **`shouldCreateUser: false`** es la decisión central: iniciar sesión NUNCA crea cuentas — es la otra mitad de haber apagado el registro público en el PR #29, y hace que un número no dado de alta reciba *"pídele a tu coordinador que te dé de alta"* en vez de una cuenta fantasma. Detalles que importan en campo: `autoComplete="one-time-code"` (iOS/Android ofrecen el código del SMS sin salir de la app — con guantes y de pie en la calle, eso es el flujo entero), **reenvío con cuenta regresiva de 60 s** (cada SMS cuesta plata en Twilio y Supabase además aplica su propio rate limit: mejor un botón que dice cuánto falta que uno que falla), y "cambiar número" para volver atrás sin recargar. **`lib/phone.ts` centraliza la normalización**: el formato canónico es **sólo dígitos, sin `+`** (`573229596618`), que es como GoTrue guarda `auth.users.phone` y como quedó `profiles.phone` — si la app mandara `+57…` a un lado y `57…` al otro, los números dejarían de emparejar y el login fallaría de forma opaca. Acepta lo que la gente realmente teclea (`320 123 4567`, `+57 …`, `0057 …`, con guiones o paréntesis); verificado contra el usuario real de producción en 7 casos. De paso se arregló un bug real en `DriverApp`: el botón "Llamar" construía `tel:${delivery.telefono}` con la columna cruda, y `telefono_receptor` lo escribe el coordinador a mano, así que podía quedar sin indicativo — ambiguo para el marcador. Ahora pasa por `normalizePhone` + `toTelHref`. También se de-duplicó el post-login (leer rol → redirigir) en un `useCompleteSignIn` compartido por ambos flujos.

---

## Segmento A — endurecimiento de auth/infra

- **`feat/auth-hardening`:** **(1) Recuperación de contraseña real.** El enlace "¿Olvidaste tu contraseña?" era `href="#"` — la última promesa que la UI no podía cumplir. Ahora `/forgot-password` (`resetPasswordForEmail` con `redirectTo` al origen actual) → correo → `/reset-password` (`updateUser`). **La pantalla de solicitud NO revela si el correo existe**: decirlo la convertiría en un oráculo de enumeración de cuentas, así que la confirmación es idéntica en ambos casos. `/reset-password` canjea el `?code=` que Supabase adjunta; como `detectSessionInUrl` es **asíncrono**, no basta con leer `getSession()` al montar: se escucha `onAuthStateChange` y se da un margen de 2 s antes de declarar el enlace inválido. El error de enlace vencido (`?error=…`) es **estado derivado del primer render**, no un `setState` dentro del efecto. Al terminar, el usuario entra directo a su panel por rol en vez de volver a loguearse. **(2) `middleware.ts` falla CERRADO** sin variables de entorno: antes usaba `!`, así que el cliente se creaba apuntando a `undefined`, `getUser()` devolvía null y el middleware lo leía como "no hay sesión" → todos al login, en bucle. Ahora las rutas protegidas cortan con 503 explícito y el resto del sitio sigue en pie (equivalente al throw de `lib/supabase.ts`). **(3) `app/global-error.tsx`** — red de seguridad para fallos del root layout; trae `<html>`/`<body>` propios y estilos inline porque a esa altura no existen ni ThemeProvider ni tokens. **(4) Fronteras por segmento** — `error.tsx`/`loading.tsx` en `/admin` y `/dashboard`, vía `SectionError` + `SectionSkeleton` compartidos: el fallo ocupa sólo el área de contenido, con el shell vivo, para que el usuario pueda navegar a otra sección en vez de quedar en pantalla muerta. **(5) Limpieza:** borrado `components/auth/LogoutButton.tsx` (código muerto, sin importadores; el logout vive en el user card del `DashboardShell`) y **`homeForRole` extraído a `lib/roles.ts`** — tenía tres copias (login, middleware, y habría sido una cuarta en reset-password), que es exactamente cómo se desincroniza el ruteo por rol. **Paso manual requerido:** la URL de callback debe estar en Supabase → Authentication → URL Configuration → Redirect URLs.

---

## Seguridad — endurecimiento columnar de RLS (migración 007)

- **`fix/rls-privilege-escalation` — cierre de 4 hallazgos críticos/altos de la auditoría de infraestructura del 2026-08-15.** Los cuatro comparten una sola raíz: **la RLS de Postgres es row-level y en tres sitios se escribió como si fuera column-level** — una policy acota qué *fila* se edita, nunca qué *columnas*. **C1 (crítico):** `profiles_update_self` dejaba a cualquier autenticado —incluido un conductor, que es tercero contratista— hacer `PATCH /rest/v1/profiles?id=eq.<su_uid> {"role":"admin"}` y pasar a leer `delivery_financials` (pago a cada transportista, margen por entrega) y `client_invoices` (facturación completa, DSO, `tarifa_flete` por cliente); anulaba por completo la separación de roles. Se cierra con el trigger `protect_profile_columns()` (solo un admin cambia `role`; `id` inmutable). **C2 (crítico):** `handle_new_user()` leía el rol de `raw_user_meta_data`, que el cliente escribe en su propio signup → pasa a `raw_app_meta_data` (solo service_role) con lista blanca de roles y caída a `conductor`. **C4 (crítico):** `seed_demo_data()` es SECURITY DEFINER y Postgres concede EXECUTE a PUBLIC por defecto → era invocable por **anon** vía RPC contra producción; `revoke all`. **H1 (alto):** `deliveries_driver_update` dejaba al conductor escribir `valor_flete` (lo que se le cobra al cliente) → trigger `protect_delivery_columns()` que restaura en silencio las columnas comerciales/de planificación. **Alcance deliberado de H1:** NO se protegen `hora_llegada_punto`/`hora_salida_punto`/`tiempo_en_punto_minutos` porque `on_llegada_punto()`/`on_salida_punto()` **no son SECURITY DEFINER** y las escriben con la sesión del propio conductor — protegerlas revertiría el update del trigger y rompería el cronómetro de la Fase 1.1. Ambos triggers permiten `auth.uid() IS NULL` (service_role / SQL Editor, que no llevan JWT); un anónimo no puede llegar ahí porque no empareja ninguna fila en la policy. Todo plegado también en `scripts/schema.sql` para que una instalación nueva no reintroduzca los huecos (misma convención que la 003). **Cero cambios de código de app** — las dos únicas lecturas de `profiles` (`login`, `useAuth`) son `select('role')`. **C3** (usuarios `*@despachr.test` en producción con la contraseña compartida que este repo publicaba) **no se arregla con SQL**: se quitó la contraseña de `schema.sql` y se documentó el provisioning por `app_metadata`, pero **queda en el historial de git y la rotación en Supabase es obligatoria**. **Hallazgo #5, encontrado al aplicar la remediación y peor de lo que la auditoría suponía:** el ajuste de proyecto **"Allow new users to sign up" estaba ON** desde la creación del proyecto (2026-06-27) hasta el 2026-08-16. La auditoría calificaba C2 como "contenido porque el registro público está deshabilitado" — la premisa era falsa: sólo la *UI* no tenía registro. Con la `handle_new_user` anterior, cualquiera con la anon key (que viaja en el bundle de JS) podía `POST /auth/v1/signup` con `user_metadata: {"role":"admin"}` y quedar como admin de producción, sin necesitar cuenta previa. Se apagó el ajuste. **Verificación forense posterior: sin compromiso** — los 6 usuarios de `auth.users` están explicados (5 de setup + 1 de la prueba de OTP por teléfono del PR #19), ninguno con `deleted_at`, todos con profile, y ninguna cuenta no reconocida pidió rol privilegiado en el signup. Nota para la Fase 1.3b: con el signup apagado, `signInWithOtp` debe ir con `shouldCreateUser: false`. Corolario documental: se corrigió la afirmación de que la Fase 2 estaba bloqueada por la migración 007 — `peso_kg`/`volumen_m3` (ahora **008**) solo hace falta para el planificador de malla; el coordinador sobre datos reales, el mapa y las alertas no tocan esas columnas y la RLS del coordinador ya concede lo necesario.

---

## Fase 0 — foundation (segments 1-5)

- **Segment 5 — `chore/limpieza-docs` (limpieza + sync de docs):** sin cambios de código de producto. Removido `assets/Despachr v1/` del repo (git rm) y `/assets/` agregado a `.gitignore` (los handoffs de diseño y artefactos de QA viven fuera del repo; brand kit en `/public/brand`). `README.md` y `AGENTS.md` sincronizados con el stack real (Next.js 16 + React 19 + Tailwind 4; auth email/password + phone OTP) y estado real (11 tablas, migraciones 001-003 en producción, Fase 0 completa). **npm audit:** las 2 vulnerabilidades **high** (`brace-expansion`, `js-yaml`) corregidas con `npm audit fix` (solo `package-lock.json`, sin breaking). Las 2 **moderate** (`postcss` <8.5.10 vía `next`) quedan **known/accepted**: el único fix (`npm audit fix --force`) degrada Next 16→9.3.3 (major breaking); se resolverán con un patch futuro de Next que suba su `postcss` embebido.

- **Segment 4 — `feat/driver-phone-otp-login` (login del conductor por OTP SMS):** habilitado el signup/login solo-teléfono (Supabase Phone Auth + Twilio Verify) para los conductores. Bug de origen: fallaba con 500 "Database error saving new user" porque el trigger `handle_new_user()` insertaba `new.email` (NULL en OTP) en `profiles.email` **NOT NULL**, y el fallback de `name` (`split_part(new.email,'@',1)`) también daba NULL. `scripts/migrations/003-fix-handle-new-user-phone-auth.sql` (Opción B): `profiles.email` pasa a **anulable** + función corregida (email NULL-safe, cadena de fallbacks para `name`, y `phone` desde la columna nativa **`new.phone`** con fallback a metadata). Mismo fix plegado en `scripts/schema.sql` (instalaciones nuevas no reintroducen el bug). `useAuth` mapea `email: row.email ?? ''`. Nada en la app depende de `profiles.email` (no se muestra ni se usa como identidad; `id` es la clave). **Migración 003 ejecutada en producción; OTP por SMS verificado end-to-end** (signup por teléfono crea el profile con `email` NULL y `phone` E.164).

- **Segment 3 — `feat/alerts-cron` (sistema de alertas de 60 min):** infraestructura backend (sin tocar UI). `scripts/migrations/002-alerts.sql` crea la **tabla `alerts`** (tabla #11: `delivery_id`/`route_id`/`tipo` ∈ `tiempo_en_punto|ruta_no_iniciada|novedad`/`mensaje`/`resuelta`/…), **índice único parcial** `uniq_alerts_activa (delivery_id, tipo) WHERE resuelta=false` (evita duplicados), RLS solo **SELECT+UPDATE** para coord/admin (sin INSERT → solo la edge function con service role), trigger `updated_at`. Edge function Deno `supabase/functions/check-tiempo-en-punto/index.ts`: busca entregas `en_punto` con `hora_llegada_punto < now()-60min`, salta si ya hay alerta activa, inserta alerta y **notifica a Telegram** (best-effort; si falla, la alerta persiste), devuelve `{checked, alerted, telegram_ok}`. `README.md` con pasos exactos (BotFather, chat_id, `supabase secrets set`, `functions deploy`, `pg_cron`+`pg_net` cada 5 min con Vault, prueba con curl). Timer server-side (el de `DriverApp` es solo visual). SQL/deploy los corre el usuario a mano. `supabase/functions/**` excluido de tsconfig+eslint (runtime Deno).

- **Segment 2 — `feat/storage-cumplidos` (infraestructura de storage para cumplidos):** solo infraestructura, sin tocar la UI todavía (eso es Phase 1). `scripts/migrations/001-storage-cumplidos.sql` crea el bucket **privado** `cumplidos` (5 MB, MIME `image/jpeg|png|webp`) con políticas RLS sobre `storage.objects`: conductor **INSERT** solo en paths de sus rutas (`route_id` parseado del path vía `storage.foldername()` y validado contra `routes.driver_id = auth.uid()`, comparando como texto para no lanzar en paths malformados), coordinador/admin **SELECT** de todo, admin **DELETE**. Paths: `{routeId}/{deliveryId}/cumplido.jpg` y `firma.png`. `lib/storage.ts` expone helpers tipados: `uploadCumplido()` (comprime a JPEG ≤1920px si hace falta), `uploadFirma()` (PNG), `getCumplidoUrl()` (signed URL 1 h, nunca pública), con `StorageError`. El SQL se corre a mano en Supabase.

- **Segment 1 — `refactor/estados-schema` (vocabulario de estados alineado al schema):** los mocks ahora usan los enums de dominio de `types/index.ts` (fuente de verdad = CHECK de `scripts/schema.sql`), para que conectar Supabase sea un cambio de fuente de datos y no un refactor. Eliminados los tipos duplicados `DeliveryStatus`/`RouteStatus`/`InvoiceStatus`. Mapeos: entrega `delivered→entregado`, `onsite→en_punto`, `pending→pendiente` (`EstadoEntrega`); ruta `en_ruta→en_curso`, `programada→pendiente`, `completada` igual (`EstadoRuta`); factura `pendiente→enviada`, `pagada`/`vencida` igual (`EstadoFactura`). **`retrasada` NO es un estado del schema** → condición derivada (`ActiveRoute.retrasada?: boolean` + helper `routeBadge()`; una ruta demorada sigue `en_curso`). Consumidores actualizados: `DriverApp`, `RoutesTable`, `dashboard/page`, `dashboard/rutas/page`, `admin/facturacion/page`.

- **Bug-fix pass (post QA-E2E audit):** corregidos 5 bugs reales sin backend. (1) **Sidebar móvil** — `DashboardShell` colapsa a un `Sheet` lateral con botón hamburguesa `md:hidden`; el `<aside>` fijo queda `hidden md:flex` (arregla las 16 pantallas coord/admin en 390px). (2) **Hidratación de `ThemeToggle`** — el `aria-label` se estabiliza hasta `mounted` (elimina los 16 errores de consola). (3) **Gate de cumplido del conductor** — "Confirmar entrega" exige también "Recibido por" no vacío. (4) **Open-redirect** — `safeRedirect()` en login rechaza `//host` y `/\host` (protocol-relative). (5) **Rol nulo/silencioso** — login y `middleware.ts` manejan el fallo del fetch de `profiles`: login cierra sesión y avisa; el middleware manda a `/login?error=perfil` (evita panel equivocado y el bucle de redirección).

---

## Earlier — base + UI redesign (pre-segments)

- DB schema live in Supabase: 11 tables (10 + `alerts`), 24 RLS policies, triggers. Migraciones `001` (storage cumplidos), `002` (tabla alerts), `003` (fix phone-auth) ejecutadas en producción.
- Seed data loaded + RLS verified per role (admin/coordinador/conductor).
- Keys de Supabase rotadas y actualizadas en Vercel.
- Auth real con redirección por rol (login + middleware + useAuth + LogoutButton). Public registration removed (admin-only user creation).
- Next.js 16 (React 19) boilerplate; folder structure; 9 TypeScript domain models (Spanish enums, aligned to schema); Supabase client (client + server); `useAuth`; middleware; 5 automation scripts; npm scripts; Claude Code skills.

- **Rediseño UI — Fase 0 (fundación):** migración a **shadcn/ui + Radix** (preset radix-nova). Tokens del handoff en `app/globals.css` (verde `#0F6E56` como `--primary`, animaciones `fadeUp`/`pop`). Fuentes Inter + JetBrains Mono. 16 primitivos shadcn. `cn()` con `tailwind-merge`. (Handoffs de diseño fuera del repo; brand kit en `/public/brand`.)
- **Rediseño UI — Fase 1 (shells + ruteo):** **login split** de 2 columnas; **DashboardShell** reutilizable (sidebar + topbar + user card con logout). Segmentos por rol: `/dashboard/*` (coordinador) y `/admin/*` (admin) con `PageHeader`. `homeForRole` y middleware.
- **Rediseño UI — Fase 2 (coordinador):** 4 pantallas mock — operación en vivo, rutas, conductores, clientes. Piezas: `StatusBadge`, `StatCard`, `RouteProgress`, `LiveMap`, `AlertsCard`, `DriverCard`, `RoutesTable`. Mock en `lib/mock/coordinator.ts`.
- **Rediseño UI — Fase 3 (admin):** 4 pantallas — métricas (KPIs + barras + anillo), clientes, facturación, reportes. Componentes: `KpiCard`, `TonnageChart`, `ComplianceRing`, `PeriodToggle`. Mock en `lib/mock/admin.ts`.
- **App del conductor (mobile):** flujo `list → active → capture → done` (`DriverApp`) con timer en vivo, captura foto+firma (placeholders) + "Recibido por". Mock en `lib/mock/driver.ts`.
- **Light/Dark mode (Zinc) + gráficas:** tokens Zinc (light+dark) con verde de marca; **next-themes** (`system` default) + switch sol/luna; sidebar claro (superficies oscuras intencionales → token `--panel`).
- **Landing (marketing):** `/` con tema oscuro; v2 de 8 secciones (nav/hero → Producto → Cómo funciona → Plataforma → Precios → CTA → footer). Componentes: `LiveMapCard`, `DemoMockup`, `ProductFeatures`, `HowItWorks`, `Pricing`, `Reveal`.
- **Marca / iconos:** símbolo "Ruta-D" en `components/brand/BrandMark.tsx`. **PWA**: `app/manifest.ts` (icons 192/512) + apple-touch-icon 180. Assets en `public/brand/`.
- **QA tooling (skill + subagent):** `scripts/qa.mjs` (Playwright) login por rol y recorre todas las rutas en desktop+mobile y light/dark, capturando screenshots + errores consola/JS + axe → `assets/qa/<timestamp>/` (gitignored). Skill `/qa [segmento]`, subagente `qa`, `npm run qa`.

## 2026-08-30/31 — Fase 3.1: el producto cambia de forma

La reunión con la dueña (2026-08-24, transcrita en Notion) reordenó el producto. Hasta aquí Despachr
era una **herramienta que la gente opera**: paneles, mapas, tableros. Ese es el molde en el que Drivin
y SimpliRoute llevan diez años ganando. Lo que la operación real pide es otra cosa: **software que
hace el trabajo**. Concretamente, el trabajo de Girle — llenar a mano el Excel que manda el cliente,
persiguiendo cumplidos que llegan 15–20 días tarde, y filtrarlo para sacar el porcentaje de la
reunión de los viernes.

**Lo construido.** Migración `008` (`deliveries.fecha_programada`): el compromiso viene en el Excel
semanal del cliente, y sin él "a tiempo" no existía — era el dato que STATUS.md daba por imposible.
Con eso, `lib/cumplimiento.ts` (la aritmética, 4 tests), `lib/queries/reporte.ts` (datos, con el
cliente de Supabase inyectado como en `cumplido.ts`), `app/api/informe/route.ts` (el agente redactor,
`claude-opus-5`) y el informe como única pantalla del admin. Verificado contra la base: 85.7% de
cumplimiento, 91.4% de efectividad.

**La decisión que sostiene todo:** los números los calcula código, el modelo **sólo redacta**. Recibe
los totales ya hechos y tiene prohibido producir cifras nuevas. No es estética — este informe se le
entrega al cliente que paga, y un porcentaje alucinado es una factura mal sustentada. Corolario: si
la llamada al modelo falla, el informe sigue en pie completo.

Dos detalles que salieron de la voz de la dueña y quedaron en el producto: cada oportunidad de mejora
dice **de quién depende** (nosotros / cliente / punto — su modelo mental textual), y la pantalla
**declara la base del porcentaje** cuando hay entregas sin compromiso, porque un cumplimiento
calculado sobre una base recortada en silencio se ve idéntico a uno bueno.

**Lo borrado (−425 líneas netas).** Las tres pantallas mock del admin (Métricas, Clientes,
Facturación), sus cuatro componentes exclusivos, `lib/mock/` entero y `demo-data-notice.tsx`. No eran
deuda pendiente de completar: eran vistas para mirar, y ninguna le quitaba trabajo a nadie. El
`demo-data-notice` se autodestruyó según su propia regla — "cuando ninguna página lo importe, bórralo".
No queda un solo dato inventado en la UI.

**Corregido en AGENTS.md** contra la fuente real: era **SIGO**, no "Cigo"; el plazo es de **15 días**,
no 30; el margen objetivo es **22%** y lo calcula SISTRAN solo; existen los **anexos**. Y se añadió
la restricción que condiciona todo lo que se le pida al conductor: refrigerados, ventana de recibo
hasta las 10–11am, colas de descargue de hasta 2 horas. Cualquier paso nuevo entre 7 y 10am no se va
a usar.

**Hallazgo que evita trabajo perdido:** el RNDC (obligatorio, Decreto 1017 de 2025) ya lo resuelve
SISTRAN para este cliente. Sigue siendo una cuña real frente a los competidores regionales, pero **no
es el camino de entrada al piloto**.

## 2026-09-01/05 — Fase 3.2 (parcial): el agente de cumplido, exportar a Casablanca, y un respaldo de proveedor

Con un lote real de cumplidos (PDF de CamScanner, 23 facturas selladas a mano) se pudo diseñar el
agente de cumplido en vez de adivinarlo. El documento resultó ser: factura impresa con certeza
(número, punto, dirección) + un sello de caucho manuscrito que decide lo único que importa — la
fecha real de entrega — y que cambia de posición y nitidez en cada punto. Por eso el agente
**propone y una persona confirma** (`app/dashboard/cumplidos`, `app/api/cumplidos`), y por eso el
prompt es explícito: null vale más que un dato inventado. El PDF se parte en el navegador sin
librería (`lib/cumplidos.ts` escanea los marcadores de bytes JPEG que CamScanner incrusta) porque 23
páginas por una llamada al modelo no cabe en el timeout de una función serverless.

Dos fotos reales del archivo que hoy llena la operación ("RELACION GENERAL DE FACTURAS" y "RELACION
DE ENTREGAS ... CASABLANCA") reescribieron el objetivo del proyecto: **el entregable no es nuestro
informe bonito, es el archivo del cliente, ya lleno.** Eso reveló una distinción que el schema no
tenía separada — ESTATUS (¿llegó la mercancía?) y CUMPLIDO (¿ya volvió el papel firmado?) son dos
preguntas distintas, y una entrega puede estar ENTREGADA con el CUMPLIDO en PENDIENTE durante 15-20
días: es literalmente el cuello de botella que este producto existe para cerrar, ahora con columna
propia (`estadoCumplido` en `lib/cumplimiento.ts`). También reveló la reprogramación (`2DA FECHA`):
cuando una entrega falla se corre el compromiso en la MISMA fila, no se crea una entrega nueva — y
por indicación explícita de la dueña, el cumplimiento se mide SIEMPRE contra la fecha original de la
malla, nunca contra la reprogramada (migración `010`, `fecha_reprogramada`). El adaptador de
Casablanca (`lib/exportadores/casablanca.ts`) vive deliberadamente fuera del núcleo — es el primer
cliente, no el único, y su formato no debe filtrarse a `lib/cumplimiento.ts`.

Migraciones `009` (`numero_factura`, único POR CLIENTE — la llave entre el Excel del cliente, la
factura física y la fila) y `010` corridas en producción con el CLI de Supabase (`supabase db query
--linked -f archivo.sql`), no con Claude Chrome: el proyecto ya tenía el CLI logueado y el proyecto
linkeado, cero fricción y cero tokens de navegación por migración — se documentó en memoria para no
volver a montar el rodeo del navegador.

El pago en la consola de Anthropic quedó trabado varios días ("no podemos autenticar" con dos
tarjetas de bancos distintos, mismo error — apunta a 3D Secure, no a fondos). `lib/ia/informe.ts` y
`lib/ia/cumplido.ts` centralizan un respaldo: sin `ANTHROPIC_API_KEY` pero con `GEMINI_API_KEY` (tier
gratis real, sin tarjeta), los dos agentes corren igual. Es un respaldo para seguir probando la app,
no una validación de calidad — leer el sello manuscrito es la tarea difícil que el proyecto está
midiendo, y esa medición sólo cuenta hecha con Opus 5.

**Sin cerrar al terminar esta sesión:** los 5 commits de este tramo (`9329395`…`54ea8b1`) siguen sin
subir ni mergear a `main`; `docs/reunion-2026-08-24.md` sigue sin decisión (commit vs. fuera del repo
— trae márgenes y nombres del equipo); el usuario de Girle (rol `coordinador`) no se ha creado; y el
emparejamiento por factura sigue sin una sola factura real cargada (`FEV...`) — sólo las sintéticas
de la semilla.

## 2026-09-07 — el lote real expone el segundo bug: cuota de Gemini, no calidad de lectura

Con `STATUS.md` puesto al día, un agente de QA nuevo (sesión separada, sin memoria de la anterior)
pudo arrancar directo desde la documentación sin re-diagnosticar el bug de `/admin` ya cerrado —
confirmó que sigue en PASS y se fue directo al gap real que quedaba abierto: medir la calidad de
lectura del sello manuscrito, pero esta vez con las 23 facturas reales del PDF, no con 1 página de
prueba.

El resultado no fue sobre calidad: **18 de 23 fallaron por límite de cuota/velocidad del tier gratis
de Gemini**, agotado a mitad de un lote semanal real. `leerCumplido` no reintentaba nada — cualquier
bache tumbaba esa página para siempre. Es un hallazgo distinto del `503` de "alta demanda" que se
había verificado el día anterior (ese es un apagón temporal que le pasa igual a cuentas pagadas; este
es un tope de cuota que sí depende del volumen, y donde pagar Gemini sí ayudaría si el tope es
genuinamente diario).

`lib/ia/reintentar.ts` agrega reintento con backoff (hasta 3 intentos) sólo ante 429/503 — no ante
errores que no cambian con un segundo intento (esquema mal formado, modelo inexistente, permisos).
Respeta el `retryDelay` que la propia API de Google manda en el error en vez de adivinar un tiempo de
espera fijo. Cableado en los dos agentes de IA. Sin solucionar del todo: reintentar no fabrica más
cuota diaria si el tope es genuinamente por día — sólo absorbe baches transitorios dentro de una
cuota que todavía tiene margen. Queda pendiente reverificar el lote real completo una vez la cuota
gratis de hoy resetee.

Nota aparte, de higiene: `supabase/.temp/` (estado local del CLI, cambia en cada `supabase db query`)
estaba trackeado por accidente desde hacía semanas — se dejó de rastrear y se agregó al `.gitignore`.

## 2026-09-08 — la pregunta que abrió el proyecto, contestada: ~92% de precisión, medido

Con Gemini en tier pagado (resuelve el tope de ~20 llamadas/día del hallazgo anterior), se corrió el
lote real completo (23 páginas) por tercera vez. Las 23/23 completaron sin un solo error de red o
cuota — confirma que el fix de ayer (reintento + pago) resolvió el problema de raíz, no a medias.

Pero esta vez el QA no se detuvo en "¿falla o no?": extrajo las 23 páginas JPEG con el mismo código
que usa la app, y verificó 11 de ellas a mano contra la imagen real — comparando lo que el modelo dijo
contra lo que el sello manuscrito realmente dice. Es la primera medición real de la pregunta que abrió
el proyecto entero: ¿puede un modelo de IA leer un sello de caucho firmado a mano en una factura
colombiana? Respuesta, con evidencia: **sí, ~92% de precisión** (12/13 lecturas correctas contando
abstenciones).

Dos abstenciones correctas — el modelo devolvió `null` en vez de inventar una fecha donde no había
ninguna visible, exactamente como pide el diseño ("null vale más que un dato inventado"). Dos errores
reales, y los dos informativos: un escaneo genuinamente degradado leído con confianza "Alta" cuando
debió ser "Dudosa" (se equivocó de década, 2020 por 2026); y un documento con dos fechas candidatas
impresas donde el modelo mezcló ambas en un valor híbrido (sí bajó la confianza, el dato igual quedó
falso). Y un hallazgo que nadie pidió pero pesa: dos páginas resultaron ser el mismo escaneo duplicado
byte por byte, y el modelo dio **respuestas distintas** en dos llamadas sobre la misma imagen exacta —
evidencia directa de que "confianza Alta" no es una garantía estable.

Conclusión operativa: el diseño de copiloto (proponer, humano confirma) que se decidió por intuición
al principio del proyecto queda confirmado por datos, no por fe — la confianza del modelo ayuda pero
no basta sola para saltarse la revisión humana. Cablear el paso de escritura de Fase 3.2 sin discutir
antes cómo tratar la confianza "Alta" sería ignorar este hallazgo.

De paso: el prompt del sistema en `lib/ia/cumplido.ts` sólo describe el formato "RECIBO DE MERCANCÍA",
pero el lote real trae mucha más variedad (confirmaciones Makro con fecha impresa, devoluciones,
reportes PriceSmart en inglés) — el modelo los manejó bien de todos modos, pero nombrarlos explícitamente
podría subir la precisión más.

Limpieza: se borraron ~7 archivos de debris (capturas y scripts temporales) que tres corridas de QA
sucesivas fueron dejando sueltos en `scripts/`, sin comitear nunca — ninguno tocaba código de producción.
