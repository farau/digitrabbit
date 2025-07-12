// app/api/auth/route.js
import { NextResponse } from 'next/server'

export async function POST(request) {
    const { password } = await request.json()

    // Votre mot de passe (changez-le !)
    const correctPassword = process.env.TEST_PASSWORD

    if (password === correctPassword) {
        // Créer un cookie d'authentification
        const response = NextResponse.json({ success: true })
        response.cookies.set('auth', 'authenticated', {
            httpOnly: true,
            maxAge: 86400, // 24 heures
            path: '/'
        })
        return response
    } else {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }
}