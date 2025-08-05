// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environnement explicite
  environment: process.env.NODE_ENV || 'development',

  integrations: [
    Sentry.replayIntegration(),
  ],

  // IMPORTANT: Pour capturer TOUTES les erreurs en production
  sampleRate: 1.0, // 100% des erreurs sont capturées

  tracesSampler: (samplingContext) => {
    // Pour les transactions execute_transaction, on veut tout capturer
    if (samplingContext.transactionContext.name.includes("execute") ||
      samplingContext.transactionContext.tags?.action === 'execute_transaction') {
      return 1.0; // 100%
    }

    // En production, réduire les traces de performance mais garder les erreurs
    if (process.env.NODE_ENV === "production") {
      return 0.1; // 10% pour les performances
    }

    return 1.0; // 100% en dev
  },

  // Replay settings
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0, // 100% des replays quand il y a une erreur

  // Configuration pour capturer plus d'informations
  beforeSend(event, hint) {
    // En production, on veut TOUT capturer pour les erreurs de transaction
    if (event.tags?.action === 'execute_transaction') {
      console.log('🔍 Sentry capturing transaction error:', event);
      return event;
    }

    // Pour les autres erreurs, appliquer la logique normale
    return event;
  },

  // Capture plus de contexte
  maxBreadcrumbs: 100,
  attachStacktrace: true,

  // Debug uniquement en dev
  debug: process.env.NODE_ENV === 'development',

  // Filtres pour éviter le spam mais garder les erreurs importantes
  ignoreErrors: [
    // Ignorer les erreurs de réseau communes mais pas critiques
    'NetworkError',
    'Failed to fetch',
    // Ne PAS ignorer les erreurs de transaction
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;