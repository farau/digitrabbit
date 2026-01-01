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
            const completeData = await getCompleteLeaderboardData();
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
                    { error: "The 'limit' parameter must be a number between 1 and 100" },
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
        const leaderboardData = await getLeaderboard();
        const processingTime = Date.now() - startTime;

        return NextResponse.json({
            ...leaderboardData,
            metadata: {
                ...leaderboardData.metadata,
                processingTimeMs: processingTime
            }
        });

    } catch (error) {
        console.error('Leaderboard API error:', error);
        const processingTime = Date.now() - startTime;

        // Specific error handling
        let statusCode = 500;
        let errorMessage = 'Internal server error';

        if (error.message.includes('GraphQL')) {
            errorMessage = 'Error fetching leaderboard data';
        } else if (error.message.includes('Privy')) {
            errorMessage = 'Error fetching user data';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            statusCode = 503;
            errorMessage = 'Service temporarily unavailable';
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
            {
                status: statusCode,
                headers: {
                    "Cache-Control": "public, max-age=900, s-maxage=900, stale-while-revalidate=300"
                    //               ^^^^^^ tout le monde peut cacher
                    //                     ^^^^^^^^^^^^ cache 15 min
                    //                                  ^^^^^^^^^^^^ cache 15 min CDN
                    //                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ sert stale 5 min de plus
                }
            }
        );
    }
}