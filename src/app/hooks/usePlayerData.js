import { useState, useEffect, useCallback } from 'react';
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, publicClient, NUM_SLOTS } from '@/utils/constants.js';

export function usePlayerData(embeddedWallet, refreshCounter) {
    const [playerData, setPlayerData] = useState({
        rabbitPoints: 0,
        totalClicks: 0,
        gameClicks: 0,
        playerItems: Array(NUM_SLOTS).fill(0),
        sessionEndsAt: null,
        boost: 0,
        streak: 0,
        hasClaimedPoints: false,
        totalClicksGame: 0
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errorPlayerData, setErrorPlayerData] = useState(null);
    const [seasonId, setSeasonId] = useState(null);
    const [totalClicksGame, setTotalClicksGame] = useState(null);

    // Fonction pour récupérer la saison courante
    const fetchSeasonId = useCallback(async () => {
        try {
            const season = await publicClient.readContract({
                address: DIGIT_RABBITS_ADDRESS,
                abi: DIGIT_RABBITS_ABI,
                functionName: 'currentSeasonId',
            });
            const currentSeasonId = Number(season);
            setSeasonId(currentSeasonId);
            return currentSeasonId;
        } catch (err) {
            console.error("Error fetching season ID:", err);
            setErrorPlayerData(err);
            return null;
        }
    }, []);

    // Fonction pour récupérer le total des clicks toutes saisons confondues
    const fetchTotalClicksGame = useCallback(async () => {
        try {
            const transac = await publicClient.readContract({
                address: DIGIT_RABBITS_ADDRESS,
                abi: DIGIT_RABBITS_ABI,
                functionName: 'totalClicksGame',
            });
            const totalClicksGame = Number(transac);
            setTotalClicksGame(totalClicksGame);
            return totalClicksGame;
        } catch (err) {
            console.error("Error fetching total clicks :", err);
            setErrorPlayerData(err);
            return null;
        }
    }, []);

    // Fonction pour rafraîchir les données
    const refreshPlayerData = useCallback(async () => {
        if (!embeddedWallet?.address) {
            return;
        }

        setIsLoading(true);
        setErrorPlayerData(null);

        try {
            // Récupérer la saison courante si on ne l'a pas encore
            let currentSeasonId = seasonId;
            if (currentSeasonId === null) {
                currentSeasonId = await fetchSeasonId();
                if (currentSeasonId === null) return;
            }

            // Mettre à jour le nombre de clics totaux toutes saisons confondues
            const currentTotalClicksGame = await fetchTotalClicksGame();
            setTotalClicksGame(currentTotalClicksGame)

            console.log("📥 Fetching player data for", embeddedWallet.address, "Season:", currentSeasonId);

            const result = await publicClient.readContract({
                address: DIGIT_RABBITS_ADDRESS,
                abi: DIGIT_RABBITS_ABI,
                functionName: 'getPlayerData',
                args: [embeddedWallet.address, currentSeasonId],
            });

            const rabbitPoints = result[0] !== undefined ? Number(result[0]) / 1_000_000 : -1;
            const [totalClicks, gameClicks, playerItems, sessionEndsAt, boost, streak, hasClaimedPoints] = result.slice(1);

            const data = {
                rabbitPoints,
                totalClicks,
                gameClicks,
                playerItems,
                sessionEndsAt,
                boost,
                streak,
                hasClaimedPoints,
                totalClicksGame: currentTotalClicksGame
            };

            setPlayerData(data);
        } catch (err) {
            console.error("Error fetching player data:", err);
            setErrorPlayerData(err);
        } finally {
            setIsLoading(false);
        }
    }, [embeddedWallet?.address, seasonId, fetchSeasonId, fetchTotalClicksGame]);

    // Effect pour récupérer la saison au montage
    useEffect(() => {
        if (embeddedWallet?.address && seasonId === null) {
            fetchSeasonId();
        }
    }, [embeddedWallet?.address, seasonId, fetchSeasonId]);

    // Effect pour charger les données au montage et lors des refreshs
    useEffect(() => {
        refreshPlayerData();
    }, [refreshPlayerData, refreshCounter]);

    return {
        playerData,
        seasonId,
        totalClicksGame,
        isLoading,
        errorPlayerData,
        refreshPlayerData
    };
}