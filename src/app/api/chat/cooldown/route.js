// app/api/chat/cooldown/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
    publicClient,
    DIGIT_RABBITS_CHAT_ADDRESS,
    DIGIT_RABBITS_CHAT_ABI
} from '@/utils/chainConfig';

/**
 * GET /api/chat/cooldown?address=0x...
 */
export async function GET(request) {
    try {
        // 1. Get identity token from cookie
        const cookieStore = await cookies();
        const idToken = cookieStore.get('privy-id-token')?.value;

        if (!idToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        // 2. Extract user address from query parameters
        const { searchParams } = new URL(request.url);
        const userAddress = searchParams.get('address');

        if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
            return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
        }

        // 3. Call smart contract to get cooldown info
        const cooldown = await publicClient.readContract({
            address: DIGIT_RABBITS_CHAT_ADDRESS,
            abi: DIGIT_RABBITS_CHAT_ABI,
            functionName: 'getMessageCooldown',
            args: [userAddress]
        });

        return NextResponse.json({
            canSend: cooldown[0],
            remainingTime: Number(cooldown[1])
        });

    } catch (error) {
        console.error('Error fetching cooldown:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}