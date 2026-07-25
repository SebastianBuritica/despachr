import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// DECISIÓN: fallar RUIDOSAMENTE si falta configuración, en vez de caer a ''.
// Una config faltante en silencio es lo que rompió los Preview de Vercel hace
// semanas (faltaba NEXT_PUBLIC_SUPABASE_URL): la app arrancaba con un cliente
// apuntando a '' y fallaba de formas confusas en runtime. Mejor un error claro
// en el arranque/build.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno de Supabase: NEXT_PUBLIC_SUPABASE_URL y/o ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY. Configúralas en .env.local (y en Vercel: ' +
      'Production, Preview y Development).'
  )
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
