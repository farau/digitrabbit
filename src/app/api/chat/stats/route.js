// app/api/chat/stats/route.js

import { NextResponse } from 'next/server';
import {
    publicClient,
    DIGIT_RABBITS_CHAT_ADDRESS,
    DIGIT_RABBITS_CHAT_ABI
} from '@/utils/chainConfig';


/**
 * GET /api/chat/stats?address=0x...
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userAddress = searchParams.get('address');

        if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
            return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
        }

        const userData = await publicClient.readContract({
            address: DIGIT_RABBITS_CHAT_ADDRESS,
            abi: DIGIT_RABBITS_CHAT_ABI,
            functionName: 'getUserData',
            args: [userAddress]
        });

        const roles = ['Rabbit Mob', 'Confirmed Rabbit', 'Moderator'];

        return NextResponse.json({
            role: roles[userData[0]] || 'Unknown',
            roleIndex: userData[0],
            messageCount: Number(userData[1]),
            totalScore: Number(userData[2]),
            lastMessageTimestamp: Number(userData[3]),
            canSendMessage: userData[4]
        });

    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}