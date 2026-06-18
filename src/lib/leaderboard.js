// lib/leaderboard.js
import { unstable_cache } from 'next/cache';
import { privy } from '@/lib/privyClient';

const REQUEST_TIMEOUT = 25000; // 25 secondes timeout pour GraphQL
const PRIVY_TIMEOUT = 15000; // 15 secondes timeout pour Privy
const PRIVY_WALLET_LOOKUP_TIMEOUT_MS = 2500;
const PRIVY_WALLET_LOOKUP_CONCURRENCY = 6;

function timeoutPromise(ms, message) {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), ms);
    });
}


/**
 * Exécute une requête GraphQL avec timeout
 */
async function executeGraphQLQuery(query, variables = {}) {
    const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT;
    const graphqlAuthToken = process.env.GRAPHQL_AUTH_TOKEN;
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!graphqlEndpoint) {
        throw new Error('GRAPHQL_ENDPOINT not configured');
    }
    if (graphqlEndpoint.includes('thegraph.com/studio/subgraph/')) {
        throw new Error(
            'GRAPHQL_ENDPOINT points to The Graph Studio UI URL. Use the GraphQL API query URL instead.'
        );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        console.log('GraphQL Query executing...');

        const response = await fetch(graphqlEndpoint, {
            method: 'POST',
            ...(isDevelopment ? { cache: 'no-store', next: { revalidate: 0 } } : {}),
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(graphqlAuthToken ? { Authorization: `Bearer ${graphqlAuthToken}` } : {}),
            },
            body: JSON.stringify({
                query,
                variables
            }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            if (response.status === 401 && graphqlEndpoint.includes('api.goldsky.com')) {
                throw new Error('GraphQL request failed: Goldsky authorization missing or invalid. Set GRAPHQL_AUTH_TOKEN.');
            }
            throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`);
        }

        const payload = await response.json();

        if (!payload || typeof payload !== 'object') {
            throw new Error('GraphQL response is not a valid JSON object');
        }

        if (Array.isArray(payload.errors) && payload.errors.length > 0) {
            console.error('GraphQL errors:', payload.errors);
            throw new Error(`GraphQL errors: ${payload.errors.map(e => e.message).join(', ')}`);
        }

        if (!payload.data || typeof payload.data !== 'object') {
            const fallbackMessage = payload.message || payload.error || 'missing data field';
            throw new Error(`GraphQL invalid response format: ${fallbackMessage}`);
        }

        return payload.data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Requête GraphQL expirée (timeout)');
        }
        throw error;
    }
}

/**
 * Récupère toutes les données du leaderboard via GraphQL avec pagination
 */
async function getLeaderboardFromGraphQL(seasonId = "1") {
    try {
        console.log(`Fetching complete GraphQL leaderboard: seasonId=${seasonId}`);

        let allResults = [];
        let hasMore = true;
        let skip = 0;
        const limit = 100; // Taille de page (ajustez selon les limites de votre API)

        while (hasMore) {
            console.log(`Fetching page: skip=${skip}, limit=${limit}`);

            // ===== REQUÊTE ADAPTÉE POUR LE SUBGRAPH THE GRAPH =====
            const query = `
                query GetLeaderboard($seasonId: BigInt!, $skip: Int!, $first: Int!) {
                    playerSeasonStats_collection(
                        where: { seasonId: $seasonId }
                        orderBy: leaderboardScore
                        orderDirection: desc
                        skip: $skip
                        first: $first
                    ) {
                        id
                        player {
                        id
                        walletAddress
                        firstGameTimestamp
                        totalPointsClaimed
                        }
                        seasonId
                        leaderboardScore
                        totalClicks
                        gamesPlayed
                        currentStreak
                        bestClicksInGame
                        questsClaimed
                        pointsClaimed
                        lastUpdatedTimestamp
                    }
                }

            `;

            const variables = {
                seasonId: seasonId,
                skip: skip,
                first: limit
            };

            const data = await executeGraphQLQuery(query, variables);
            const currentResults = data?.playerSeasonStats_collection;

            if (!Array.isArray(currentResults)) {
                throw new Error('GraphQL invalid response format: playerSeasonStats_collection is missing');
            }
            allResults = allResults.concat(currentResults);

            // Vérifier s'il y a encore des données
            hasMore = currentResults.length === limit;
            skip += limit;

            console.log(`Page fetched: ${currentResults.length} items, Total: ${allResults.length}`);

            // Petite pause pour éviter de surcharger l'API (optionnel)
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log(`Fetch complete: ${allResults.length} items total`);

        return {
            playerSeasonStats_collection: allResults
        };

    } catch (error) {
        console.error('Error in getLeaderboardFromGraphQL:', error);
        throw error;
    }
}

function buildPrivyUserData(user) {
    const twitterInfo = user?.twitter ? {
        username: user.twitter.username || user.twitter.name || null,
        avatar: user.twitter.profilePictureUrl || null,
        displayName: user.twitter.name || user.twitter.username || null
    } : {
        username: null,
        avatar: null,
        displayName: null
    };

    return {
        mainWallet: user?.wallet?.address || null,
        twitter: twitterInfo,
        createdAt: user?.createdAt || null
    };
}

const getCachedPrivyUserByWallet = unstable_cache(
    async (walletAddress) => {
        try {
            const user = await Promise.race([
                privy.getUserByWalletAddress(walletAddress),
                timeoutPromise(PRIVY_WALLET_LOOKUP_TIMEOUT_MS, `Privy wallet lookup timeout: ${walletAddress}`)
            ]);
            return user || null;
        } catch (error) {
            const isNotFound = error?.status === 404;
            if (!isNotFound) {
                console.warn(`Privy wallet lookup failed (${walletAddress}):`, error?.message || error);
            }
            return null;
        }
    },
    ['privy-user-by-wallet'],
    {
        tags: ['privy-users'],
        revalidate: 3600,
    }
);

async function getPrivyUsersMapForWallets(walletAddresses) {
    const normalizedWallets = [...new Set(
        walletAddresses
            .filter(Boolean)
            .map(address => address.toLowerCase())
    )];

    if (normalizedWallets.length === 0) {
        return Object.create(null);
    }

    const map = Object.create(null);
    let index = 0;

    const workers = Array.from(
        { length: Math.min(PRIVY_WALLET_LOOKUP_CONCURRENCY, normalizedWallets.length) },
        async () => {
            while (index < normalizedWallets.length) {
                const currentIndex = index;
                index += 1;
                const walletAddress = normalizedWallets[currentIndex];

                const user = await getCachedPrivyUserByWallet(walletAddress);
                if (!user) continue;

                const userData = buildPrivyUserData(user);

                if (userData.mainWallet) {
                    map[userData.mainWallet.toLowerCase()] = userData;
                }

                const linkedAccounts = user.linkedAccounts || user.linked_accounts || [];
                linkedAccounts.forEach(account => {
                    if (account?.type === 'wallet' && account?.address) {
                        map[account.address.toLowerCase()] = userData;
                    }
                });
            }
        }
    );

    await Promise.all(workers);
    return map;
}

// Fonction helper pour utiliser le map
function findPrivyUserByWalletFromMap(privyMap, walletAddress) {
    if (!privyMap || !walletAddress) return null;

    const lowercasedWalletAddress = walletAddress.toLowerCase();
    return privyMap[lowercasedWalletAddress] || null;
}

// Fonction helper pour extraire les infos Twitter depuis le map
function getTwitterInfoFromMap(privyMap, walletAddress) {
    const userData = findPrivyUserByWalletFromMap(privyMap, walletAddress);

    if (!userData) {
        return {
            username: null,
            avatar: null,
            displayName: null
        };
    }

    return userData.twitter;
}

/**
 * Calcule le leaderboard principal
 */
async function calculateLeaderboard() {
    const startTime = Date.now();

    try {
        console.log('Calculating leaderboard...');

        const graphqlData = await getLeaderboardFromGraphQL();
        const rawPlayers = graphqlData.playerSeasonStats_collection || [];
        const leaderboardWallets = rawPlayers
            .map(playerData => playerData.player?.walletAddress)
            .filter(Boolean);
        const privyMap = await getPrivyUsersMapForWallets(leaderboardWallets);

        console.log(`GraphQL: ${rawPlayers.length} players`);
        console.log(`Privy: ${Object.keys(privyMap).length} users`);

        // Construction du leaderboard
        const leaderboard = rawPlayers.map((playerData, index) => {
            const playerAddress = playerData.player?.walletAddress;
            const privyUser = findPrivyUserByWalletFromMap(privyMap, playerAddress);
            const twitterInfo = getTwitterInfoFromMap(privyMap, playerAddress);
            const scoreInPoints = parseInt(playerData.leaderboardScore || 0, 10) / 1000000;

            return {
                rank: index + 1,
                walletAddress: playerAddress,
                score: scoreInPoints,
                totalClicks: parseInt(playerData.totalClicks || 0, 10),
                gameClicks: parseInt(playerData.gamesPlayed || 0, 10),
                streak: parseInt(playerData.currentStreak || 0, 10),
                maxClicks: parseInt(playerData.bestClicksInGame || 0, 10),
                questsClaimed: parseInt(playerData.questsClaimed || 0, 10),
                hasClaimedPoints: parseInt(playerData.pointsClaimed || 0, 10) > 0,
                totalPointsAllTime: parseInt(playerData.player?.totalPointsClaimed || 0, 10) / 1000000,
                firstGameAt: parseInt(playerData.player?.firstGameTimestamp || 0, 10),
                updatedAt: parseInt(playerData.lastUpdatedTimestamp || 0, 10),
                twitter: twitterInfo,
                user: {
                    createdAt: privyUser?.createdAt
                }
            };
        });

        const processingTime = Date.now() - startTime;
        console.log(`Leaderboard calculated in ${processingTime}ms with ${leaderboard.length} players`);

        return {
            leaderboard,
            metadata: {
                totalPlayers: leaderboard.length,
                seasonId: "1",
                lastUpdate: new Date().toISOString(),
                topScore: leaderboard[0]?.score || 0,
                topStreak: Math.max(...leaderboard.map(p => p.streak), 0),
                topMaxClicks: Math.max(...leaderboard.map(p => p.maxClicks), 0),
                source: 'the-graph-subgraph',
                processingTimeMs: processingTime,
                privyUsersCount: Object.keys(privyMap).length,
                graphqlPlayersCount: rawPlayers.length
            }
        };

    } catch (error) {
        console.error('Error calculating leaderboard:', error);
        throw error; // Laisse Next.js gérer l'erreur
    }
}

/**
 * Obtient le leaderboard
 */
export async function getLeaderboard() {
    return await calculateLeaderboard();
}

/**
 * Obtient le classement d'un utilisateur spécifique
 */
export async function getUserRank(walletAddress, options = {}) {
    try {
        const { leaderboard } = await getLeaderboard();
        const includeContext = options?.includeContext === true;

        const userEntry = leaderboard.find(
            entry => entry.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        );

        if (!includeContext) {
            return userEntry || null;
        }

        return {
            userRank: userEntry || null,
            totalPlayers: leaderboard.length
        };
    } catch (error) {
        console.error('Error fetching user rank:', error);
        if (options?.includeContext === true) {
            return {
                userRank: null,
                totalPlayers: 0
            };
        }
        return null;
    }
}

/**
 * Obtient le top N du leaderboard
 */
export async function getTopPlayers(limit = 10) {
    try {
        const { leaderboard, metadata } = await getLeaderboard();

        return {
            topPlayers: leaderboard.slice(0, limit),
            metadata: {
                ...metadata,
                isLimited: leaderboard.length > limit
            }
        };
    } catch (error) {
        console.error('Error fetching top players:', error);
        return { topPlayers: [], metadata: null };
    }
}

/**
 * Obtient les joueurs avec le meilleur streak
 */
export async function getTopStreakers(limit = 10) {
    try {
        const { leaderboard } = await getLeaderboard();

        // Trier par streak
        const sortedByStreak = leaderboard
            .sort((a, b) => b.streak - a.streak)
            .slice(0, limit);

        return {
            topStreakers: sortedByStreak,
            metadata: {
                highestStreak: leaderboard[0]?.streak || 0,
                lastUpdate: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Error fetching top streakers:', error);
        return { topStreakers: [], metadata: null };
    }
}

/**
 * Obtient les joueurs avec le meilleur maxClicks
 */
export async function getTopClickers(limit = 10) {
    try {
        const { leaderboard } = await getLeaderboard();

        // Trier par maxClicks
        const sortedByClicks = leaderboard
            .sort((a, b) => b.maxClicks - a.maxClicks)
            .slice(0, limit);

        return {
            topClickers: sortedByClicks,
            metadata: {
                highestMaxClicks: leaderboard[0]?.maxClicks || 0,
                lastUpdate: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Error fetching top clickers:', error);
        return { topClickers: [], metadata: null };
    }
}

/**
 * Obtient les statistiques globales
 */
export async function getLeaderboardStats() {
    try {
        const { leaderboard } = await getLeaderboard();

        const totalClicks = leaderboard.reduce((sum, p) => sum + p.totalClicks, 0);
        const avgScore = leaderboard.reduce((sum, p) => sum + p.score, 0) / leaderboard.length;
        const avgStreak = leaderboard.reduce((sum, p) => sum + p.streak, 0) / leaderboard.length;

        return {
            stats: {
                totalPlayers: leaderboard.length,
                totalClicks,
                averageScore: avgScore,
                averageStreak: avgStreak,
                highestScore: Math.max(...leaderboard.map(p => p.score), 0),
                highestStreak: Math.max(...leaderboard.map(p => p.streak), 0),
                highestMaxClicks: Math.max(...leaderboard.map(p => p.maxClicks), 0),
                playersWithClaimedPoints: leaderboard.filter(p => p.hasClaimedPoints).length
            },
            metadata: {
                lastUpdate: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Error fetching leaderboard stats:', error);
        return null;
    }
}

/**
 * Obtient les données complètes du leaderboard
 */
export async function getCompleteLeaderboardData() {
    try {
        const leaderboardData = await getLeaderboard();
        return {
            topPlayers: leaderboardData.leaderboard,
            metadata: leaderboardData.metadata
        };
    } catch (error) {
        console.error('Error fetching complete leaderboard data:', error);
        throw error;
    }
}
