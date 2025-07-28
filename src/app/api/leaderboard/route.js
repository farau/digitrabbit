// app/api/leaderboard/route.js
import { getUserRank, getTopPlayers, getLeaderboard, getTopClicker, getCompleteLeaderboardData } from "@/lib/leaderboard";
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit');
        const user = searchParams.get('user');
        const topClicker = searchParams.get('topClicker');
        const complete = searchParams.get('complete');

        if (user) {
            // Retourner le rang d'un utilisateur spécifique
            const userRank = await getUserRank(user);
            return NextResponse.json({ userRank });
        }

        if (topClicker === 'true') {
            // Retourner seulement le top clicker
            const topClickerData = await getTopClicker();
            return NextResponse.json(topClickerData);
        }

        if (complete === 'true') {
            // Retourner le leaderboard complet + top clicker
            const completeData = await getCompleteLeaderboardData();
            return NextResponse.json(completeData);
        }

        if (limit) {
            // Retourner le top N
            const topPlayers = await getTopPlayers(parseInt(limit));
            return NextResponse.json(topPlayers);
        }

        // Retourner le leaderboard complet
        const leaderboard = await getLeaderboard();
        return NextResponse.json(leaderboard);

    } catch (error) {
        console.error('Error API leaderboard:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error.message
            },
            { status: 500 }
        );
    }
}