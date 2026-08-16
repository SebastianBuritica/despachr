import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Pruebas de LÓGICA, no de componentes: entorno node, sin jsdom ni React
// Testing Library. Lo que se prueba aquí es el orden y la reanudación del
// cumplido y la normalización de teléfonos — cosas que se rompen en silencio.
// El recorrido de pantallas ya lo cubre el barrido de Playwright (`npm run qa`).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
