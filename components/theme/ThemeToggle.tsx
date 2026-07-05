'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

// Switch sol/luna: alterna desde el modo efectivo y persiste (next-themes).
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // Guard de montaje (patrón oficial de next-themes): el icono alterna entre dos SVG distintos,
  // que suppressHydrationWarning no cubre, así que necesitamos el flag para evitar el mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      // El label se estabiliza hasta montar para no romper la hidratación (igual que el icono).
      aria-label={!mounted ? 'Cambiar tema' : isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="flex size-[38px] items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {/* Muestra sol en oscuro y luna en claro */}
      {mounted && isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  )
}
