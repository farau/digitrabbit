// app/api/leaderboard/route.js
import { getUserRank, getTopPlayers, getLeaderboard, getCompleteLeaderboardData } from "@/lib/leaderboard";
import { NextResponse } from 'next/server';

export async function GET(request) {
    const startTime = Date.now();

    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit');
        const user = searchParams.get('user');
        const complete = searchParams.get('complete');
        const forceRefresh = searchParams.get('forceRefresh') === 'true';

        // Gestion du paramètre user pour obtenir le rang d'un utilisateur spécifique
        if (user) {
            const userRank = await getUserRank(user);
            const processingTime = Date.now() - startTime;

            return NextResponse.json({
                userRank,
                metadata: {
                    processingTimeMs: processingTime,
                    lastUpdate: new Date().toISOString(),
                    found: !!userRank
                }
            });
        }

        // Gestion du paramètre complete pour retourner leaderboard + top clicker
        if (complete === 'true') {
            const completeData = await getCompleteLeaderboardData(forceRefresh);
            const processingTime = Date.now() - startTime;

            return NextResponse.json({
                ...completeData,
                metadata: {
                    ...completeData.metadata,
                    processingTimeMs: processingTime
                }
            });
        }

        // Gestion du paramètre limit pour retourner le top N
        if (limit) {
            const limitNum = parseInt(limit, 10);
            if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
                return NextResponse.json(
                    { error: 'Le paramètre limit doit être un nombre entre 1 et 100' },
                    { status: 400 }
                );
            }

            const topPlayersData = await getTopPlayers(limitNum);
            const processingTime = Date.now() - startTime;

            return NextResponse.json({
                ...topPlayersData,
                metadata: {
                    ...topPlayersData.metadata,
                    processingTimeMs: processingTime
                }
            });
        }

        // Retourner le leaderboard complet par défaut
        const leaderboardData = await getLeaderboard(forceRefresh);
        const processingTime = Date.now() - startTime;

        return NextResponse.json({
            ...leaderboardData,
            metadata: {
                ...leaderboardData.metadata,
                processingTimeMs: processingTime
            }
        });

    } catch (error) {
        console.error('Erreur API leaderboard:', error);
        const processingTime = Date.now() - startTime;

        // Gestion des erreurs spécifiques
        let statusCode = 500;
        let errorMessage = 'Erreur interne du serveur';

        if (error.message.includes('GraphQL')) {
            errorMessage = 'Erreur lors de la récupération des données du leaderboard';
        } else if (error.message.includes('Privy')) {
            errorMessage = 'Erreur lors de la récupération des données utilisateur';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            statusCode = 503;
            errorMessage = 'Service temporairement indisponible';
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
                metadata: {
                    processingTimeMs: processingTime,
                    timestamp: new Date().toISOString(),
                    hasError: true
                }
            },
            { status: statusCode }
        );
    }
}