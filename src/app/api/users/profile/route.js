import { createClient } from '@/utils/supabase/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXT_PUBLIC_SUPABASE_JWT_SECRET)

export async function POST(req) {
  
  // Récupération du cookie
  const cookiesStore = await cookies()
  const token = cookiesStore.get('sb-access-token')

  if (!token) {
    return new Response(JSON.stringify({ error: 'Connect your wallet to display your profile.' }), { status: 401 })
  }


  try {
    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    const userAddress = payload.address

    if (!userAddress) {
      return new Response(JSON.stringify({ error: 'Connect your wallet to display your profile.' }), { status: 401 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('userAddress', userAddress)  // ou selon ta logique
    .limit(1)  // éviter d’avoir plusieurs
    .single()  // supabase permet d’obtenir un seul objet au lieu d’un tableau
  

    if (error) {
      console.error('Error retrieving user:', error)
      return new Response(JSON.stringify({ error: 'Database error.' }), { status: 500 })
    }

    return Response.json({ profile: data })
  } catch (err) {
    console.error('Erreur JWT:', err)
    return new Response(JSON.stringify({ error: 'JWT not valid or expired, please reconnect your wallet.' }), { status: 401 })
  }
}
