'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface SignaturePadHandle {
  clear: () => void
  isEmpty: () => boolean
  toBlob: () => Promise<Blob | null>
}

// Pad de firma sobre canvas. Sin dependencias: Pointer Events unifica dedo,
// mouse y lápiz. Fondo BLANCO fijo + tinta negra (papel), no el tema — así se
// firma legible en dark mode y el PNG exportado se lee sobre cualquier fondo.
export const SignaturePad = forwardRef<
  SignaturePadHandle,
  { onChange?: (hasContent: boolean) => void; className?: string }
>(function SignaturePad({ onChange, className }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const dirty = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  // Dimensiona el backing store al tamaño en pantalla × DPR (trazos nítidos) y
  // pinta el fondo blanco. Se hace una vez al montar (la pantalla no reflora).
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
  }, [])

  const pointFor = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    drawing.current = true
    last.current = pointFor(e)
    canvasRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !last.current) return
    const p = pointFor(e)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    if (!dirty.current) {
      dirty.current = true
      onChange?.(true)
    }
  }

  const onPointerUp = () => {
    drawing.current = false
    last.current = null
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    dirty.current = false
    onChange?.(false)
  }

  useImperativeHandle(ref, () => ({
    clear,
    isEmpty: () => !dirty.current,
    toBlob: () =>
      new Promise((resolve) =>
        canvasRef.current ? canvasRef.current.toBlob(resolve, 'image/png') : resolve(null)
      ),
  }))

  return (
    <canvas
      ref={canvasRef}
      className={cn('h-32 w-full touch-none rounded-xl border-2 border-dashed border-border bg-white', className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    />
  )
})
