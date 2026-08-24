'use client'

import { useSyncExternalStore } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { crearSesion, SESION_INICIAL } from '@/lib/sesion'
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

// DECISIÓN: una sola sesión por módulo, no una por llamada al hook.
// Antes cada useAuth() montaba su propio getUser() + select a profiles + su
// propia suscripción a onAuthStateChange. DashboardShell lo llama dos veces y
// DriverApp otras dos, y onAuthStateChange reemite INITIAL_SESSION al
// suscribirse: cada navegación disparaba 4-6 GET idénticos a profiles.
// La lógica del store vive en lib/sesion.ts para poder probarla.
const sesion = crearSesion({
  obtenerUsuario: async () => (await supabase.auth.getUser()).data.user,

  obtenerPerfil: async (id) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, phone, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return mapProfile(data)
  },

  alCambiarAuth: (cb) => {
    supabase.auth.onAuthStateChange((_event, session) => cb(session?.user ?? null))
  },

  cerrarSesion: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
})

export function useAuth(): UseAuthResult {
  const estado = useSyncExternalStore(
    sesion.suscribir,
    sesion.instantanea,
    () => SESION_INICIAL
  )

  return {
    user: estado.user,
    profile: estado.profile,
    rol: estado.profile?.role ?? null,
    loading: estado.loading,
    error: estado.error,
    // Estable entre renders: no se recrea en cada consumidor.
    signOut: sesion.cerrarSesion,
  }
}
