// app/api/leaderboard/route.js
import { getUserRank, getTopPlayers, getLeaderboard } from "@/lib/leaderboard"; // Changement du chemin
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const user = searchParams.get('user');

    if (user) {
      // Retourner le rang d'un utilisateur spécifique
      const userRank = await getUserRank(user);
      return NextResponse.json({ userRank });
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
    console.error('Erreur API leaderboard:', error);
    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        message: error.message
      },
      { status: 500 }
    );
  }
}