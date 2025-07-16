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

    // =============== PROTECTION TEST (toutes les routes) ===============
    if (process.env.TEST_MODE === 'true') {
        const testAuth = cookieStore.get('auth_token')?.value;
        const isAuthenticated = testAuth === 'valid-token';

        // Si l'utilisateur n'est pas authentifié et n'est pas sur une route publique
        if (!isAuthenticated &&
            req.nextUrl.pathname !== '/login' &&
            req.nextUrl.pathname !== '/api/auth') {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        // Si l'utilisateur EST authentifié et essaie d'accéder à /login
        // on le redirige vers / (pour éviter qu'un utilisateur déjà connecté reste sur login)
        if (isAuthenticated && req.nextUrl.pathname === '/login') {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // Pour /api/auth, on laisse passer sans redirection
        // (cette route gère l'authentification)
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/users/:path*',
        '/api/validate-wallet',
        '/((?!_next/static|_next/image|favicon.ico|manifest.json).*)'
    ],
    matcherExclude: ['/api/csp-report/:path*'],
};