const { withSentryConfig } = require("@sentry/nextjs");

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
        const isDev = process.env.NODE_ENV === 'development';
        console.log('NODE_ENV:', process.env.NODE_ENV, 'isDev:', isDev);

        // Sources de base avec support Sentry
        const baseSources = {
            scriptSrc: isDev
                ? "'self' https://challenges.cloudflare.com 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' http://localhost:* https://localhost:*"
                : "'self' https://challenges.cloudflare.com 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'",
            connectSrc: isDev
                ? "'self' https://auth.privy.io wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://explorer-api.walletconnect.com https://carrot.megaeth.com https://pulse.walletconnect.org https://api.web3modal.org https://*.ingest.sentry.io blob: http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*"
                : "'self' https://auth.privy.io https://privy.digitrabbits.com wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://explorer-api.walletconnect.com https://carrot.megaeth.com https://pulse.walletconnect.org https://api.web3modal.org https://*.ingest.sentry.io blob:",
            styleSrc: "'self' 'unsafe-inline' https://fonts.googleapis.com",
            fontSrc: "'self' https://fonts.gstatic.com",
            imgSrc: "'self' data: blob: https://pbs.twimg.com https://i.ibb.co https://explorer-api.walletconnect.com"
        };

        console.log('Script sources:', baseSources.scriptSrc);

        // CSP pour le développement
        const cspValueDev = [
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

        // CSP pour la production
        const cspValueProd = [
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

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
};

// Export avec Sentry
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);