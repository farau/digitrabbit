// app/api/game/check-nft/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createPublicClient, http, parseAbi } from 'viem';
import { privy, verifyAndGetUser } from '@/lib/privyClient';
import { publicClient } from '@/utils/chainConfig';

// ERC721 ABI
const erc721Abi = parseAbi([
    'function balanceOf(address owner) view returns (uint256)'
]);

/**
 * Vérifier si un utilisateur possède le NFT
 */
async function checkNFTOwnership(user) {
    try {
        const allAddresses = [];

        if (user.wallet?.address) {
            allAddresses.push(user.wallet.address);
        }

        if (user.linkedAccounts) {
            user.linkedAccounts.forEach(account => {
                if (account.type === 'wallet' && account.address) {
                    allAddresses.push(account.address);
                }
            });
        }

        for (const address of allAddresses) {
            try {
                const balance = await publicClient.readContract({
                    address: process.env.ERC721_DIGIT_RABBITS_CONTRACT_ADDRESS,
                    abi: erc721Abi,
                    functionName: 'balanceOf',
                    args: [address]
                });

                if (balance > 0n) {
                    return true;
                }
            } catch (error) {
                console.error(`Error checking address ${address}:`, error);
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking NFT ownership:', error);
        return false;
    }
}

/**
 * POST /api/game/check-nft
 */
export async function POST(request) {
    try {
        // 1. Get identity token from cookie
        const cookieStore = await cookies();
        const idToken = cookieStore.get('privy-id-token')?.value;

        if (!idToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Extraire le userId de Privy
        const user = await verifyAndGetUser(idToken);

        // Vérifier le NFT
        const hasNFT = await checkNFTOwnership(user);

        return NextResponse.json({
            hasNFT,
            requiredNFT: process.env.ERC721_DIGIT_RABBITS_CONTRACT_ADDRESS
        });

    } catch (error) {
        console.error('Error checking NFT:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}