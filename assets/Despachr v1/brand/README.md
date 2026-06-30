# Despachr — Brand assets (logo)

Reemplaza el icono de camión actual por estos archivos. El símbolo es la **Ruta-D**; el app icon oficial va sobre **negro `#0A0A0A`** con asta blanca, recorrido punteado y nodo de destino verde `#1D9E75`.

## SVG (vectoriales, preferidos)
| Archivo | Uso |
|---|---|
| `despachr-appicon.svg` | App icon oficial (1024², fondo negro, recorrido punteado). Para cualquier tamaño ≥ 48 px. |
| `despachr-appicon-solid.svg` | Variante con bowl **sólido** — usar solo para favicon ≤ 32 px (conserva la “D”). |
| `despachr-symbol.svg` | Símbolo suelto sobre fondo **claro** (asta verde). Sin contenedor. |
| `despachr-symbol-on-dark.svg` | Símbolo suelto sobre fondo **oscuro** (asta blanca). |
| `despachr-lockup.svg` | Lockup horizontal (icono + “Despachr”) para fondos claros. Texto = Inter 800. |
| `despachr-lockup-on-dark.svg` | Lockup horizontal para fondos oscuros. |

> Los lockups usan texto vivo en **Inter 800**. Asegúrate de tener Inter cargada (ya la usas en la UI). Si necesitas el wordmark independiente de la fuente, conviértelo a contornos en el editor.

## PNG (en `png/`)
| Archivo | Tamaño | Uso típico |
|---|---|---|
| `despachr-appicon-1024.png` | 1024² | Tienda / origen maestro |
| `despachr-appicon-512.png` | 512² | PWA `icon-512` |
| `despachr-appicon-192.png` | 192² | PWA `icon-192` (Android) |
| `apple-touch-icon-180.png` | 180² | `apple-touch-icon` |
| `despachr-appicon-120.png` | 120² | iOS @2x |
| `despachr-appicon-64.png` | 64² | UI / atajos |
| `despachr-appicon-48.png` | 48² | barra de la app |
| `despachr-favicon-32.png` | 32² | favicon (bowl sólido) |
| `despachr-favicon-16.png` | 16² | favicon (bowl sólido) |
| `despachr-lockup-1392x352.png` | 1392×352 | lockup claro (correo, docs) |
| `despachr-lockup-on-dark-1392x352.png` | 1392×352 | lockup oscuro |

## Snippet de `<head>`
```html
<link rel="icon" type="image/png" sizes="32x32" href="/brand/png/despachr-favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/brand/png/despachr-favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/brand/png/apple-touch-icon-180.png">
<link rel="icon" type="image/svg+xml" href="/brand/despachr-appicon.svg">
```

## Regla clave
- **≥ 48 px** → versión punteada (`despachr-appicon.svg` / PNGs grandes).
- **≤ 32 px** → versión sólida (`despachr-appicon-solid.svg` / `favicon-32/16`), para no perder la “D”.
- Colores: negro `#0A0A0A`, asta/nodo origen blanco `#FFFFFF`, recorrido/destino verde `#1D9E75` (acento de marca `#0F6E56`).
