'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useLeaderboard(limit = null, user = null, complete = true) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    // Refs pour gérer les états internes
    const fetchingRef = useRef(false);
    const abortControllerRef = useRef(null);
    const isInitializedRef = useRef(false);

    const fetchLeaderboard = useCallback(async () => {
        // Éviter les appels simultanés
        if (fetchingRef.current) return;

        // Annuler la requête précédente si elle existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        try {
            fetchingRef.current = true;
            abortControllerRef.current = new AbortController();
            setLoading(true);
            setError(null);

            // Construire l'URL avec les paramètres
            let url = '/api/leaderboard';
            const params = new URLSearchParams();

            if (limit) params.append('limit', limit);
            if (user) params.append('user', user);
            if (complete !== undefined) params.append('complete', complete);

            const queryString = params.toString();
            if (queryString) url += `?${queryString}`;

            console.log(`Fetching leaderboard: ${url}`);

            const response = await fetch(url, {
            });

            setLoading(true);

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
            setData(result);
            setRetryCount(0);

            console.log('Leaderboard loaded:', {
                players: result?.topPlayers?.length || result?.leaderboard?.length || 0,
                isComplete: complete
            });

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Fetch aborted');
                return;
            }
            setError(err.message);
            console.error('Leaderboard error:', err);
        } finally {
            fetchingRef.current = false;
            setLoading(false);
        }
    }, [limit, user, complete]);

    // Effect pour le chargement initial
    useEffect(() => {
        console.log('useLeaderboard: Initial mount');
        fetchLeaderboard();
        isInitializedRef.current = true;

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            fetchingRef.current = false;
        };
    }, [fetchLeaderboard]);

    // Fonction de refresh manuel
    const refresh = useCallback(async () => {
        console.log('Manual leaderboard refresh');
        await fetchLeaderboard(true);
    }, [fetchLeaderboard]);

    // Fonction pour retry en cas d'erreur
    const retry = useCallback(async () => {
        console.log('Manual leaderboard retry');
        setError(null);
        setRetryCount(prev => prev + 1);
        await fetchLeaderboard(false);
    }, [fetchLeaderboard]);

    // Données déstructurées avec fallbacks
    const leaderboard = data?.topPlayers || data?.leaderboard || [];
    const metadata = data?.metadata || null;

    // Helper pour obtenir un joueur spécifique
    const getUserData = useCallback((walletAddress) => {
        if (!walletAddress || !leaderboard.length) return null;

        return leaderboard.find(
            player => player.walletAddress?.toLowerCase() === walletAddress.toLowerCase()
        ) || null;
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

        // Informations utiles
        isEmpty: !loading && leaderboard.length === 0,
        hasMore: metadata?.isLimited || false,
        canRetry: !!error && retryCount < 2
    };
}
