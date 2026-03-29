// app/api/chat/stats/route.js

import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import {
    publicClient,
    DIGIT_RABBITS_CHAT_ADDRESS,
    DIGIT_RABBITS_CHAT_ABI
} from '@/utils/chainConfig';

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const CHAT_STATS_CACHE_TTL_SECONDS = 1;
const roles = ['Rabbit Mob', 'Confirmed Rabbit', 'Moderator'];

const getCachedUserStats = unstable_cache(
    async (userAddress) => {
        const userData = await publicClient.readContract({
            address: DIGIT_RABBITS_CHAT_ADDRESS,
            abi: DIGIT_RABBITS_CHAT_ABI,
            functionName: 'getUserData',
            args: [userAddress]
        });

        return {
            role: roles[userData[0]] || 'Unknown',
            roleIndex: userData[0],
            messageCount: Number(userData[1]),
            totalScore: Number(userData[2]),
            lastMessageTimestamp: Number(userData[3]),
            canSendMessage: userData[4]
        };
    },
    ['chat-user-stats'],
    {
        revalidate: CHAT_STATS_CACHE_TTL_SECONDS,
        tags: ['chat-user-stats']
    }
);

/**
 * GET /api/chat/stats?address=0x...
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userAddress = searchParams.get('address');

        if (!userAddress || !ETH_ADDRESS_REGEX.test(userAddress)) {
            return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
        }

        const stats = await getCachedUserStats(userAddress.toLowerCase());

        return NextResponse.json(stats, {
            headers: {
                'Cache-Control': `public, s-maxage=${CHAT_STATS_CACHE_TTL_SECONDS}, stale-while-revalidate=30`
            }
        });

    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
