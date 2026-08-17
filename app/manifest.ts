import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Despachr — Gestión Logística',
    short_name: 'Despachr',
    description:
      'Gestión logística en tiempo real para empresas de transporte de carga en Colombia y Latinoamérica.',
    start_url: '/',
    display: 'standalone',
    // Coinciden con --background del modo oscuro (start_url es la landing, que
    // es oscura fija). El color de la barra de estado por TEMA lo resuelve
    // `viewport.themeColor` en app/layout.tsx, que el manifiesto no puede hacer
    // porque es un valor único.
    background_color: '#09090B',
    theme_color: '#09090B',
    icons: [
      { src: '/brand/png/despachr-appicon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/png/despachr-appicon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/brand/png/despachr-appicon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
