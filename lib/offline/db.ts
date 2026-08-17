// Envoltura mínima de IndexedDB para la cola offline del conductor.
//
// POR QUÉ IndexedDB Y NO localStorage: la cola tiene que guardar la FOTO del
// cumplido, y localStorage sólo guarda strings — meter una imagen en base64
// ahí revienta la cuota (5 MB) con una sola foto. IndexedDB guarda Blobs
// nativos. Y tiene que ser durable de verdad: el conductor puede cerrar la app,
// quedarse sin batería o recargar en mitad de la ruta, y lo capturado no puede
// perderse. Un File en estado de React no sobrevive nada de eso.
//
// POR QUÉ SIN LIBRERÍA: son cuatro operaciones (leer todo, guardar, borrar,
// contar). Una dependencia más en el bundle que carga un celular de gama baja
// por 3G no se paga sola.

const DB_NAME = 'despachr-offline'
const DB_VERSION = 2
export const STORE_PENDIENTES = 'pendientes'
// Store aparte: el snapshot NO puede aparecer en listar() de pendientes, o la
// cola intentaría "enviarlo" como si fuera una operación.
export const STORE_SNAPSHOT = 'snapshot'

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_PENDIENTES)) {
        const store = db.createObjectStore(STORE_PENDIENTES, { keyPath: 'id' })
        // Se procesa en orden de creación: la llegada antes que la salida, o el
        // trigger de la BD derivaría un tiempo en punto sin sentido.
        store.createIndex('creadoEn', 'creadoEn')
      }
      if (!db.objectStoreNames.contains(STORE_SNAPSHOT)) {
        db.createObjectStore(STORE_SNAPSHOT, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('No se pudo abrir IndexedDB'))
  })
}

function promesa<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Operación de IndexedDB falló'))
  })
}

export async function guardar<T extends { id: string }>(registro: T): Promise<void> {
  const db = await abrir()
  try {
    const tx = db.transaction(STORE_PENDIENTES, 'readwrite')
    await promesa(tx.objectStore(STORE_PENDIENTES).put(registro))
  } finally {
    db.close()
  }
}

// Todo lo pendiente, ordenado por creación (el índice ya lo garantiza).
export async function listar<T>(): Promise<T[]> {
  const db = await abrir()
  try {
    const tx = db.transaction(STORE_PENDIENTES, 'readonly')
    return await promesa(tx.objectStore(STORE_PENDIENTES).index('creadoEn').getAll() as IDBRequest<T[]>)
  } finally {
    db.close()
  }
}

export async function borrar(id: string): Promise<void> {
  const db = await abrir()
  try {
    const tx = db.transaction(STORE_PENDIENTES, 'readwrite')
    await promesa(tx.objectStore(STORE_PENDIENTES).delete(id))
  } finally {
    db.close()
  }
}

export async function contar(): Promise<number> {
  const db = await abrir()
  try {
    const tx = db.transaction(STORE_PENDIENTES, 'readonly')
    return await promesa(tx.objectStore(STORE_PENDIENTES).count())
  } finally {
    db.close()
  }
}

// `indexedDB` no existe en SSR ni en navegadores muy viejos. Quien llame decide
// qué hacer: la app sigue funcionando sin cola, sólo que sin resiliencia.
export function hayIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined'
}

// --- Store genérico (snapshot de la ruta) ---------------------------------

export async function guardarEn<T extends { id: string }>(
  store: string,
  registro: T
): Promise<void> {
  const db = await abrir()
  try {
    const tx = db.transaction(store, 'readwrite')
    await promesa(tx.objectStore(store).put(registro))
  } finally {
    db.close()
  }
}

export async function leerDe<T>(store: string, id: string): Promise<T | undefined> {
  const db = await abrir()
  try {
    const tx = db.transaction(store, 'readonly')
    return await promesa(tx.objectStore(store).get(id) as IDBRequest<T | undefined>)
  } finally {
    db.close()
  }
}
