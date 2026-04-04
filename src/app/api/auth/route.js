// app/api/auth/route.js
import { NextResponse } from 'next/server'

export async function POST(request) {
    const now = Date.now()

    try {
        const { password, timestamp } = await request.json()

        // Vérifier que la requête n'est pas trop ancienne (protection replay)
        if (now - timestamp > 300000) { // 5 min
            return NextResponse.json(
                { message: 'Request expired' },
                { status: 401 }
            )
        }
        // Comparer avec le hash stocké de manière sécurisée
        const isValidSHA = password === process.env.PASSWORD_HASH
        if (isValidSHA) {
            // Créer session sécurisée
            const response = NextResponse.json({ success: true })
            response.cookies.set('auth_token', 'valid-token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                maxAge: 3600 * 24 * 7, //7 days
                path: '/'
            })
            return response
        } else {
            return NextResponse.json(
                { message: 'Authentication failed' },
                { status: 401 }
            )
        }
    } catch (error) {
        return NextResponse.json(
            { message: 'Server error' },
            { status: 500 }
        )
    }
}
