// lib/blockchainHealthConfig.js

export const BLOCKCHAIN_HEALTH_CONFIG = {
    // Configuration des tests de santé
    TEST: {
        POOL_SIZE: 5,                    // Nombre de transactions à tester
        TIMEOUT_MS: 5000,                // Timeout par transaction
        CACHE_DURATION: 5 * 60 * 1000,   // Durée de cache (5 minutes)
    },

    // Seuils de performance (en millisecondes)
    THRESHOLDS: {
        EXCELLENT: 300,        // < 300ms = excellent
        GOOD: 1000,           // 300ms - 1s = bon
        SLIGHTLY_DEGRADED: 3000,  // 1s - 3s = légèrement dégradé
        DEGRADED: 3000        // > 3s = dégradé
    },

    // Configuration du cache local
    STORAGE: {
        KEY: 'blockchain_health_status',
        ENABLED: true
    },

    // Messages d'état
    STATUS_MESSAGES: {
        excellent: 'Excellent performance',
        good: 'Good performance',
        'slightly degraded': 'Slightly degraded performance',
        degraded: 'Degraded performance',
        down: 'Blockchain is currently down'
    },

    // Icônes d'état
    STATUS_ICONS: {
        excellent: '🚀',
        good: '✅',
        'slightly degraded': '⚠️',
        degraded: '🐌',
        down: '❌',
        checking: '⏳'
    },

    // Couleurs d'état pour l'UI
    STATUS_COLORS: {
        excellent: 'green',
        good: 'green',
        'slightly degraded': 'yellow',
        degraded: 'orange',
        down: 'red',
        checking: 'gray'
    }
};

/**
 * Détermine si l'état de la blockchain permet de jouer
 * @param {string} status - Statut de la blockchain
 * @returns {boolean}
 */
export function canPlayWithStatus(status) {
    return ['excellent', 'good', 'slightly degraded'].includes(status);
}

/**
 * Obtient les informations d'affichage pour un statut donné
 * @param {string} status - Statut de la blockchain
 * @param {number} value - Valeur de performance (en secondes)
 * @param {string} error - Message d'erreur éventuel
 * @returns {object}
 */
export function getStatusDisplayInfo(status, value = null, error = null) {
    const config = BLOCKCHAIN_HEALTH_CONFIG;

    if (!status) {
        return {
            isHealthy: null,
            message: 'Checking blockchain status...',
            color: config.STATUS_COLORS.checking,
            icon: config.STATUS_ICONS.checking
        };
    }

    const baseMessage = config.STATUS_MESSAGES[status] || 'Unknown status';
    let message = baseMessage;

    // Ajouter le temps de réponse si disponible
    if (value !== null && status !== 'down') {
        message += ` ~(${value * 1000}ms)`;
    }

    // Utiliser le message d'erreur si disponible
    if (status === 'down' && error) {
        message = error;
    }

    return {
        isHealthy: canPlayWithStatus(status),
        message,
        color: config.STATUS_COLORS[status] || config.STATUS_COLORS.checking,
        icon: config.STATUS_ICONS[status] || config.STATUS_ICONS.checking
    };
}