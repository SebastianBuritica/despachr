'use client'

import { useSyncExternalStore } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { RolUsuario, User } from '@/types'

interface UseAuthResult {
  user: SupabaseUser | null
  profile: User | null
  rol: RolUsuario | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
}

// Mapea una fila de public.profiles (snake_case) al modelo de dominio User.
function mapProfile(row: {
  id: string
  email: string | null
  name: string
  role: RolUsuario
  phone: string | null
  created_at: string
  updated_at: string
}): User {
  return {
    id: row.id,
    // email es NULL para usuarios solo-teléfono (OTP SMS); la app no lo usa como identidad.
    email: row.email ?? '',
    name: row.name,
    role: row.role,
    phone: row.phone ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// DECISIÓN: el estado de sesión vive en un store de módulo, no en cada hook.
// Antes cada useAuth() montaba su propio getUser() + select a profiles + su
// propia suscripción a onAuthStateChange. DashboardShell lo llama dos veces y
// DriverApp otras dos, y onAuthStateChange reemite INITIAL_SESSION al
// suscribirse: cada navegación disparaba 4-6 GET idénticos a profiles y la
// identidad volvía a montarse vacía. Ahora hay una sola carga y un solo
// listener, y todos los consumidores leen la misma instantánea.

interface AuthSnapshot {
  user: SupabaseUser | null
  profile: User | null
  loading: boolean
  error: string | null
}

const INITIAL: AuthSnapshot = { user: null, profile: null, loading: true, error: null }

let snapshot: AuthSnapshot = INITIAL
const listeners = new Set<() => void>()
let started = false
// Petición de perfil en vuelo. Guarda la PROMESA, no sólo el id: getUser() y
// INITIAL_SESSION llegan casi a la vez y el segundo tiene que poder esperar la
// carga del primero. Si sólo bloqueara, el segundo retornaría de inmediato y
// loading pasaría a false con el perfil aún sin llegar — que es exactamente el
// parpadeo "Usuario / —" que se veía en el sidebar.
let perfilEnVuelo: { id: string; promesa: Promise<void> } | null = null

function emit(patch: Partial<AuthSnapshot>) {
  snapshot = { ...snapshot, ...patch }
  for (const listener of listeners) listener()
}

function cargarPerfil(authUser: SupabaseUser | null): Promise<void> {
  if (!authUser) {
    perfilEnVuelo = null
    emit({ profile: null })
    return Promise.resolve()
  }
  // Mismo usuario: se comparte la promesa en curso en vez de pedirlo otra vez.
  if (perfilEnVuelo?.id === authUser.id) return perfilEnVuelo.promesa

  const promesa = (async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, phone, created_at, updated_at')
      .eq('id', authUser.id)
      .single()

    if (error) {
      // Se suelta el candado para que un reintento posterior pueda volver a pedirlo.
      perfilEnVuelo = null
      emit({ error: error.message, profile: null })
      return
    }
    emit({ profile: mapProfile(data), error: null })
  })()

  perfilEnVuelo = { id: authUser.id, promesa }
  return promesa
}

function iniciar() {
  if (started) return
  started = true

  supabase.auth
    .getUser()
    .then(async ({ data }) => {
      emit({ user: data.user })
      await cargarPerfil(data.user)
    })
    .catch((err: unknown) => {
      emit({ error: err instanceof Error ? err.message : 'Error de autenticación' })
    })
    .finally(() => emit({ loading: false }))

  supabase.auth.onAuthStateChange((_event, session) => {
    const authUser = session?.user ?? null
    emit({ user: authUser })
    void cargarPerfil(authUser)
  })
}

function subscribe(listener: () => void) {
  iniciar()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Estable entre renders: no recrea la función en cada consumidor.
async function signOut() {
  const { error } = await supabase.auth.signOut()
  // Propaga el fallo para que el llamador no redirija con la sesión aún viva.
  if (error) throw error
  // Limpieza inmediata del estado; onAuthStateChange también disparará.
  perfilEnVuelo = null
  emit({ user: null, profile: null })
}

export function useAuth(): UseAuthResult {
  const estado = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => INITIAL
  )

  return {
    user: estado.user,
    profile: estado.profile,
    rol: estado.profile?.role ?? null,
    loading: estado.loading,
    error: estado.error,
    signOut,
  }
}
