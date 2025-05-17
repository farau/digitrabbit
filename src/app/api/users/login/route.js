import { createClient } from '@/utils/supabase/server' // à adapter

import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXT_PUBLIC_SUPABASE_JWT_SECRET) // définis ce secret dans .env.local

export async function POST(req) {
  const { userAddress } = await req.json()

  if (!userAddress) {
    return new Response(JSON.stringify({ error: 'Missing address' }), { status: 400 })
  }


  // Crée le JWT avec une expiration
  const token = await new SignJWT({ address: userAddress })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(JWT_SECRET)

  const cookiesStore = await cookies();
  // Stocke dans un cookie sécurisé
  cookiesStore.set('sb-access-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60, // 1h
  })

  // Insertion de l'adresse dans la table users
  const supabase = await createClient()
  const { data, error } = await supabase
  .from('users')
  .insert({ userAddress });

  if (error) {
    if (error.code === '23505') {
      // L'utilisateur existe déjà, ce n'est pas une erreur bloquante
      //console.log('Utilisateur déjà présent, on continue.');
    } else {
      console.error('Erreur insertion user:', error);
      return new Response(JSON.stringify({ error: 'Erreur base de données' }), { status: 500 });
    }
  }


  return Response.json({ success: true, address: userAddress })
}

