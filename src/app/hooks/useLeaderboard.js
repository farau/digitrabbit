import { useState, useEffect, useCallback, useRef } from 'react';

export function useLeaderboard(limit = null, user = null, complete = true) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    // Ref pour éviter les appels multiples simultanés
    const fetchingRef = useRef(false);
    const abortControllerRef = useRef(null);
    const retryTimeoutRef = useRef(null);

    const fetchLeaderboard = useCallback(async (forceRefresh = false) => {
        // Éviter les appels multiples simultanés
        if (fetchingRef.current) {
            console.log('Fetch already in progress, cancelling');
            return;
        }

        try {
            fetchingRef.current = true;
            setLoading(true);
            setError(null);

            // Annuler la requête précédente si elle existe
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Nouveau controller pour cette requête
            abortControllerRef.current = new AbortController();

            let url = '/api/leaderboard';
            const params = new URLSearchParams();

            if (limit) params.append('limit', limit);
            if (user) params.append('user', user);
            if (complete !== undefined) params.append('complete', complete);
            if (forceRefresh) params.append('forceRefresh', 'true');

            if (params.toString()) {
                url += '?' + params.toString();
            }

            console.log(`Fetching leaderboard: ${url}`);

            const response = await fetch(url, {
                signal: abortControllerRef.current.signal,
                headers: {
                    'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=300'
                }
            });

            if (!response.ok) {
                if (response.status === 504) {
                    throw new Error('Server is taking too long to respond. Please try again in a moment.');
                } else if (response.status === 503) {
                    throw new Error('Service temporarily unavailable. Please try again later.');
                } else if (response.status >= 500) {
                    throw new Error(`Server error (${response.status}). Please try again later.`);
                } else {
                    throw new Error(`Error loading leaderboard (${response.status})`);
                }
            }

            const result = await response.json();

            if (!result || typeof result !== 'object') {
                throw new Error('Invalid data format received from server');
            }

            setData(result);
            setRetryCount(0); // Reset retry count en cas de succès

            console.log('Leaderboard loaded successfully:', {
                topPlayers: result.topPlayers?.length || result.leaderboard?.length || 0,
                hasItemsData: result.topPlayers?.some(p => p.itemsBought?.count > 0) || false,
                metadata: result.metadata
            });

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Request cancelled');
                return;
            }

            console.error('Leaderboard error:', err);
            setError(err.message);

            // En cas d'erreur, ne pas faire de retry automatique dans ce callback
            // Le retry sera géré manuellement

        } finally {
            fetchingRef.current = false;
            setLoading(false);
        }
    }, [limit, user, complete]); // RETIRÉ data et retryCount des dépendances

    // Effect séparé pour le retry automatique
    useEffect(() => {
        if (error && retryCount < 2 && !data) {
            console.log(`Retry attempt ${retryCount + 1}/2 in 3 seconds...`);

            retryTimeoutRef.current = setTimeout(() => {
                if (!fetchingRef.current) {
                    setRetryCount(prev => prev + 1);
                    fetchLeaderboard(false);
                }
            }, 3000);
        }

        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, [error, retryCount, data, fetchLeaderboard]);

    // Effect principal pour charger les données - UNE SEULE FOIS au montage
    useEffect(() => {
        console.log('useLeaderboard: Initial mount');
        fetchLeaderboard();

        // Cleanup à la destruction du composant
        return () => {
            console.log('useLeaderboard: Cleanup');
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            fetchingRef.current = false;
        };
    }, []); // DÉPENDANCES VIDES - ne s'exécute qu'au montage

    // Effect séparé pour les changements de paramètres
    useEffect(() => {
        console.log('useLeaderboard: Parameters changed', { limit, user, complete });
        if (data !== null) { // Ne refetch que si on a déjà des données
            fetchLeaderboard();
        }
    }, [limit, user, complete, fetchLeaderboard]);

    // Fonction de refresh manuel
    const refresh = useCallback(async () => {
        console.log('Manual leaderboard refresh');
        setRetryCount(0);
        await fetchLeaderboard(true);
    }, [fetchLeaderboard]);

    // Fonction pour retry en cas d'erreur
    const retry = useCallback(async () => {
        console.log('Manual leaderboard retry');
        setError(null);
        setRetryCount(0);
        await fetchLeaderboard(false);
    }, [fetchLeaderboard]);

    // Données déstructurées avec fallbacks
    const leaderboard = data?.topPlayers || data?.leaderboard || [];
    const metadata = data?.metadata || null;

    // Helper pour obtenir un joueur spécifique
    const getUserData = useCallback((walletAddress) => {
        if (!walletAddress || !leaderboard.length) return null;

        return leaderboard.find(
            player => player.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        ) || null;
    }, [leaderboard]);

    // Helper pour obtenir le top N
    const getTopN = useCallback((n) => {
        return leaderboard.slice(0, n);
    }, [leaderboard]);

    // Helper pour obtenir les top acheteurs d'items
    const getTopItemBuyers = useCallback((n = 10) => {
        return leaderboard
            .filter(player => player.itemsBought?.count > 0)
            .sort((a, b) => (b.itemsBought?.count || 0) - (a.itemsBought?.count || 0))
            .slice(0, n);
    }, [leaderboard]);

    // Helper pour obtenir les stats d'items
    const getItemsStats = useCallback(() => {
        if (!leaderboard.length) return null;

        const playersWithItems = leaderboard.filter(p => p.itemsBought?.count > 0);
        const totalItems = leaderboard.reduce((sum, p) => sum + (p.itemsBought?.count || 0), 0);

        // Comptage des items par ID
        const itemsCountById = {};
        leaderboard.forEach(player => {
            if (player.itemsBought?.items) {
                player.itemsBought.items.forEach(itemId => {
                    itemsCountById[itemId] = (itemsCountById[itemId] || 0) + 1;
                });
            }
        });

        // Items les plus populaires
        const popularItems = Object.entries(itemsCountById)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([itemId, count]) => ({ itemId, count }));

        return {
            totalItems,
            playersWithItems: playersWithItems.length,
            averageItemsPerPlayer: leaderboard.length > 0 ? totalItems / leaderboard.length : 0,
            averageItemsPerBuyer: playersWithItems.length > 0 ? totalItems / playersWithItems.length : 0,
            popularItems,
            uniqueItems: Object.keys(itemsCountById).length
        };
    }, [leaderboard]);

    // Stats dérivées
    const stats = {
        totalPlayers: metadata?.totalPlayers || leaderboard.length,
        isLimited: metadata?.isLimited || false,
        processingTime: metadata?.processingTimeMs || 0,
        lastUpdate: metadata?.lastUpdate || null,
        hasError: !!error,
        hasData: leaderboard.length > 0,
        isComplete: complete,
        seasonId: metadata?.seasonId || metadata?.currentSeasonId || '0',
        topScore: metadata?.topScore || leaderboard[0]?.score || 0,
        source: metadata?.source || 'api',
        totalItemsBought: metadata?.totalItemsBought || 0,
        hasItemsData: leaderboard.some(p => p.itemsBought?.count > 0)
    };

    return {
        // Données principales
        data,
        leaderboard,
        metadata,
        stats,

        // États
        loading,
        error,

        // Actions
        refresh,
        retry,

        // Helpers
        getUserData,
        getTopN,
        getTopItemBuyers,
        getItemsStats,

        // Informations utiles
        isEmpty: !loading && leaderboard.length === 0,
        hasMore: metadata?.isLimited || false,
        canRetry: !!error && retryCount < 2
    };
}


// Hook pour un utilisateur spécifique
export function useUserRank(walletAddress) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchingRef = useRef(false);

    const fetchUserRank = useCallback(async () => {
        if (!walletAddress) {
            setLoading(false);
            return;
        }

        if (fetchingRef.current) return;

        try {
            fetchingRef.current = true;
            setLoading(true);
            setError(null);

            console.log(`Fetching user rank: ${walletAddress}`);
            const response = await fetch(`/api/leaderboard/user/${walletAddress}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setUserData(null);
                    return;
                }
                if (response.status === 504) {
                    throw new Error('Server is taking too long to respond. Please try again in a moment.');
                } else if (response.status === 503) {
                    throw new Error('Service temporarily unavailable. Please try again later.');
                } else if (response.status >= 500) {
                    throw new Error(`Server error (${response.status}). Please try again later.`);
                } else {
                    throw new Error(`Error loading user rank (${response.status})`);
                }
            }

            const result = await response.json();
            setUserData(result);

            console.log('User rank loaded:', {
                found: !!result,
                hasItemsData: result?.itemsBought?.count > 0
            });

        } catch (err) {
            setError(err.message);
            console.error('User rank error:', err);
        } finally {
            fetchingRef.current = false;
            setLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        console.log('useUserRank: Wallet address changed', walletAddress);
        fetchUserRank();
    }, [fetchUserRank]);

    const refresh = useCallback(async () => {
        await fetchUserRank();
    }, [fetchUserRank]);

    return {
        user: userData,
        rank: userData?.rank || null,
        loading,
        error,
        refresh,
        found: !!userData,
        hasItemsData: !!userData?.itemsBought?.count
    };
}

// Hook spécialisé pour les stats d'items
export function useItemsStats() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchingRef = useRef(false);

    const fetchItemsStats = useCallback(async (forceRefresh = false) => {
        if (fetchingRef.current) return;

        try {
            fetchingRef.current = true;
            setLoading(true);
            setError(null);

            let url = '/api/leaderboard/items-stats';
            if (forceRefresh) {
                url += '?forceRefresh=true';
            }

            console.log(`Fetching items stats: ${url}`);
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 504) {
                    throw new Error('Server is taking too long to respond. Please try again in a moment.');
                } else if (response.status === 503) {
                    throw new Error('Service temporarily unavailable. Please try again later.');
                } else if (response.status >= 500) {
                    throw new Error(`Server error (${response.status}). Please try again later.`);
                } else {
                    throw new Error(`Error loading items stats (${response.status})`);
                }
            }

            const result = await response.json();
            setData(result);

        } catch (err) {
            setError(err.message);
            console.error('Items stats error:', err);
        } finally {
            fetchingRef.current = false;
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        console.log('useItemsStats: Initial mount');
        fetchItemsStats();
    }, []);

    const refresh = useCallback(async () => {
        await fetchItemsStats(true);
    }, [fetchItemsStats]);

    return {
        stats: data,
        loading,
        error,
        refresh,
        hasData: !!data
    };
}

// Note: useTopItemBuyers hook removed - use getTopItemBuyers helper from useLeaderboard instead
// Example: const { getTopItemBuyers } = useLeaderboard(); const topBuyers = getTopItemBuyers(10);