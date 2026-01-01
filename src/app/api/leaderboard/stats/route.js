// app/api/leaderboard/stats/route.js
import { getLeaderboardStats } from '@/lib/leaderboard';

export async function GET() {
    try {
        const result = await getLeaderboardStats();
        return Response.json(result);
    } catch (error) {
        return Response.json({ error: error.message }, {
            status: 500,
            headers: {
                "Cache-Control": "public, max-age=900, s-maxage=900, stale-while-revalidate=300"
                //               ^^^^^^ tout le monde peut cacher
                //                     ^^^^^^^^^^^^ cache 15 min
                //                                  ^^^^^^^^^^^^ cache 15 min CDN
                //                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ sert stale 5 min de plus
            }
        });
    }
}