// api/users/claim/route.js
import { NextResponse } from 'next/server';
import { privy, verifyAndGetUser } from '@/lib/privyClient';
import { cookies } from 'next/headers';
import { signMessage } from '@/lib/walletBackend';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Points par NFT
const POINTS_PER_NFT = 750;

// Cache pour les holders (évite de relire le CSV à chaque requête)
let holdersCache = null;
let lastCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Charge les holders depuis le fichier CSV
 */
async function loadHoldersFromCSV() {
    // Vérifier si le cache est encore valide
    if (holdersCache && lastCacheTime && (Date.now() - lastCacheTime < CACHE_DURATION)) {
        return holdersCache;
    }

    try {
        // Charger le CSV depuis public/data
        const csvPath = path.join(process.cwd(), 'public', 'data', 'holders.csv');
        const fileContent = fs.readFileSync(csvPath, 'utf-8');

        return new Promise((resolve, reject) => {
            Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim(),
                complete: (results) => {
                    // Créer un Map pour un accès rapide par adresse (insensible à la casse)
                    const holdersMap = new Map();

                    results.data.forEach(row => {
                        const owner = row.owner?.trim();
                        const totalNFTs = parseInt(row.totalNFTs) || 0;

                        if (owner && validateAddress(owner)) {
                            // Normaliser l'adresse en minuscules pour la comparaison
                            holdersMap.set(owner.toLowerCase(), totalNFTs);
                        }
                    });

                    // Mettre en cache
                    holdersCache = holdersMap;
                    lastCacheTime = Date.now();

                    console.log(`Loaded ${holdersMap.size} holders from CSV`);
                    resolve(holdersMap);
                },
                error: (error) => {
                    console.error('Error parsing CSV:', error);
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('Error loading CSV file:', error);
        throw new Error('Failed to load holders data');
    }
}

/**
 * Calcule les points pour un utilisateur en fonction de ses wallets liés
 */
async function calculatePointsForUser(linkedWallets) {
    let claimablePoints = 0;
    const walletBreakdown = [];
    const collectionsBreakdown = {
        digitrabbits: {
            totalCount: 0,
            totalPoints: 0
        }
    };

    // Validate input
    if (!linkedWallets || !Array.isArray(linkedWallets) || linkedWallets.length === 0) {
        return {
            claimablePoints: 0,
            collectionsBreakdown,
            walletBreakdown: [],
            walletsChecked: 0,
            totalNFTs: 0
        };
    }

    try {
        // Charger les holders depuis le CSV
        const holdersMap = await loadHoldersFromCSV();

        // Vérifier chaque wallet
        for (const walletAddress of linkedWallets) {
            // Valider l'adresse
            if (!validateAddress(walletAddress)) {
                console.error('Invalid wallet address:', walletAddress);
                walletBreakdown.push({
                    address: walletAddress || 'undefined',
                    collections: {
                        digitrabbits: {
                            count: 0,
                            points: 0
                        }
                    },
                    totalPoints: 0,
                    error: 'Invalid wallet address'
                });
                continue;
            }

            // Rechercher le wallet dans les holders (insensible à la casse)
            const normalizedAddress = walletAddress.toLowerCase();
            const nftCount = holdersMap.get(normalizedAddress) || 0;
            const walletPoints = nftCount * POINTS_PER_NFT;

            claimablePoints += walletPoints;

            // Update collections breakdown
            collectionsBreakdown.digitrabbits.totalCount += nftCount;
            collectionsBreakdown.digitrabbits.totalPoints += walletPoints;

            walletBreakdown.push({
                address: walletAddress,
                collections: {
                    digitrabbits: {
                        count: nftCount,
                        points: walletPoints
                    }
                },
                totalPoints: walletPoints,
                hasNFTs: nftCount > 0
            });
        }

        const totalNFTs = collectionsBreakdown.digitrabbits.totalCount;

        return {
            claimablePoints,
            collectionsBreakdown,
            walletBreakdown,
            walletsChecked: linkedWallets.length,
            totalNFTs,
            pointsPerNFT: POINTS_PER_NFT
        };

    } catch (error) {
        console.error('Error calculating points:', error);
        throw new Error('Failed to calculate points for user');
    }
}

/**
 * Valide une adresse Ethereum
 */
function validateAddress(address) {
    return address &&
        typeof address === 'string' &&
        address.length === 42 &&
        address.startsWith('0x') &&
        address !== 'undefined' &&
        /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Génère un nonce unique
 */
function generateUniqueNonce() {
    return Date.now().toString();
}

/**
 * POST handler for claiming points
 */
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
            user = await verifyAndGetUser(idToken);

            // Extraire les portefeuilles de l'objet utilisateur
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
                    error: 'No testnet NFTs found across any linked wallets',
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

        // Renvoyer la signature et les détails
        return NextResponse.json({
            success: true,
            signature: signature,
            claimablePoints: result.claimablePoints,
            nonce: nonce,
            collectionsBreakdown: result.collectionsBreakdown,
            totalNFTs: result.totalNFTs,
            pointsPerNFT: result.pointsPerNFT,
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

/**
 * GET handler for checking claimable points
 */
export async function GET(request) {
    try {
        // Get identity token from cookie
        const cookieStore = await cookies();
        const idToken = cookieStore.get('privy-id-token')?.value;

        if (!idToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Parse and verify the token
        const user = await verifyAndGetUser(idToken);

        // Extraire les adresses des portefeuilles
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