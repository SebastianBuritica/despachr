/*
  Service worker de Despachr — que la app del conductor ABRA sin señal.

  QUÉ RESUELVE: la cola offline (Fase 1.4) protege todo lo que se captura con la
  app ya abierta. Pero si el conductor la cierra, se le muere la batería o
  recarga en un punto sin cobertura, un arranque en frío no descarga nada y no
  hay app. Este archivo cubre ese hueco.

  ESTRATEGIAS, y por qué cada una:

  - Navegaciones (documentos) → RED PRIMERO, cae al shell cacheado.
    Nunca "caché primero": serviría una versión vieja de la app a un conductor
    con señal, y un despliegue tardaría en llegarle. La red manda cuando hay.

  - Estáticos de build (/_next/static/**) → CACHÉ PRIMERO.
    Llevan hash en el nombre: una URL dada es inmutable, así que servirla de
    caché es correcto por definición y ahorra datos en 3G.

  - Supabase y cualquier API → NUNCA SE CACHEA. Sólo red.
    Servir entregas viejas desde caché es peor que no mostrar nada: el conductor
    creería que su ruta es otra. Los datos frescos son responsabilidad de la app
    (Realtime + refetch); la resiliencia de ESCRITURA es de la cola en IndexedDB.

  No se usa Workbox ni next-pwa: son ~40 líneas y el bundle de un celular de
  gama baja en 3G no tiene por qué cargar una librería para esto.
*/

const VERSION = 'v1'
const SHELL_CACHE = `despachr-shell-${VERSION}`
const STATIC_CACHE = `despachr-static-${VERSION}`

// Lo mínimo para que /driver arranque. Se precachea en install; si alguna falla
// (404 tras un rebuild), no se aborta la instalación entera.
const SHELL = ['/driver', '/offline', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE)
      await Promise.allSettled(SHELL.map((url) => cache.add(url)))
      // Activar de inmediato: un conductor no va a cerrar todas las pestañas
      // para recibir una versión nueva.
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Fuera las cachés de versiones anteriores.
      const nombres = await caches.keys()
      await Promise.all(
        nombres
          .filter((n) => n.startsWith('despachr-') && !n.endsWith(VERSION))
          .map((n) => caches.delete(n))
      )
      await self.clients.claim()
    })()
  )
})

function esEstaticoDeBuild(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/brand/')
}

self.addEventListener('fetch', (event) => {
  const req = event.request

  // Sólo GET: un POST a Supabase jamás debe tocar caché.
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Otro origen (Supabase, Storage, tiles del mapa) → red, sin intermediarios.
  if (url.origin !== self.location.origin) return

  // Rutas de datos propias → red.
  if (url.pathname.startsWith('/api/')) return

  if (esEstaticoDeBuild(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req)
        if (cached) return cached
        const res = await fetch(req)
        // Sólo se cachea lo que salió bien: una respuesta de error congelada
        // sería un fallo permanente hasta el próximo despliegue.
        if (res.ok) {
          const cache = await caches.open(STATIC_CACHE)
          cache.put(req, res.clone())
        }
        return res
      })()
    )
    return
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req)
          if (res.ok) {
            const cache = await caches.open(SHELL_CACHE)
            cache.put(req, res.clone())
          }
          return res
        } catch {
          // Sin red: la misma ruta si se visitó antes; si no, el aviso offline.
          return (
            (await caches.match(req)) ??
            (await caches.match('/driver')) ??
            (await caches.match('/offline')) ??
            new Response('Sin conexión', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          )
        }
      })()
    )
  }
})
