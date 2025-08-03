// api/users/claim/route.js
import { NextResponse } from 'next/server';
import { publicClientEth, publicClientBera } from '@/utils/constants.js';
import { signMessage } from '@/lib/walletBackend';
import { PrivyClient } from '@privy-io/server-auth';
import { cookies } from 'next/headers';

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

// NFT Partners Collections on other chains - Tier 1
const BADBUNNZ_ADDRESS_ETH = "0xbdb13add477e76c1df52192d4f5f4dd67f6a40d8"
const FLUFFLES_ADDRESS_ETH = "0x4E502Ab1Bb313B3C1311eb0D11B31a6B62988b86"
const PUDGYPENGUINS_ADDRESS_ETH = "0xbd3531da5cf5857e7cfaa92426877b022e612cf8"
const MILADY_ADDRESS_ETH = "0x5af0d9827e0c53e4799bb226655a1de152a425a5"

// NFT Partners Collections on other chains - Tier 2
const MEGALIO_ADDRESS_ETH = "0x851b728e568c9e10ab8007f27a525fbbed29b259"
const CYBERKONGZ_ADDRESS_ETH = "0x57a204aa1042f6e66dd7730813f4024114d74f37"
const CHIMPERS_ADDRESS_ETH = "0x80336ad7a747236ef41f47ed2c7641828a480baa"
const SPROTOGREMLINS_ADDRESS_ETH = "0xeeca64ea9fcf99a22806cd99b3d29cf6e8d54925"
const STEADYTEDDYS_ADDRESS_BERA = "0x88888888a9361f15aadbaca355a6b2938c6a674e"

// NFT Partners Collections on other chains - Tier 3
const BULLAS_ADDRESS_BERA = "0x333814f5e16eee61d0c0b03a5b6abbd424b381c2"

// Initialize the Privy Server Client
const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    process.env.PRIVY_APP_SECRET
);

// Points par collection
const COLLECTION_POINTS = {
    // Tier 1
    badbunnz: 7000,
    fluffles: 7000,
    pudgypenguins: 7000,
    milady: 7000,
    // Tier 2
    cyberkongz: 5000,
    chimpers: 5000,
    steadyteddys: 5000,
    sprotogremlins: 5000,
    // Tier 3
    megalio: 2000,
    bullas: 1000
};

// Configuration des collections
const COLLECTIONS_CONFIG = [
    // Tier 1 - Ethereum
    { name: 'badbunnz', address: BADBUNNZ_ADDRESS_ETH, chain: 'eth', points: COLLECTION_POINTS.badbunnz },
    { name: 'fluffles', address: FLUFFLES_ADDRESS_ETH, chain: 'eth', points: COLLECTION_POINTS.fluffles },
    { name: 'pudgypenguins', address: PUDGYPENGUINS_ADDRESS_ETH, chain: 'eth', points: COLLECTION_POINTS.pudgypenguins },
    { name: 'milady', address: MILADY_ADDRESS_ETH, chain: 'eth', points: COLLECTION_POINTS.milady },
    { name: 'sprotogremlins', address: SPROTOGREMLINS_ADDRESS_ETH, chain: 'eth', points: COLLECTION_POINTS.sprotogremlins },
    // Tier 2 - Ethereum
    { name: 'cyberkongz', address: CYBERKONGZ_ADDRESS_ETH, chain: 'eth', points: COLLECTION_POINTS.cyberkongz },
    { name: 'chimpers', address: CHIMPERS_ADDRESS_ETH, chain: 'eth', points: COLLECTION_POINTS.chimpers },
    // Tier 2 - Berachain
    { name: 'steadyteddys', address: STEADYTEDDYS_ADDRESS_BERA, chain: 'bera', points: COLLECTION_POINTS.steadyteddys },
    // Tier 3 - Ethereum
    { name: 'megalio', address: MEGALIO_ADDRESS_ETH, chain: 'eth', points: COLLECTION_POINTS.megalio },
    // Tier 3 - Berachain
    { name: 'bullas', address: BULLAS_ADDRESS_BERA, chain: 'bera', points: COLLECTION_POINTS.bullas }
];

async function calculatePointsForUser(linkedWallets) {
    let claimablePoints = 0;
    const collectionsBreakdown = {};
    const walletBreakdown = [];

    // Initialize collections breakdown
    COLLECTIONS_CONFIG.forEach(collection => {
        collectionsBreakdown[collection.name] = {
            totalCount: 0,
            totalPoints: 0
        };
    });

    // Validate input
    if (!linkedWallets || !Array.isArray(linkedWallets) || linkedWallets.length === 0) {
        return {
            claimablePoints: 0,
            collectionsBreakdown,
            walletBreakdown: [],
            walletsChecked: 0
        };
    }

    try {
        // Check each wallet address
        for (const walletAddress of linkedWallets) {
            let walletPoints = 0;
            const walletCollections = {};

            // Validate wallet address before processing
            if (!validateAddress(walletAddress)) {
                console.error('Invalid wallet address:', walletAddress);
                walletBreakdown.push({
                    address: walletAddress || 'undefined',
                    collections: {},
                    totalPoints: 0,
                    error: 'Invalid wallet address'
                });
                continue;
            }

            try {
                // Check each collection for this wallet
                for (const collection of COLLECTIONS_CONFIG) {
                    try {
                        // Sélectionner le bon client selon la chaîne
                        const publicClient = collection.chain === 'eth' ? publicClientEth : publicClientBera;

                        const balance = await publicClient.readContract({
                            address: collection.address,
                            abi: ERC721_ABI,
                            functionName: 'balanceOf',
                            args: [walletAddress]
                        });

                        const nftCount = Number(balance);
                        const collectionPoints = nftCount * collection.points;

                        // Update wallet data
                        walletCollections[collection.name] = {
                            count: nftCount,
                            points: collectionPoints
                        };
                        walletPoints += collectionPoints;

                        // Update global collections breakdown
                        collectionsBreakdown[collection.name].totalCount += nftCount;
                        collectionsBreakdown[collection.name].totalPoints += collectionPoints;

                    } catch (collectionError) {
                        console.error(`Error checking ${collection.name} for wallet ${walletAddress}:`, collectionError);
                        walletCollections[collection.name] = {
                            count: 0,
                            points: 0,
                            error: 'Failed to check collection'
                        };
                    }
                }

                // Add to total points
                claimablePoints += walletPoints;

                // Store breakdown for this wallet
                walletBreakdown.push({
                    address: walletAddress,
                    collections: walletCollections,
                    totalPoints: walletPoints
                });

            } catch (walletError) {
                console.error(`Error checking wallet ${walletAddress}:`, walletError);
                // Continue with other wallets even if one fails
                const errorCollections = {};
                COLLECTIONS_CONFIG.forEach(collection => {
                    errorCollections[collection.name] = {
                        count: 0,
                        points: 0,
                        error: 'Failed to check wallet'
                    };
                });

                walletBreakdown.push({
                    address: walletAddress,
                    collections: errorCollections,
                    totalPoints: 0,
                    error: 'Failed to check wallet'
                });
            }
        }

        return {
            claimablePoints,
            collectionsBreakdown,
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
            collectionsBreakdown: result.collectionsBreakdown,
            walletBreakdown: result.walletBreakdown
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