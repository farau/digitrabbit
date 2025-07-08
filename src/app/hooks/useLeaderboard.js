import { useState, useEffect, useCallback } from 'react';

export function useLeaderboard(limit = null, user = null) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLeaderboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let url = '/api/leaderboard';
            const params = new URLSearchParams();

            if (limit) params.append('limit', limit);
            if (user) params.append('user', user);

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Erreur lors du chargement du leaderboard (${response.status})`);
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
            console.error('Erreur leaderboard:', err);
        } finally {
            setLoading(false);
        }
    }, [limit, user]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const refresh = useCallback(async () => {
        await fetchLeaderboard();
    }, [fetchLeaderboard]);

    return {
        data,
        loading,
        error,
        refresh,
        // Exposer les données déstructurées pour plus de simplicité
        leaderboard: data?.topPlayers || [],
        metadata: data?.metadata || null
    };
}