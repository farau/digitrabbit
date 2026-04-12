import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const RABBITBOT_DAILY_IP_LIMIT = Math.max(Number(process.env.RABBITBOT_DAILY_IP_LIMIT || 25), 1);
const AUTH_IP_ATTEMPTS_LIMIT = Math.max(Number(process.env.AUTH_IP_ATTEMPTS_LIMIT || 6), 1);
const AUTH_IP_WINDOW_SECONDS = Math.max(Number(process.env.AUTH_IP_WINDOW_SECONDS || 300), 1);
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const redis = Redis.fromEnv();
// Rate limiters pour les différentes routes sensibles
const authIpRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(AUTH_IP_ATTEMPTS_LIMIT, `${AUTH_IP_WINDOW_SECONDS} s`),
    analytics: true,
    prefix: '@upstash/ratelimit:auth-ip',
});
const rabbitBotIpRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(RABBITBOT_DAILY_IP_LIMIT, '1 d'),
    analytics: true,
    prefix: '@upstash/ratelimit:rabbitbot-ip',
});

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

function getClientIp(req) {
    const xForwardedFor = req.headers.get('x-forwarded-for');
    if (xForwardedFor) {
        const [firstIp] = xForwardedFor.split(',');
        if (firstIp?.trim()) return firstIp.trim();
    }

    const realIp = req.headers.get('x-real-ip');
    if (realIp?.trim()) return realIp.trim();

    return '127.0.0.1';
}

export async function proxy(req) {
    const cookieStore = await cookies();
    const userAgent = req.headers.get('user-agent') || '';
    const pathname = req.nextUrl.pathname;
    const method = req.method.toUpperCase();
    let rabbitBotRateLimitHeaders = null;

    // =============== RATE LIMIT CENTRALISÉ (IP) ===============

    // cas pour l'authentification du site en BETA (protection contre les attaques de force brute sur le mot de passe)
    if (method === 'POST' && pathname === '/api/auth') {
        const clientIp = getClientIp(req);
        const authRateLimit = await authIpRateLimit.limit(clientIp);

        if (!authRateLimit.success) {
            return NextResponse.json(
                { message: 'Too many attempts' },
                { status: 429 }
            );
        }
    }

    if (method === 'POST' && pathname === '/api/chat/send') {
        let shouldTriggerRabbitBot = false;
        let walletAddress = '';
        try {
            const body = await req.clone().json();
            shouldTriggerRabbitBot = body?.sendToRabbitBot === true;
            const candidateAddress = typeof body?.userAddress === 'string' ? body.userAddress.trim() : '';
            if (ETH_ADDRESS_REGEX.test(candidateAddress)) {
                walletAddress = candidateAddress.toLowerCase();
            }
        } catch (error) {
            // Validation handled below when bot mode is enabled
        }

        if (shouldTriggerRabbitBot) {
            if (!walletAddress) {
                return NextResponse.json(
                    { error: 'Missing or invalid userAddress in request payload' },
                    { status: 400 }
                );
            }

            const userIdentifier = `SEND:${walletAddress}`;
            const chatBotRateLimit = await rabbitBotIpRateLimit.limit(userIdentifier);

            if (!chatBotRateLimit.success) {
                const limitedResponse = NextResponse.json(
                    {
                        error: 'RabbitBot daily limit reached for this user.',
                        limit: chatBotRateLimit.limit,
                        remaining: chatBotRateLimit.remaining,
                        resetAt: chatBotRateLimit.reset
                    },
                    { status: 429 }
                );
                limitedResponse.headers.set('X-RateLimit-Limit', String(chatBotRateLimit.limit));
                limitedResponse.headers.set('X-RateLimit-Remaining', String(chatBotRateLimit.remaining));
                limitedResponse.headers.set('X-RateLimit-Reset', String(chatBotRateLimit.reset));
                return limitedResponse;
            }

            rabbitBotRateLimitHeaders = {
                limit: chatBotRateLimit.limit,
                remaining: chatBotRateLimit.remaining,
                reset: chatBotRateLimit.reset
            };
        }
    }

    if (method === 'POST' && pathname === '/api/chat/bot') {
        let walletAddress = '';
        try {
            const body = await req.clone().json();
            const candidateAddress = typeof body?.userAddress === 'string' ? body.userAddress.trim() : '';
            if (ETH_ADDRESS_REGEX.test(candidateAddress)) {
                walletAddress = candidateAddress.toLowerCase();
            }
        } catch (error) {
            // Validation handled below
        }

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Missing or invalid userAddress in request payload' },
                { status: 400 }
            );
        }

        const userIdentifier = `BOT:${walletAddress}`;
        const chatBotRateLimit = await rabbitBotIpRateLimit.limit(userIdentifier);

        if (!chatBotRateLimit.success) {
            const limitedResponse = NextResponse.json(
                {
                    error: 'RabbitBot daily limit reached for this user.',
                    limit: chatBotRateLimit.limit,
                    remaining: chatBotRateLimit.remaining,
                    resetAt: chatBotRateLimit.reset
                },
                { status: 429 }
            );
            limitedResponse.headers.set('X-RateLimit-Limit', String(chatBotRateLimit.limit));
            limitedResponse.headers.set('X-RateLimit-Remaining', String(chatBotRateLimit.remaining));
            limitedResponse.headers.set('X-RateLimit-Reset', String(chatBotRateLimit.reset));
            return limitedResponse;
        }

        rabbitBotRateLimitHeaders = {
            limit: chatBotRateLimit.limit,
            remaining: chatBotRateLimit.remaining,
            reset: chatBotRateLimit.reset
        };
    }

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
        if (!pathname.startsWith('/api/') && !hasValidBrowserHeaders(req)) {
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
        if (suspiciousPatterns.some(pattern => pathname.includes(pattern))) {
            if (isBotUserAgent(userAgent) || !hasValidBrowserHeaders(req)) {
                return new Response('Not Found', { status: 404 });
            }
        }
    }

    const isPrivyProtectedRoute = ['/api/users/', '/api/users/profile/', '/api/validate-wallet', '/api/chat/', '/api/game',].some(route =>
        pathname.startsWith(route)
    );

    // =============== PROTECTION PRIVY (routes API spécifiques) ===============
    if (isPrivyProtectedRoute) {
        const accessToken = cookieStore.get('privy-token')?.value;

        if (!accessToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

    }

    // =============== PROTECTION TEST (toutes les routes) ===============
    if (process.env.TEST_MODE === 'true') {
        const testAuth = cookieStore.get('auth_token')?.value;
        const isAuthenticated = testAuth === 'valid-token';

        // Si l'utilisateur n'est pas authentifié et n'est pas sur une route publique
        if (!isAuthenticated &&
            pathname !== '/login' &&
            pathname !== '/api/auth') {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        // Si l'utilisateur EST authentifié et essaie d'accéder à /login
        // on le redirige vers / (pour éviter qu'un utilisateur déjà connecté reste sur login)
        if (isAuthenticated && pathname === '/login') {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // Pour /api/auth, on laisse passer sans redirection
        // (cette route gère l'authentification)
    }

    const response = NextResponse.next();
    if (rabbitBotRateLimitHeaders) {
        response.headers.set('X-RateLimit-Limit', String(rabbitBotRateLimitHeaders.limit));
        response.headers.set('X-RateLimit-Remaining', String(rabbitBotRateLimitHeaders.remaining));
        response.headers.set('X-RateLimit-Reset', String(rabbitBotRateLimitHeaders.reset));
    }

    return response;
}

export const config = {
    matcher: [
        '/api/users/:path*',
        '/api/validate-wallet',
        '/((?!_next/static|_next/image|favicon.ico|manifest.json).*)'
    ],
    matcherExclude: ['/api/csp-report/:path*'],
};
