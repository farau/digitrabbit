/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'fonts.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: 'fonts.gstatic.com',
            },
            {
                protocol: 'https',
                hostname: 'pbs.twimg.com',
            },
            {
                protocol: 'https',
                hostname: 'explorer-api.walletconnect.com',
            },
        ],
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production'
    },
    async headers() {
        // Utiliser une variable booléenne pour désactiver la CSP
        const isDev = process.env.NODE_ENV === 'development';
        console.log('NODE_ENV:', process.env.NODE_ENV, 'isDev:', isDev); // Debug

        // Sources de base avec correction pour le développement
        const baseSources = {
            scriptSrc: isDev
                ? "'self' https://challenges.cloudflare.com 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' http://localhost:* https://localhost:*"
                : "'self' https://challenges.cloudflare.com 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'",
            connectSrc: isDev
                ? "'self' https://auth.privy.io wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://explorer-api.walletconnect.com https://carrot.megaeth.com https://pulse.walletconnect.org https://api.web3modal.org blob: http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*"
                : "'self' https://auth.privy.io https://privy.digitrabbits.com wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://explorer-api.walletconnect.com https://carrot.megaeth.com https://pulse.walletconnect.org https://api.web3modal.org blob:",
            styleSrc: "'self' 'unsafe-inline' https://fonts.googleapis.com",
            fontSrc: "'self' https://fonts.gstatic.com",
            imgSrc: "'self' data: blob: https://pbs.twimg.com https://i.ibb.co https://explorer-api.walletconnect.com"
        };

        console.log('Script sources:', baseSources.scriptSrc); // Debug

        // Construction de la CSP pour le développement (avec report-only)
        const cspValueReport = [
            "default-src 'self'",
            `script-src ${baseSources.scriptSrc}`,
            `style-src ${baseSources.styleSrc}`,
            `img-src ${baseSources.imgSrc}`,
            `font-src ${baseSources.fontSrc}`,
            "object-src 'self' data:",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "child-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org",
            "frame-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com",
            `connect-src ${baseSources.connectSrc}`,
            "worker-src 'self'",
            "manifest-src 'self'",
            "report-uri /api/csp-report"
        ].join("; ");

        // Construction de la CSP pour la production (plus stricte)
        const cspValue = [
            "default-src 'self'",
            `script-src ${baseSources.scriptSrc}`,
            `style-src ${baseSources.styleSrc}`,
            `img-src ${baseSources.imgSrc}`,
            `font-src ${baseSources.fontSrc}`,
            "object-src 'self' data:",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "child-src https://auth.privy.io https://privy.digitrabbits.com https://verify.walletconnect.com https://verify.walletconnect.org",
            "frame-src https://auth.privy.io https://privy.digitrabbits.com https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com",
            `connect-src ${baseSources.connectSrc}`,
            "worker-src 'self'",
            "manifest-src 'self'"
        ].join("; ");

        return [
            {
                source: "/:path*",
                headers: [
                    ...(isDev
                        ? [{
                            key: "Content-Security-Policy",
                            value: cspValueReport,
                        }]
                        : [{
                            key: "Content-Security-Policy",
                            value: cspValue,
                        }]
                    ),
                ],
            },
        ];
    },
}

module.exports = nextConfig