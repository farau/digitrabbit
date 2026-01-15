// hooks/useQuestsStatus.js

import { useState, useEffect } from 'react';

/**
 * Hook pour récupérer le statut des quêtes depuis le smart contract
 * @param {string} playerAddress - L'adresse du joueur
 * @param {Array<string>} questIds - Liste des IDs de quêtes à vérifier
 * @param {string} period - Période ('daily' ou 'weekly')
 * @returns {Object} { claimStatus, cooldowns, periodKey, isLoading, error, refetch }
 */
export function useQuestsStatus(playerAddress, questIds = [], period = 'daily') {
    const [claimStatus, setClaimStatus] = useState({});
    const [cooldowns, setCooldowns] = useState({}); // ✅ Nouveau: stocke les cooldowns
    const [periodKey, setPeriodKey] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [holdings, setHoldings] = useState(null); // Pour daily_hold

    const fetchQuestsStatus = async () => {
        if (!playerAddress || questIds.length === 0) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(
                `/api/quests/claim?playerAddress=${playerAddress}&questIds=${questIds.join(',')}&period=${period}`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // ✅ Utiliser claimStatus et cooldowns de la réponse
                setClaimStatus(data.data.claimStatus || {});
                setCooldowns(data.data.cooldowns || {});
                setPeriodKey(data.data.periodKey);
                setHoldings(data.data.holdings || 0); // Pour daily_hold
            } else {
                throw new Error(data.error || 'Failed to fetch quests status');
            }
        } catch (err) {
            console.error('Error fetching quests status:', err);
            setError(err.message);

            // ✅ Fallback: initialiser tous les quêtes comme unclaimed avec cooldown 0
            const fallbackStatus = questIds.reduce((acc, questId) => {
                acc[questId] = false;
                return acc;
            }, {});
            const fallbackCooldowns = questIds.reduce((acc, questId) => {
                acc[questId] = 0;
                return acc;
            }, {});

            setClaimStatus(fallbackStatus);
            setCooldowns(fallbackCooldowns);
        } finally {
            setIsLoading(false);
        }
    };

    // Re-fetch quand playerAddress, questIds ou period change
    useEffect(() => {
        fetchQuestsStatus();
    }, [playerAddress, questIds.join(','), period]);


    return {
        claimStatus,          // ✅ Map complète: { questId: boolean, ... }
        cooldowns,            // ✅ Nouveau: { questId: secondsRemaining, ... }
        periodKey,            // Clé de période actuelle
        isLoading,
        error,
        refetch: fetchQuestsStatus,
        formatRemainingTime,
        holdings
    };
}

/**
 * Fonction utilitaire pour vérifier si une quête est claim
 * @param {string} questId 
 * @param {Object} claimStatus 
 * @returns {boolean}
 */
export function isQuestClaimed(questId, claimStatus) {
    return claimStatus[questId] === true;
}

/**
 * Fonction utilitaire pour vérifier si une quête peut être claim
 * (= pas encore claim pour cette période ET cooldown écoulé)
 * @param {string} questId 
 * @param {Object} claimStatus 
 * @param {Object} cooldowns
 * @returns {boolean}
 */
export function canClaimQuest(questId, claimStatus, cooldowns = {}) {
    const isClaimed = claimStatus[questId] === true;
    const cooldownRemaining = cooldowns[questId] || 0;
    return !isClaimed && cooldownRemaining <= 0;
}

/**
 * Obtenir le cooldown restant pour une quête
 * @param {string} questId 
 * @param {Object} cooldowns 
 * @returns {number} Secondes restantes
 */
export function getCooldownRemaining(questId, cooldowns) {
    return cooldowns[questId] || 0;
}

/**
 * Vérifier si une quête est en cooldown
 * @param {string} questId 
 * @param {Object} cooldowns 
 * @returns {boolean}
 */
export function isQuestInCooldown(questId, cooldowns) {
    return (cooldowns[questId] || 0) > 0;
}

/**
 * Obtenir toutes les quêtes non-claim
 * @param {Object} claimStatus 
 * @returns {Array<string>}
 */
export function getUnclaimedQuests(claimStatus) {
    return Object.entries(claimStatus)
        .filter(([_, isClaimed]) => !isClaimed)
        .map(([questId, _]) => questId);
}

/**
 * Obtenir toutes les quêtes claim
 * @param {Object} claimStatus 
 * @returns {Array<string>}
 */
export function getClaimedQuests(claimStatus) {
    return Object.entries(claimStatus)
        .filter(([_, isClaimed]) => isClaimed)
        .map(([questId, _]) => questId);
}

/**
 * Obtenir toutes les quêtes prêtes à être claim
 * @param {Object} claimStatus 
 * @param {Object} cooldowns 
 * @returns {Array<string>}
 */
export function getReadyQuests(claimStatus, cooldowns) {
    return Object.entries(claimStatus)
        .filter(([questId, isClaimed]) => !isClaimed && (cooldowns[questId] || 0) <= 0)
        .map(([questId, _]) => questId);
}

/**
 * Formater le temps restant en format lisible
 * @param {number} seconds 
 * @returns {string}
 */
export function formatRemainingTime(seconds) {
    if (seconds <= 0) return 'Ready now';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

/**
 * Hook pour mettre à jour automatiquement les cooldowns chaque seconde
 * @param {Object} cooldowns - Cooldowns initiaux
 * @param {Function} refetch - Fonction pour recharger depuis l'API
 * @returns {Object} Cooldowns mis à jour en temps réel
 */
export function useLiveCooldowns(cooldowns, refetch) {
    const [liveCooldowns, setLiveCooldowns] = useState(cooldowns);

    useEffect(() => {
        setLiveCooldowns(cooldowns);
    }, [cooldowns]);

    useEffect(() => {
        const interval = setInterval(() => {
            setLiveCooldowns(prev => {
                const updated = { ...prev };
                let hasChanges = false;

                Object.keys(updated).forEach(questId => {
                    if (updated[questId] > 0) {
                        updated[questId] = Math.max(0, updated[questId] - 1);
                        hasChanges = true;
                    }
                });

                // Si un cooldown atteint 0, refetch pour mettre à jour le statut
                if (hasChanges && Object.values(updated).some(cd => cd === 0)) {
                    setTimeout(() => refetch(), 100);
                }

                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [refetch]);

    return liveCooldowns;
}