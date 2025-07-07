// api/users/claim/route.js
import { NextResponse } from 'next/server';
import { BADBUNNZ_ADDRESS_ETH, MEGALIO_ADDRESS_ETH, publicClientEth } from '@/constants';
import { signMessage, signTypedData } from '@/utils/walletBackend';

// ABI minimal pour la fonction balanceOf
const ERC721_ABI = [
    {
        "inputs": [{ "name": "owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

async function calculatePointsForUser(linkedWallets) {
    let claimablePoints = 0;
    let totalBadbunnzCount = 0;
    let totalMegalioCount = 0;
    const walletBreakdown = [];

    // Validate input
    if (!linkedWallets || !Array.isArray(linkedWallets) || linkedWallets.length === 0) {
        return {
            claimablePoints: 0,
            totalBadbunnzCount: 0,
            totalMegalioCount: 0,
            walletBreakdown: [],
            walletsChecked: 0
        };
    }

    try {
        // Check each wallet address
        for (const walletAddress of linkedWallets) {
            let walletPoints = 0;
            let walletBadbunnz = 0;
            let walletMegalio = 0;

            // Validate wallet address before processing
            if (!validateAddress(walletAddress)) {
                console.error('Invalid wallet address:', walletAddress);
                walletBreakdown.push({
                    address: walletAddress || 'undefined',
                    badbunnzCount: 0,
                    megalioCount: 0,
                    points: 0,
                    error: 'Invalid wallet address'
                });
                continue;
            }

            try {
                // Rule 1: Check Badbunnz Collection for this wallet
                const badbunnzCount = await publicClientEth.readContract({
                    address: BADBUNNZ_ADDRESS_ETH,
                    abi: ERC721_ABI,
                    functionName: 'balanceOf',
                    args: [walletAddress]
                });
                walletBadbunnz = Number(badbunnzCount);
                walletPoints += walletBadbunnz * 10000; // 10000 points per Badbunnz

                // Rule 2: Check Megalio Collection for this wallet
                const megalioCount = await publicClientEth.readContract({
                    address: MEGALIO_ADDRESS_ETH,
                    abi: ERC721_ABI,
                    functionName: 'balanceOf',
                    args: [walletAddress]
                });
                walletMegalio = Number(megalioCount);
                walletPoints += walletMegalio * 2000; // 2000 points per Megalio

                // Add to totals
                claimablePoints += walletPoints;
                totalBadbunnzCount += walletBadbunnz;
                totalMegalioCount += walletMegalio;

                // Store breakdown for this wallet
                walletBreakdown.push({
                    address: walletAddress,
                    badbunnzCount: walletBadbunnz,
                    megalioCount: walletMegalio,
                    points: walletPoints
                });

            } catch (walletError) {
                console.error(`Error checking wallet ${walletAddress}:`, walletError);
                // Continue with other wallets even if one fails
                walletBreakdown.push({
                    address: walletAddress,
                    badbunnzCount: 0,
                    megalioCount: 0,
                    points: 0,
                    error: 'Failed to check wallet'
                });
            }
        }

        return {
            claimablePoints,
            totalBadbunnzCount,
            totalMegalioCount,
            walletBreakdown,
            walletsChecked: linkedWallets.length
        };

    } catch (error) {
        console.error('Error calculating points:', error);
        throw new Error('Failed to calculate points for user');
    }
}

// Helper function to validate wallet addresses
function validateAddress(address) {
    return address &&
        typeof address === 'string' &&
        address.length === 42 &&
        address.startsWith('0x') &&
        address !== 'undefined' &&
        /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Fonction utilitaire pour générer un nonce unique
function generateUniqueNonce() {
    return Date.now().toString();
}

// POST handler for claiming points
export async function POST(request) {
    try {
        const body = await request.json();
        const { linkedWallets, address } = body; // on récupère l'adresse de l'embeddedWallet pour signer la tx ave

        if (!linkedWallets || !Array.isArray(linkedWallets)) {
            return NextResponse.json(
                { error: 'linkedWallets array is required' },
                { status: 400 }
            );
        }

        if (linkedWallets.length === 0) {
            return NextResponse.json(
                { error: 'No wallets provided' },
                { status: 400 }
            );
        }

        // Calculate points for all linked wallets
        const result = await calculatePointsForUser(linkedWallets);

        if (result.claimablePoints === 0) {
            return NextResponse.json(
                {
                    error: 'No NFTs found across any linked wallets',
                    ...result
                },
                { status: 200 }
            );
        }

        // Generate nonce
        const nonce = generateUniqueNonce();

        // Create signature using backend wallet
        // Note: We sign the total points across all wallets
        const signature = await signMessage(
            address,
            result.claimablePoints,
            nonce
        );

        // Alternative: Use typed data signature (recommended for production)
        // const signature = await signTypedData(userAddress, result.totalPoints, nonce);

        // Return claim data
        return NextResponse.json({
            success: true,
            ...result,
            nonce,
            signature,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Claim route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Optional: GET handler to check claimable points without signing
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const linkedWalletsParam = searchParams.get('linkedWallets');

        if (!linkedWalletsParam) {
            return NextResponse.json(
                { error: 'linkedWallets parameter is required' },
                { status: 400 }
            );
        }

        let linkedWallets;
        try {
            linkedWallets = JSON.parse(linkedWalletsParam);
        } catch (parseError) {
            return NextResponse.json(
                { error: 'Invalid linkedWallets JSON format' },
                { status: 400 }
            );
        }

        if (!Array.isArray(linkedWallets)) {
            return NextResponse.json(
                { error: 'linkedWallets must be an array' },
                { status: 400 }
            );
        }

        const result = await calculatePointsForUser(linkedWallets);

        return NextResponse.json({
            ...result,
            claimable: result.totalPoints > 0
        });

    } catch (error) {
        console.error('Get points error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}