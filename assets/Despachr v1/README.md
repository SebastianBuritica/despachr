# Despachr — Diseños v1

Paquete unificado de los diseños de **Despachr** (SaaS B2B logístico para empresas de transporte de carga). Todo lo necesario para recrear los diseños en código está aquí.

> **Estética:** shadcn/ui + Radix, neutro y profesional (referencias Stripe / Linear). Verde de marca `#0F6E56` / `#1D9E75`. Tipografía **Inter** + **JetBrains Mono** (cifras). Iconos **lucide**.

---

## 📂 Contenido

```
Despachr v1/
├── README.md                  ← estás aquí (índice maestro)
├── app/                       La aplicación (producto)
│   ├── Despachr.dc.html              prototipo: 4 experiencias + 8 sub-páginas
│   ├── APP-handoff.md                spec completa de la app (pantallas, estado, tokens)
│   ├── UPDATE-tema-y-graficas.md     tema Zinc light/dark + sidebar claro + gráficas ⭐ fuente de verdad de color
│   └── screenshots/                  14 capturas de referencia
├── landing/                   La landing page de marketing
│   ├── Despachr Landing.dc.html      prototipo: hero + secciones claro/oscuro + precios
│   ├── LANDING-handoff.md            spec completa de la landing
│   ├── LANDING-mapa-en-vivo.md       el mapa "EN VIVO" + migración a Mapbox
│   └── screenshots/landing-01-hero.png
└── brand/                     Identidad / logo (Ruta-D)
    ├── README.md                     uso del logo + tamaños
    ├── *.svg                         isotipo, app icon, lockups (claro/oscuro, mono)
    └── png/                          app icons 16–1024 + favicons + lockups
```

---

## 🚀 Por dónde empezar (para el agente de desarrollo)

1. **Lee este README** para el contexto general y la marca.
2. **¿Vas a construir la app?** → `app/APP-handoff.md`. La paleta vigente (light/dark Zinc) está en `app/UPDATE-tema-y-graficas.md` — **tiene precedencia** sobre la tabla de color del handoff.
3. **¿Vas a construir la landing?** → `landing/LANDING-handoff.md`, y para el mapa `landing/LANDING-mapa-en-vivo.md` (usar **Mapbox**, Opción A).
4. **Logo / iconos** → `brand/README.md` (regla clave: ≥48px versión punteada, ≤32px versión sólida).
5. Cada `.dc.html` es la **fuente exacta** de medidas, colores y copy. Es una referencia de diseño en HTML, **no** código para copiar tal cual: recréalo con los componentes de tu stack (React/Next + shadcn, etc.).

---

## Resumen de entregables

**App** — 4 experiencias: Login · App del conductor (móvil: lista → entrega activa con timer → captura de cumplido → confirmación) · Dashboard del coordinador (operación en vivo, rutas, conductores, clientes) · Dashboard del admin (métricas, clientes, facturación, reportes). Tema light/dark (escala Zinc).

**Landing** — hero oscuro con tarjeta de mapa "EN VIVO" animada (ruta Puerto Colombia → Barranquilla → Soledad), secciones **intercaladas claro/oscuro** (Producto blanco · Cómo funciona oscuro · Plataforma/demo claro · Precios oscuro), 3 planes de precios (valores **mock**) y CTA.

**Marca** — isotipo **Ruta-D** (la "D" trazada como una ruta): app icon negro, lockups y favicons en SVG + PNG.

---

## Notas
- **Precios** de la landing son valores de referencia (mock) — reemplazar por los reales.
- **Mapa**: el prototipo usa tiles estáticos; en producción integrar **Mapbox** (ver doc del mapa) con tu propio token y atribución.
- El **switcher de demo** flotante en los prototipos es solo andamiaje — no va a producción.
- Datos (clientes, rutas, facturas) son de ejemplo realista — vienen de API en producción.

*Versión v1 · 2026*
