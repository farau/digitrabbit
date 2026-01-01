// app/api/leaderboard/top-streakers/route.js
import { getTopStreakers } from '@/lib/leaderboard';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    try {
        const result = await getTopStreakers(limit);
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