import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Despachr — Gestión Logística',
    short_name: 'Despachr',
    description:
      'Gestión logística en tiempo real para empresas de transporte de carga en Colombia y Latinoamérica.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0A',
    theme_color: '#0A0A0A',
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
