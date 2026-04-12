// app/api/leaderboard/user/[wallet]/route.js
import { getUserRank } from '@/lib/leaderboard';

export async function GET(request, { params }) {
    const { wallet } = await params;

    try {
        const result = await getUserRank(wallet);
        return Response.json(result);
    } catch (error) {
        return Response.json({ error: error.message }, {
            status: 500,
            headers: {
                "Cache-Control": "private, max-age=900, stale-while-revalidate=300"
                //               ^^^^^^ chaque user spécifique cache
                //                     ^^^^^^^^^^^^ cache 15 min
                //                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ sert stale 5 min de plus
            }
        });
    }
}