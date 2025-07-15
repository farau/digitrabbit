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
    if (process.env.TEST_MODE === 'true') {
        // Vérifier le token d'authentification
        const authToken = req.cookies.get('auth_token');

        // Si l'utilisateur est authentifié et va sur /login, rediriger vers /
        if (req.nextUrl.pathname === '/login' && authToken && authToken.value === 'valid-token') {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // Routes à exclure de la protection
        const excludedRoutes = ['/login', '/api/auth'];

        if (excludedRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
            return NextResponse.next();
        }

        // Si pas de token, rediriger vers login
        if (!authToken || authToken.value !== 'valid-token') {
            return NextResponse.redirect(new URL('/login', req.url));
        }
    } else {
        // =============== MODE PRODUCTION (TEST_MODE = false) ===============
        // Rediriger /login vers / quand TEST_MODE est false
        if (req.nextUrl.pathname === '/login') {
            return NextResponse.redirect(new URL('/', req.url));
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
        '/api/auth',
        '/((?!_next/static|_next/image|favicon.ico).*)', // Supprimé |login pour permettre la redirection
    ],
    matcherExclude: ['/api/csp-report/:path*'],
};