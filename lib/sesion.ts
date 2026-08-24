import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types'

// Store de sesión, separado de React y de Supabase para poder probarlo.
//
// Vive aquí por la misma razón que lib/cumplido.ts: la coordinación entre
// getUser() y onAuthStateChange se rompe EN SILENCIO — pasa lint, pasa build y
// se ve bien, y sólo se nota contando peticiones o mirando el sidebar en el
// momento exacto. Dentro del hook no había forma de provocar el orden de
// llegada que causa el fallo; con dependencias inyectadas sí.

export interface SesionDeps {
  obtenerUsuario: () => Promise<SupabaseUser | null>
  obtenerPerfil: (id: string) => Promise<User>
  alCambiarAuth: (cb: (user: SupabaseUser | null) => void) => void
  cerrarSesion: () => Promise<void>
}

export interface SesionEstado {
  user: SupabaseUser | null
  profile: User | null
  loading: boolean
  error: string | null
}

export const SESION_INICIAL: SesionEstado = {
  user: null,
  profile: null,
  loading: true,
  error: null,
}

function mensajeDe(err: unknown, porDefecto: string): string {
  return err instanceof Error ? err.message : porDefecto
}

export function crearSesion(deps: SesionDeps) {
  let estado: SesionEstado = SESION_INICIAL
  const oyentes = new Set<() => void>()
  let iniciada = false

  // Petición de perfil en vuelo. Guarda la PROMESA, no sólo el id: getUser() e
  // INITIAL_SESSION llegan casi a la vez y el segundo tiene que poder ESPERAR la
  // carga del primero. Un candado que sólo bloquea hace que el segundo retorne
  // de inmediato y que loading pase a false con el perfil aún sin llegar — el
  // parpadeo "Usuario / —" del sidebar.
  let enVuelo: { id: string; promesa: Promise<void> } | null = null

  function emitir(patch: Partial<SesionEstado>) {
    // Referencia nueva en cada cambio: useSyncExternalStore compara por identidad.
    estado = { ...estado, ...patch }
    for (const oyente of oyentes) oyente()
  }

  function cargarPerfil(user: SupabaseUser | null): Promise<void> {
    if (!user) {
      enVuelo = null
      emitir({ profile: null })
      return Promise.resolve()
    }
    if (enVuelo?.id === user.id) return enVuelo.promesa

    const promesa = (async () => {
      try {
        emitir({ profile: await deps.obtenerPerfil(user.id), error: null })
      } catch (err) {
        // Se suelta el candado para que un reintento posterior vuelva a pedirlo.
        enVuelo = null
        emitir({ error: mensajeDe(err, 'No se pudo cargar el perfil'), profile: null })
      }
    })()

    enVuelo = { id: user.id, promesa }
    return promesa
  }

  function iniciar() {
    if (iniciada) return
    iniciada = true

    deps.alCambiarAuth((user) => {
      emitir({ user })
      void cargarPerfil(user)
    })

    deps
      .obtenerUsuario()
      .then(async (user) => {
        emitir({ user })
        // Se espera el perfil ANTES de apagar loading, incluso si otra llamada
        // ya lo pidió: por eso cargarPerfil devuelve la promesa compartida.
        await cargarPerfil(user)
      })
      .catch((err: unknown) => {
        emitir({ error: mensajeDe(err, 'Error de autenticación') })
      })
      .finally(() => emitir({ loading: false }))
  }

  return {
    instantanea: () => estado,
    suscribir(oyente: () => void) {
      iniciar()
      oyentes.add(oyente)
      return () => {
        oyentes.delete(oyente)
      }
    },
    async cerrarSesion() {
      // Propaga el fallo para que el llamador no redirija con la sesión aún viva.
      await deps.cerrarSesion()
      enVuelo = null
      emitir({ user: null, profile: null })
    },
  }
}
