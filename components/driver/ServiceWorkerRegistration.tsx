'use client'

import { useEffect } from 'react'

// Registra el service worker SÓLO en la app del conductor: es el único rol que
// trabaja sin señal. Coordinación y administración operan desde una oficina con
// wifi, y cachear sus pantallas sólo agregaría una capa donde puede quedarse
// pegada una versión vieja, sin beneficio.
//
// En desarrollo no se registra: un shell cacheado peleando con el HMR de
// Turbopack produce exactamente el tipo de bug fantasma que cuesta una tarde.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch((e) => {
      // Sin service worker la app sigue funcionando (la cola offline vive en
      // IndexedDB, aparte); sólo se pierde el arranque en frío sin red.
      console.warn('No se pudo registrar el service worker:', e)
    })
  }, [])

  return null
}
