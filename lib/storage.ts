// Infraestructura de almacenamiento para cumplidos (foto) y firmas del conductor.
// Bucket PRIVADO 'cumplidos' — ver scripts/migrations/001-storage-cumplidos.sql.
// Paths (deben coincidir con las políticas RLS):
//   {routeId}/{deliveryId}/cumplido.jpg
//   {routeId}/{deliveryId}/firma.png
// NOTA: son helpers de NAVEGADOR (usan canvas/Blob). Llamarlos desde componentes
// client; no ejecutarlos en el servidor / durante el prerender.
import { supabase } from '@/lib/supabase'

export const CUMPLIDOS_BUCKET = 'cumplidos'

// Debe coincidir con el bucket: file_size_limit = 5 MB.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
// Lado mayor tras redimensionar (evita subir fotos de cámara de 4000px).
const MAX_IMAGE_DIMENSION = 1920
const JPEG_QUALITY = 0.8

// Error tipado para que quien llame distinga fallos de storage de otros.
export class StorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageError'
  }
}

function cumplidoPath(routeId: string, deliveryId: string): string {
  return `${routeId}/${deliveryId}/cumplido.jpg`
}

function firmaPath(routeId: string, deliveryId: string): string {
  return `${routeId}/${deliveryId}/firma.png`
}

// Con upsert:false, si ya hay un objeto en el path Supabase responde 409
// "Duplicate". Como el path es DETERMINISTA por entrega, un objeto ahí ES la
// evidencia de esta entrega → la subida anterior SÍ tuvo éxito (falla típica en
// móvil: el request llega al servidor pero la respuesta no vuelve al cliente).
// Se trata como éxito. NO usamos upsert:true: el bucket concede al conductor
// solo INSERT (no UPDATE, ver migración 001); un upsert intentaría UPDATE y la
// RLS lo bloquearía, volviendo un fallo raro en uno seguro en cada reintento.
function isDuplicateError(error: unknown): boolean {
  const e = error as
    | { message?: string; statusCode?: string | number; status?: number; error?: string }
    | null
    | undefined
  if (!e) return false
  const code = String(e.statusCode ?? e.status ?? '')
  const msg = (e.message ?? '').toLowerCase()
  return code === '409' || e.error === 'Duplicate' || msg.includes('already exists')
}

// Comprime/redimensiona a JPEG. Devuelve el original solo si ya es un JPEG
// dentro de límite y dimensión (así los bytes siguen coincidiendo con el .jpg).
async function compressImage(file: File): Promise<Blob> {
  if (typeof document === 'undefined') {
    throw new StorageError('compressImage solo puede ejecutarse en el navegador')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new StorageError('No se pudo leer la imagen para comprimir')
  }

  const largestSide = Math.max(bitmap.width, bitmap.height)
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / largestSide)

  // Ya cumple: JPEG, bajo el límite y sin necesidad de reducir → usar tal cual.
  if (file.type === 'image/jpeg' && file.size <= MAX_UPLOAD_BYTES && scale === 1) {
    bitmap.close()
    return file
  }

  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new StorageError('No se pudo obtener el contexto 2D del canvas')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  )
  if (!blob) {
    throw new StorageError('No se pudo comprimir la imagen')
  }
  return blob
}

/**
 * Sube la foto de cumplido de una entrega. Comprime a JPEG si hace falta.
 * @returns el path del objeto en el bucket (para guardar en deliveries.foto_cumplido_url).
 */
export async function uploadCumplido(
  routeId: string,
  deliveryId: string,
  file: File
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new StorageError(`Tipo de archivo no soportado: ${file.type || 'desconocido'}`)
  }

  const blob = await compressImage(file)
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new StorageError('La imagen supera 5 MB incluso tras comprimir')
  }

  const path = cumplidoPath(routeId, deliveryId)
  const { error } = await supabase.storage
    .from(CUMPLIDOS_BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })

  if (error) {
    // Ya existe en este path (determinista por entrega) = ya se había subido.
    if (isDuplicateError(error)) return path
    throw new StorageError(`No se pudo subir el cumplido: ${error.message}`)
  }
  return path
}

/**
 * Sube la firma (PNG) de quien recibe la entrega.
 * @returns el path del objeto en el bucket.
 */
export async function uploadFirma(
  routeId: string,
  deliveryId: string,
  blob: Blob
): Promise<string> {
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new StorageError('La firma supera 5 MB')
  }

  const path = firmaPath(routeId, deliveryId)
  const { error } = await supabase.storage
    .from(CUMPLIDOS_BUCKET)
    .upload(path, blob, { contentType: 'image/png', upsert: false })

  if (error) {
    // Ya existe en este path (determinista por entrega) = ya se había subido.
    if (isDuplicateError(error)) return path
    throw new StorageError(`No se pudo subir la firma: ${error.message}`)
  }
  return path
}

/**
 * Genera una URL FIRMADA (temporal) para leer un objeto del bucket privado.
 * Nunca devuelve una URL pública. Requiere permiso SELECT (coordinador/admin).
 * @param path path devuelto por uploadCumplido/uploadFirma.
 * @param expiresInSeconds vigencia; por defecto 1 hora.
 */
export async function getCumplidoUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(CUMPLIDOS_BUCKET)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data?.signedUrl) {
    throw new StorageError(
      `No se pudo generar la URL firmada: ${error?.message ?? 'sin datos'}`
    )
  }
  return data.signedUrl
}
