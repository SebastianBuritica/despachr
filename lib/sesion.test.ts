import { describe, expect, it, vi } from 'vitest'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { crearSesion, type SesionDeps } from '@/lib/sesion'
import type { User } from '@/types'

// El SupabaseUser real no importa: lo único que el store mira es el id.
const USUARIO = { id: 'u-1' } as unknown as SupabaseUser
const OTRO = { id: 'u-2' } as unknown as SupabaseUser

function perfil(id = 'u-1'): User {
  return {
    id,
    email: 'admin@despachr.test',
    name: 'Carlos Admin',
    role: 'admin',
    phone: '',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
}

// Promesa que la prueba resuelve cuando quiere: así se provoca a mano el orden
// de llegada entre getUser() e INITIAL_SESSION, que es donde estaba el fallo.
function diferido<T>() {
  let resolver!: (v: T) => void
  let rechazar!: (e: unknown) => void
  const promesa = new Promise<T>((res, rej) => {
    resolver = res
    rechazar = rej
  })
  return { promesa, resolver, rechazar }
}

function deps(over: Partial<SesionDeps> = {}) {
  let emitirAuth: (u: SupabaseUser | null) => void = () => {}
  const base: SesionDeps = {
    obtenerUsuario: vi.fn(async () => USUARIO),
    obtenerPerfil: vi.fn(async (id: string) => perfil(id)),
    alCambiarAuth: (cb) => {
      emitirAuth = cb
    },
    cerrarSesion: vi.fn(async () => {}),
    ...over,
  }
  return { deps: base, emitirAuth: (u: SupabaseUser | null) => emitirAuth(u) }
}

// Deja correr las microtareas pendientes sin depender de temporizadores.
const vaciarCola = () => new Promise((r) => setImmediate(r))

describe('crearSesion', () => {
  it('pide el perfil UNA sola vez aunque getUser e INITIAL_SESSION lleguen juntos', async () => {
    const { deps: d, emitirAuth } = deps()
    const sesion = crearSesion(d)
    sesion.suscribir(() => {})

    emitirAuth(USUARIO)
    await vaciarCola()

    expect(d.obtenerPerfil).toHaveBeenCalledTimes(1)
    expect(sesion.instantanea().profile?.name).toBe('Carlos Admin')
  })

  it('no apaga loading hasta que el perfil llegó, aunque otro llamador ya lo hubiera pedido', async () => {
    // Este es el fallo real: con un candado que sólo bloquea (guardando el id en
    // vez de la promesa), getUser retornaba de inmediato al ver el candado
    // puesto por INITIAL_SESSION y loading pasaba a false con profile en null.
    // El sidebar apagaba el esqueleto y mostraba "Usuario / —".
    const perfilDiferido = diferido<User>()
    const { deps: d, emitirAuth } = deps({
      obtenerPerfil: vi.fn(() => perfilDiferido.promesa),
    })
    const sesion = crearSesion(d)
    sesion.suscribir(() => {})

    // INITIAL_SESSION se adelanta y arranca la carga del perfil.
    emitirAuth(USUARIO)
    await vaciarCola()

    expect(sesion.instantanea().loading).toBe(true)
    expect(sesion.instantanea().profile).toBeNull()

    perfilDiferido.resolver(perfil())
    await vaciarCola()

    const estado = sesion.instantanea()
    expect(estado.loading).toBe(false)
    // Nunca debe existir el instante loading:false + profile:null.
    expect(estado.profile?.name).toBe('Carlos Admin')
    expect(d.obtenerPerfil).toHaveBeenCalledTimes(1)
  })

  it('vuelve a pedir el perfil si el intento anterior falló', async () => {
    const obtenerPerfil = vi
      .fn<(id: string) => Promise<User>>()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(perfil())
    const { deps: d, emitirAuth } = deps({ obtenerUsuario: async () => null, obtenerPerfil })
    const sesion = crearSesion(d)
    sesion.suscribir(() => {})
    await vaciarCola()

    emitirAuth(USUARIO)
    await vaciarCola()
    expect(sesion.instantanea().error).toBe('network')
    expect(sesion.instantanea().profile).toBeNull()

    // Sin soltar el candado, este segundo intento no volvería a pedirlo nunca.
    emitirAuth(USUARIO)
    await vaciarCola()
    expect(obtenerPerfil).toHaveBeenCalledTimes(2)
    expect(sesion.instantanea().profile?.name).toBe('Carlos Admin')
    expect(sesion.instantanea().error).toBeNull()
  })

  it('pide el perfil de nuevo cuando cambia el usuario', async () => {
    const { deps: d, emitirAuth } = deps()
    const sesion = crearSesion(d)
    sesion.suscribir(() => {})
    await vaciarCola()

    emitirAuth(OTRO)
    await vaciarCola()

    expect(d.obtenerPerfil).toHaveBeenCalledTimes(2)
    expect(sesion.instantanea().profile?.id).toBe('u-2')
  })

  it('arranca una sola vez aunque se suscriban varios consumidores', async () => {
    const { deps: d } = deps()
    const sesion = crearSesion(d)
    sesion.suscribir(() => {})
    sesion.suscribir(() => {})
    sesion.suscribir(() => {})
    await vaciarCola()

    expect(d.obtenerUsuario).toHaveBeenCalledTimes(1)
    expect(d.obtenerPerfil).toHaveBeenCalledTimes(1)
  })

  it('notifica a todos los suscriptores con una instantánea nueva', async () => {
    const { deps: d } = deps()
    const sesion = crearSesion(d)
    const vistas: unknown[] = []
    sesion.suscribir(() => vistas.push(sesion.instantanea()))
    await vaciarCola()

    expect(vistas.length).toBeGreaterThan(0)
    // Identidad nueva en cada cambio: useSyncExternalStore compara por referencia.
    expect(new Set(vistas).size).toBe(vistas.length)
  })

  it('limpia usuario y perfil al cerrar sesión', async () => {
    const { deps: d } = deps()
    const sesion = crearSesion(d)
    sesion.suscribir(() => {})
    await vaciarCola()
    expect(sesion.instantanea().profile).not.toBeNull()

    await sesion.cerrarSesion()

    expect(sesion.instantanea().user).toBeNull()
    expect(sesion.instantanea().profile).toBeNull()
  })

  it('NO limpia el estado si cerrar sesión falla', async () => {
    // Si se limpiara igual, la UI redirigiría a /login con la sesión aún viva.
    const { deps: d } = deps({
      cerrarSesion: vi.fn(async () => {
        throw new Error('sin red')
      }),
    })
    const sesion = crearSesion(d)
    sesion.suscribir(() => {})
    await vaciarCola()

    await expect(sesion.cerrarSesion()).rejects.toThrow('sin red')
    expect(sesion.instantanea().profile?.name).toBe('Carlos Admin')
  })

  it('deja de notificar a un consumidor que se desuscribió', async () => {
    const { deps: d, emitirAuth } = deps()
    const sesion = crearSesion(d)
    const oyente = vi.fn()
    const cancelar = sesion.suscribir(oyente)
    await vaciarCola()

    cancelar()
    const antes = oyente.mock.calls.length
    emitirAuth(OTRO)
    await vaciarCola()

    expect(oyente).toHaveBeenCalledTimes(antes)
  })
})
