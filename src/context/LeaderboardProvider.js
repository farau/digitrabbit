// app/context/LeaderboardProvider.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const LeaderboardContext = createContext();

export function useLeaderboardContext() {
    const context = useContext(LeaderboardContext);
    if (!context) {
        throw new Error('useLeaderboardContext must be used within a LeaderboardProvider');
    }
    return context;
}

export default function LeaderboardProvider({ children }) {
    const [leaderboard, setLeaderboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/leaderboard');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setLeaderboard(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();

        // Actualiser toutes les 15 minutes
        const interval = setInterval(fetchLeaderboard, 15 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const value = {
        leaderboard,
        loading,
        error,
        refresh: fetchLeaderboard
    };

    return (
        <LeaderboardContext.Provider value={value}>
            {children}
        </LeaderboardContext.Provider>
    );
}