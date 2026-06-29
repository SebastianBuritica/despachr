'use client'

import { useCallback, useEffect, useState } from 'react'
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
  email: string
  name: string
  role: RolUsuario
  phone: string | null
  created_at: string
  updated_at: string
}): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    phone: row.phone ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async (authUser: SupabaseUser | null) => {
    if (!authUser) {
      setProfile(null)
      return
    }
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, role, phone, created_at, updated_at')
      .eq('id', authUser.id)
      .single()

    if (profileError) {
      setError(profileError.message)
      setProfile(null)
      return
    }
    setProfile(mapProfile(data))
  }, [])

  useEffect(() => {
    let active = true

    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!active) return
        setUser(data.user)
        await loadProfile(data.user)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Error de autenticación')
      } finally {
        if (active) setLoading(false)
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null)
    })

    return () => {
      active = false
      subscription?.unsubscribe()
    }
  }, [loadProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    // Limpieza inmediata del estado; onAuthStateChange también disparará.
    setUser(null)
    setProfile(null)
  }, [])

  return { user, profile, rol: profile?.role ?? null, loading, error, signOut }
}
