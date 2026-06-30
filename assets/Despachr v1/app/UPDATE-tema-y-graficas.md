# Update prompt — Despachr: Light/Dark mode (Zinc) + gráficas pulidas

> Pégale esto a tu agente en VS Code. Es una **actualización** del dashboard existente, no un rediseño. Conserva la estructura, el contenido y la marca actuales; solo cambia el sistema de color (light/dark con escala Zinc), suaviza el sidebar y pule las gráficas.

## Objetivo
1. Introducir **modo claro y oscuro** usando la escala neutra **Zinc** (estilo shadcn/ui), por defecto siguiendo el sistema (`prefers-color-scheme`) y con un **switch sol/luna** en la barra superior que lo sobreescribe y persiste la preferencia.
2. Quitar el **contraste duro negro/blanco**: superficies suaves, bordes sutiles, y **sidebar claro** (mismo tono que el fondo, estilo Linear/Notion) en modo claro.
3. **Pulir las gráficas** del dashboard (limpio/minimal): barras con baseline y pico resaltado, donut de cumplimiento más fino con leyenda.

El acento de marca (**verde `#0F6E56` / `#1D9E75`**) NO cambia.

---

## 1. Design tokens (Zinc) — light & dark

Define estas variables como CSS custom properties en `:root` (light) y `.dark` (o `[data-theme="dark"]`). Si usas **Tailwind + shadcn/ui**, mapea estos valores a tu `tailwind.config` / `globals.css` (`--background`, `--card`, `--border`, `--muted-foreground`, etc.).

| Token | Light | Dark | Uso |
|---|---|---|---|
| `bg` | `#FAFAFA` | `#09090B` | Fondo general de la app |
| `surface` | `#FFFFFF` | `#18181B` | Cards, modales, topbar |
| `surface-2` | `#F4F4F5` | `#232327` | Header de tabla, hover de fila |
| `border` | `#E4E4E7` | `#27272A` | Bordes, separadores |
| `border-2` | `#F1F1F3` | `#232327` | Divisores internos (filas) |
| `muted-bg` | `#F4F4F5` | `#27272A` | Badge gris, pills, tracks |
| `text` | `#18181B` | `#FAFAFA` | Texto primario |
| `text-2` | `#3F3F46` | `#D4D4D8` | Texto secundario (tablas) |
| `muted` | `#71717A` | `#A1A1AA` | Labels, subtítulos |
| `faint` | `#A1A1AA` | `#71717A` | Placeholders, ejes |
| `sidebar` | `#FAFAFA` | `#0C0C0E` | Fondo del sidebar (= tono del bg) |
| `sidebar-text` | `#52525B` | `#A1A1AA` | Items inactivos del sidebar |
| `sidebar-active-bg` | `#F0F0F1` | `#232327` | Item activo del sidebar |
| `hover` | `#F4F4F5` | `#232327` | Hover de items/botones outline |
| `chip-dark-bg` | `#18181B` | `#FAFAFA` | Chip/segmento activo (invierte) |
| `chip-dark-text` | `#FAFAFA` | `#18181B` | Texto del chip activo |
| `track` | `#E4E4E7` | `#2B2B2F` | Pista del donut/progreso |

### Acentos (iguales en ambos modos)
- `primary` = `#0F6E56` · `primary-2` = `#1D9E75`

### Estados (badges) — fondo / texto / borde
| Estado | Light (bg / text / border) | Dark (bg / text / border) |
|---|---|---|
| Éxito | `#DCFCE7` / `#0F6E56` / — | `rgba(34,197,94,.15)` / `#4ADE80` / — |
| Warning | `#FEF9C3` / `#B45309` / `#FDE68A` | `rgba(217,119,6,.16)` / `#FBBF24` / `rgba(251,191,36,.25)` |
| Error | `#FEF2F2` / `#DC2626` / `#FECACA` | `rgba(220,38,38,.16)` / `#F87171` / `rgba(248,113,113,.25)` |

Tipografía intacta: **Inter** (UI) + **JetBrains Mono** (cifras, placas, montos).

---

## 2. Theming: comportamiento

- **Por defecto = sistema**: sin clase/atributo forzado, usa `@media (prefers-color-scheme: dark)`.
- **Override manual**: un atributo/clase en el root (`data-theme="light" | "dark"`) gana sobre el sistema.
- **Switch en la topbar** (icono sol/luna, 38×38, `border` + `surface`, hover `hover`): alterna entre claro/oscuro partiendo del modo efectivo actual; muestra **sol** cuando está en oscuro y **luna** cuando está en claro.
- **Persistencia**: guarda la preferencia (p. ej. `localStorage["theme"]`) y reaplícala al cargar. En Next.js usa `next-themes` (`<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`), que ya resuelve sistema + override + persistencia + no-flash.

Regla de implementación (CSS puro, si no usas next-themes):
```css
:root { /* tokens light */ }
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) { /* tokens dark */ } }
[data-theme="dark"] { /* tokens dark */ }
```

**Iconos**: usa `currentColor` (no hex fijo) en los SVG que deban seguir el color de texto, para que se adapten al modo. Iconos de marca/acento se quedan en verde.

---

## 3. Sidebar (estilo Linear/Notion)
- Fondo = **mismo tono que el fondo de la app** (`sidebar` ≈ `bg`), con `border-right: 1px solid border`.
- Items inactivos: texto `sidebar-text`; hover: fondo `hover`, texto `text`.
- Item activo: fondo `sidebar-active-bg`, texto `text`, peso 600. (El icono del activo puede ir en verde de acento.)
- Quitar el sidebar negro puro anterior.

---

## 4. Gráficas (limpio / minimal)

**Barras — "Toneladas movilizadas por día"**
- Una sola **línea base** inferior (`border-bottom: 1px solid border`); sin grilla pesada.
- Barras: color `primary`, ancho ~62% (máx ~30px), esquinas superiores redondeadas (`5px 5px 0 0`); **el día pico al 100% de opacidad y el resto a ~0.5** para enfocar el dato.
- Valor encima de cada barra en `mono`, pequeño y `muted`; labels del eje X en `faint`.
- Transición `height .5s` al montar.

**Donut — "Cumplimiento global"**
- Anillo más **fino**: contenedor 148px, centro 112px (`surface`); progreso con `conic-gradient(primary-2 0 94.8%, track 94.8% 100%)`.
- Centro: `94.8%` en `mono` + "a tiempo" en `muted`.
- **Leyenda** debajo con puntos: "A tiempo 94.8%" (`primary-2`) y "Fuera 5.2%" (`track`).

(Opcional, si quieres reforzar: mini-sparklines en las tarjetas KPI y una línea/área de tendencia de cumplimiento en el tiempo. Si usas librería, **Recharts** o **visx** encajan con shadcn.)

---

## 5. Alcance y datos
- Aplica el tema a **toda la app** (dashboards coordinador y admin, login y app del conductor heredan los tokens).
- No inventes datos: mantén los actuales (Carlos Martínez · ABC-123, Makro Montería, Grupo Éxito Barranquilla, Olímpica Soledad, 94.8% / 48.3 T / $8.4M, etc.).
- Mantén accesible el contraste (WCAG AA) de texto sobre `surface`/`bg` en ambos modos.

## Referencia visual
El prototipo de alta fidelidad con estos cambios está en `Despachr.dc.html` (y las capturas previas del handoff). Úsalo como fuente de medidas, estados e interacciones; recréalo con tus componentes (idealmente shadcn/ui + lucide-react), no copies el HTML.
