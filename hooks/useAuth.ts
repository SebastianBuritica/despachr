'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (data.user) {
          // TODO: Fetch user profile from database
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || '',
            role: 'conductor',
            phone: data.user.user_metadata?.phone || '',
            createdAt: data.user.created_at || '',
            updatedAt: data.user.updated_at || '',
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de autenticación')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || '',
          role: 'conductor',
          phone: session.user.user_metadata?.phone || '',
          createdAt: session.user.created_at || '',
          updatedAt: session.user.updated_at || '',
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return { user, loading, error }
}
