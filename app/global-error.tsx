'use client'

import { useEffect } from 'react'

// Última red de seguridad: se monta cuando el fallo ocurre en el ROOT layout,
// donde `app/error.tsx` ya no existe para capturarlo. Next reemplaza el
// documento entero, así que este archivo debe traer <html> y <body> propios —
// y por lo mismo no puede apoyarse en el ThemeProvider ni en los tokens del
// layout: los colores van explícitos y neutros a propósito.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1.5rem',
          textAlign: 'center',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          background: '#FAFAFA',
          color: '#09090B',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
          Despachr no pudo cargar
        </h1>
        <p style={{ maxWidth: '28rem', fontSize: '0.875rem', color: '#52525B', margin: 0 }}>
          Ocurrió un error inesperado al iniciar la aplicación. Reintenta; si sigue pasando, avisa a
          soporte.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: '0.5rem',
            cursor: 'pointer',
            borderRadius: '0.5rem',
            border: 'none',
            background: '#0F6E56',
            color: '#FFFFFF',
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  )
}
