import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// DECISIÓN: createBrowserClient (@supabase/ssr) guarda la sesión en cookies,
// no en localStorage. Así el middleware (server-side) puede leerla en cada request.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export async function getUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function signOut() {
  await supabase.auth.signOut()
}
