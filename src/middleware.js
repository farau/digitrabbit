import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { cookies } from 'next/headers';

const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    process.env.PRIVY_APP_SECRET
);

export async function middleware(req) {

    const cookieStore = await cookies();
    const isPrivyProtectedRoute = ['/api/users', '/api/validate-wallet'].some(route =>
        req.nextUrl.pathname.startsWith(route)
    );

    // =============== PROTECTION TEST (toutes les routes) ===============
    // Activer en ajoutant TEST_MODE=true dans .env.local
    if (process.env.TEST_MODE === 'true') {
        const testAuth = cookieStore.get('auth')?.value;

        if (testAuth !== 'authenticated' &&
            req.nextUrl.pathname !== '/login' &&
            req.nextUrl.pathname !== '/api/auth') {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        // Si route de login/auth, laisser passer
        if (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/api/auth') {
            return NextResponse.next();
        }
    }

    // =============== PROTECTION PRIVY (routes API spécifiques) ===============
    if (isPrivyProtectedRoute) {
        const accessToken = cookieStore.get('privy-token')?.value;

        if (!accessToken) {
            return new Response('Unauthorized', { status: 401 });
        }

        try {
            await privy.verifyAuthToken(accessToken);
            return NextResponse.next();
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json(
                { error: 'Authentication failed. Invalid or expired token.' },
                { status: 401 }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/users/:path*',
        '/api/validate-wallet',
        '/((?!_next/static|_next/image|manifest.json).*)',
    ],
    matcherExclude: ['/api/csp-report/:path*'],
};