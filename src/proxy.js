import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { cookies } from 'next/headers';

const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    process.env.PRIVY_APP_SECRET
);

// Liste des User-Agents de bots à bloquer
const BOT_USER_AGENTS = [
    // Bots Python
    'python-requests',
    'python-urllib',
    'python-httpx',
    'python/3.',
    'python/2.',
    'urllib',
    'requests/',
    'httpx/',
    'aiohttp/',
    'scrapy',
    'beautifulsoup',

    // Bots JavaScript/Node.js
    'node.js',
    'nodejs',
    'axios/',
    'fetch/',
    'undici',
    'node-fetch',
    'puppeteer',
    'playwright',
    'selenium',
    'webdriver',
    'phantom',
    'headless',

    // Autres bots courants
    'curl/',
    'wget',
    'postman',
    'insomnia',
    'httpie',
    'go-http-client',
    'java/',
    'okhttp',
    'apache-httpclient',
    'ruby',
    'php/',
    'perl/',
    'bot',
    'crawler',
    'spider',
    'scraper',
    'automation',
    'test',
    'monitor',
    'check',
    'probe'
];

// User-Agents légitimes à autoriser (même s'ils contiennent des mots suspects)
const ALLOWED_USER_AGENTS = [
    'mozilla/',
    'chrome/',
    'safari/',
    'firefox/',
    'edge/',
    'opera/',
    'webkit'
];

function isBotUserAgent(userAgent) {
    if (!userAgent) return true; // Pas de User-Agent = suspect

    const ua = userAgent.toLowerCase();

    // Si c'est un navigateur légitime, on autorise
    const isLegitimaBrowser = ALLOWED_USER_AGENTS.some(allowed => ua.includes(allowed));
    if (isLegitimaBrowser) return false;

    // Sinon, on vérifie si c'est un bot
    return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

function hasValidBrowserHeaders(req) {
    const headers = req.headers;

    // Vérifications basiques des headers de navigateur
    const hasAccept = headers.get('accept');
    const hasAcceptLanguage = headers.get('accept-language');
    const hasAcceptEncoding = headers.get('accept-encoding');
    const hasUserAgent = headers.get('user-agent');

    // Un vrai navigateur a généralement ces headers
    if (!hasAccept || !hasUserAgent) return false;

    // Vérification de l'header Accept (les navigateurs acceptent HTML)
    const accept = hasAccept.toLowerCase();
    if (!accept.includes('text/html') && !accept.includes('*/*') && !accept.includes('application/json')) {
        return false;
    }

    return true;
}

export async function proxy(req) {
    const cookieStore = await cookies();
    const userAgent = req.headers.get('user-agent') || '';

    // =============== PROTECTION ANTI-BOTS ===============
    if (process.env.ENABLE_BOT_PROTECTION === 'true') {
        // Vérification du User-Agent
        if (isBotUserAgent(userAgent)) {
            return new Response('Access Denied - Automated requests not allowed', {
                status: 403,
                headers: {
                    'Content-Type': 'text/plain',
                    'X-Blocked-Reason': 'Bot User-Agent detected'
                }
            });
        }

        // Vérification des headers de navigateur (pour les routes non-API)
        if (!req.nextUrl.pathname.startsWith('/api/') && !hasValidBrowserHeaders(req)) {
            return new Response('Access Denied - Invalid request headers', {
                status: 403,
                headers: {
                    'Content-Type': 'text/plain',
                    'X-Blocked-Reason': 'Invalid browser headers'
                }
            });
        }

        // Vérification de certains patterns suspects dans l'URL
        const suspiciousPatterns = [
            '/wp-admin',
            '/phpinfo',
            '/.env',
            '/robots.txt',
            '/sitemap.xml',
            '/.well-known',
            '/favicon.ico'
        ];

        // Pour ces patterns, on peut être plus strict
        if (suspiciousPatterns.some(pattern => req.nextUrl.pathname.includes(pattern))) {
            if (isBotUserAgent(userAgent) || !hasValidBrowserHeaders(req)) {
                return new Response('Not Found', { status: 404 });
            }
        }
    }

    const isPrivyProtectedRoute = ['/api/users', '/api/validate-wallet'].some(route =>
        req.nextUrl.pathname.startsWith(route)
    );

    // =============== PROTECTION PRIVY (routes API spécifiques) ===============
    if (isPrivyProtectedRoute) {
        const accessToken = cookieStore.get('privy-token')?.value;

        if (!accessToken) {
            return new Response('Unauthorized', { status: 401 });
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
