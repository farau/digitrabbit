const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        root: __dirname,
    },
    images: {
        unoptimized: true,            // 🔥 Désactive l'optimisation cassée
        disableStaticImages: true,    // 🔥 Bypass le bug dans <Image>
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
            {
                protocol: 'https',
                hostname: '*.alchemy.com',
            },
            {
                protocol: 'https',
                hostname: '*.alchemyapi.io',
            },
            {
                protocol: 'https',
                hostname: 'ipfs.io',
            },
            {
                protocol: 'https',
                hostname: 'gateway.ipfs.io',
            },
        ],
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production'
    },
    async headers() {
        const isDev = process.env.NODE_ENV === 'development';

        // Sources de base avec support Sentry, Vercel et Alchemy CDN
        const baseSources = {
            scriptSrc: isDev
                ? "'self' https://challenges.cloudflare.com https://va.vercel-scripts.com 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' http://localhost:* https://localhost:*"
                : "'self' https://challenges.cloudflare.com https://va.vercel-scripts.com 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'",
            connectSrc: isDev
                ? "'self' https://auth.privy.io wss://*.alchemy.com wss://*.megaeth.com wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://explorer-api.walletconnect.com https://*.megaeth.com https://pulse.walletconnect.org https://api.web3modal.org https://*.ingest.sentry.io https://eth.merkle.io https://*.infura.io https://*.alchemy.com https://*.ankr.com https://*.publicnode.com https://rpc.ankr.com https://cloudflare-eth.com https://eth-mainnet.public.blastapi.io blob: http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*"
                : "'self' https://auth.privy.io https://privy.digitrabbits.com wss://*.alchemy.com wss://*.megaeth.com wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://explorer-api.walletconnect.com https://*.megaeth.com https://pulse.walletconnect.org https://api.web3modal.org https://*.ingest.sentry.io https://vitals.vercel-insights.com https://va.vercel-scripts.com https://eth.merkle.io https://*.infura.io https://*.alchemy.com https://*.ankr.com https://*.publicnode.com https://rpc.ankr.com https://cloudflare-eth.com https://eth-mainnet.public.blastapi.io blob:",
            styleSrc: "'self' 'unsafe-inline' https://fonts.googleapis.com",
            fontSrc: "'self' https://fonts.gstatic.com",
            // 🚀 Ajout des domaines Alchemy CDN et IPFS pour les NFTs
            imgSrc: "'self' data: blob: https://pbs.twimg.com https://i.ibb.co https://explorer-api.walletconnect.com https://*.alchemy.com https://*.alchemyapi.io https://ipfs.io https://gateway.ipfs.io https://*.ipfs.nftstorage.link https://*.ipfs.dweb.link https://cloudflare-ipfs.com https://nftstorage.link"
        };

        // CSP pour le développement
        const cspValueDev = [
            "default-src 'self'",
            `script-src ${baseSources.scriptSrc}`,
            `script-src-elem ${baseSources.scriptSrc}`,
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
            "worker-src 'self' blob:",
            "manifest-src 'self'",
            "report-uri /api/csp-report"
        ].join("; ");

        // CSP pour la production (avec Vercel Speed Insights)
        const cspValueProd = [
            "default-src 'self'",
            `script-src ${baseSources.scriptSrc}`,
            `script-src-elem ${baseSources.scriptSrc}`,
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
                    {
                        key: "Content-Security-Policy",
                        value: isDev ? cspValueDev : cspValueProd,
                    },
                ],
            },
        ];
    },
};

// Configuration Sentry
const sentryWebpackPluginOptions = {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options
    org: "digit-rabbits",
    project: "javascript-nextjs",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    webpack: {
        treeshake: {
            // Automatically tree-shake Sentry logger statements to reduce bundle size
            removeDebugLogging: true,
        },

        // Enables automatic instrumentation of Vercel Cron Monitors.
        // See https://docs.sentry.io/product/crons/
        automaticVercelMonitors: true,
    },
};

// Export avec Sentry
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
