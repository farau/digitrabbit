// app/api/auth/route.js
import { NextResponse } from 'next/server'

const rateLimitMap = new Map()

export async function POST(request) {
    const clientIP = request.headers.get('x-forwarded-for') || '127.0.0.1'

    // Rate limiting par IP
    const now = Date.now()
    const userAttempts = rateLimitMap.get(clientIP) || { count: 0, lastAttempt: now }

    if (userAttempts.count > 5 && now - userAttempts.lastAttempt < 300000) { // 5 min
        return NextResponse.json(
            { message: 'Too many attempts' },
            { status: 429 }
        )
    }

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
        console.log("isvalid?", isValidSHA)
        if (isValidSHA) {
            // Reset rate limit on success
            rateLimitMap.delete(clientIP)

            // Créer session sécurisée
            const response = NextResponse.json({ success: true })
            response.cookies.set('auth_token', 'valid-token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                maxAge: 3600 * 24, //24h
                path: '/'
            })
            return response
        } else {
            // Incrémenter rate limit
            rateLimitMap.set(clientIP, {
                count: userAttempts.count + 1,
                lastAttempt: now
            })

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