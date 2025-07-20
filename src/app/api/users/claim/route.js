// api/users/claim/route.js
import { NextResponse } from 'next/server';
import { BADBUNNZ_ADDRESS_ETH, MEGALIO_ADDRESS_ETH, publicClientEth } from '@/utils/constants.js';
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS } from '@/utils/constants.js';
import { signMessage, signTypedData } from '@/lib/walletBackend';
import { PrivyClient, User } from '@privy-io/server-auth';
import { cookies, headers } from 'next/headers';
import { megaethTestnet } from 'viem/chains';
import { encodeFunctionData } from 'viem';


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

// Initialize the Privy Server Client
const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    process.env.PRIVY_APP_SECRET
);

const badbunnzPoints = 8000;
const megalioPoints = 1000;



async function calculatePointsForUser(linkedWallets) {
    let claimablePoints = 0;
    let totalBadbunnzCount = 0;
    let claimableBadbunnzPoints = 0;
    let claimableMegalioPoints = 0;
    let totalMegalioCount = 0;
    const walletBreakdown = [];

    // Validate input
    if (!linkedWallets || !Array.isArray(linkedWallets) || linkedWallets.length === 0) {
        return {
            claimablePoints: 0,
            totalBadbunnzCount: 0,
            totalMegalioCount: 0,
            claimableBadbunnzPoints: 0,
            claimableMegalioPoints: 0,
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
                claimableBadbunnzPoints += walletBadbunnz * badbunnzPoints;
                walletPoints += walletBadbunnz * badbunnzPoints; // 8000 points per Badbunnz

                // Rule 2: Check Megalio Collection for this wallet
                const megalioCount = await publicClientEth.readContract({
                    address: MEGALIO_ADDRESS_ETH,
                    abi: ERC721_ABI,
                    functionName: 'balanceOf',
                    args: [walletAddress]
                });
                walletMegalio = Number(megalioCount);
                claimableMegalioPoints += walletMegalio * megalioPoints;
                walletPoints += walletMegalio * megalioPoints; // 1000 points per Megalio

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
            claimableBadbunnzPoints,
            claimableMegalioPoints,
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
export async function POST() {
    try {
        let embeddedWallet;
        let linkedWallets;
        let user;

        try {
            // Get identity token from cookie
            const cookieStore = await cookies();
            const idToken = cookieStore.get('privy-id-token')?.value;

            if (!idToken) {
                return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
            }

            // Parse and verify the token
            user = await privy.getUser({ idToken });

            // Extraire les portefeuilles de l'objet utilisateur fiable
            embeddedWallet = user.linkedAccounts.find(
                (account) => account.type === 'wallet' && account.walletClientType === 'privy'
            );

            linkedWallets = user.linkedAccounts
                .filter(account => account.type === 'wallet')
                .map(account => account.address);

        } catch (error) {
            console.error('Failed to get user data:', error);
            return NextResponse.json({ error: 'Invalid or expired identity token.' }, { status: 401 });
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
        const signature = await signMessage(
            embeddedWallet.address,
            result.claimablePoints,
            nonce
        );

        if (!signature) {
            return NextResponse.json(
                { error: 'Failed to sign message' },
                { status: 500 }
            );
        }

        // 5. Renvoyer le hachage de la transaction au client
        return NextResponse.json({
            success: true,
            signature: signature,
            claimablePoints: result.claimablePoints,
            nonce: nonce,
        });


    } catch (error) {
        console.error('Claim route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}


export async function GET(request) {
    try {
        // Get identity token from cookie
        const cookieStore = await cookies();
        const idToken = cookieStore.get('privy-id-token')?.value;

        if (!idToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Parse and verify the token
        const user = await privy.getUser({ idToken });

        // 4. Extraire les adresses des portefeuilles de l'objet utilisateur fiable
        const linkedWallets = user.linkedAccounts
            .filter(account => account.type === 'wallet')
            .map(account => account.address);

        // Calculate points for all linked wallets
        const result = await calculatePointsForUser(linkedWallets);

        return NextResponse.json({
            ...result,
            claimable: result.claimablePoints > 0
        });

    } catch (error) {
        console.error('Claim error:', error);
        // Gérer les erreurs de token invalide
        if (error.message.includes('invalid')) {
            return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}