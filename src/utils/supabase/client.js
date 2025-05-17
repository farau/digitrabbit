import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const token = getJwtFromCookie()
  if (token) {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )
  }
  // If no token is found, create a client without the token
  // This is useful for public data or unauthenticated requests
  // You can also use the `createServerClient` function to create a client
  // that can be used in server-side code
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
}

function getJwtFromCookie() {
  if (typeof document === 'undefined') return null

  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith('sb-access-token='))

  return match?.split('=')[1] || null
}