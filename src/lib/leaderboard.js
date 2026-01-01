// lib/leaderboard.js
import { unstable_cache } from 'next/cache'
import { PrivyClient } from '@privy-io/server-auth';

// Configuration
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_METH_ENDPOINT || process.env.NEXT_PUBLIC_GRAPHQL_METH_ENDPOINT;

// Client Privy
const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

const REQUEST_TIMEOUT = 25000; // 25 secondes timeout pour GraphQL
const PRIVY_TIMEOUT = 15000; // 15 secondes timeout pour Privy


/**
 * Exécute une requête GraphQL avec timeout
 */
async function executeGraphQLQuery(query, variables = {}) {
    if (!GRAPHQL_ENDPOINT) {
        throw new Error('GRAPHQL_ENDPOINT non configuré');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        console.log('GraphQL Query executing...');

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables
            }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.errors) {
            console.error('GraphQL errors:', data.errors);
            throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
        }

        return data.data;
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
async function getLeaderboardFromGraphQL(seasonId = "0") {
    try {
        console.log(`Fetching complete GraphQL leaderboard: seasonId=${seasonId}`);

        let allResults = [];
        let hasMore = true;
        let skip = 0;
        const limit = 1000; // Taille de page (ajustez selon les limites de votre API)

        while (hasMore) {
            console.log(`Fetching page: skip=${skip}, limit=${limit}`);

            // ===== REQUÊTE ADAPTÉE POUR LE SUBGRAPH THE GRAPH =====
            const query = `
                query GetLeaderboard($seasonId: BigInt!, $skip: Int!, $first: Int!) {
                    playerSeasonDatas(
                        where: { seasonId: $seasonId }
                        orderBy: score
                        orderDirection: desc
                        skip: $skip
                        first: $first
                    ) {
                        id
                        player {
                            id
                            address
                            firstGameAt
                            totalPointsAllTime
                        }
                        seasonId
                        score
                        totalClicks
                        gameClicks
                        streak
                        maxClicks
                        hasClaimedPoints
                        updatedAt
                    }
                }
            `;

            const variables = {
                seasonId: seasonId,
                skip: skip,
                first: limit
            };

            const data = await executeGraphQLQuery(query, variables);

            if (!data.playerSeasonDatas) {
                throw new Error('Format de réponse GraphQL invalide');
            }

            const currentResults = data.playerSeasonDatas;
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
            playerSeasonDatas: allResults
        };

    } catch (error) {
        console.error('Error in getLeaderboardFromGraphQL:', error);
        throw error;
    }
}

/**
 * Récupère tous les utilisateurs de Privy
 */
async function getPrivyUsers() {
    try {
        console.log('Fetching Privy users...');

        // Créer une Promise avec timeout pour Privy
        const privyPromise = new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Timeout Privy'));
            }, PRIVY_TIMEOUT);

            privy.getUsers()
                .then(users => {
                    clearTimeout(timeoutId);
                    resolve(users);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
        const users = await privyPromise;

        console.log(`${users.length} Privy users fetched`);
        return users;
    } catch (error) {
        console.error('Error fetching Privy users:', error);
        return [];// Retourner un tableau vide en cas d'erreur
    }
}

/**
 * Trouve un utilisateur Privy par son adresse wallet
 */
function findPrivyUserByWallet(users, walletAddress) {
    if (!users || users.length === 0) return null;

    const lowercasedWalletAddress = walletAddress.toLowerCase();

    return users.find(user => {
        if (user.wallet && user.wallet.address.toLowerCase() === lowercasedWalletAddress) {
            return true;
        }

        if (user.linked_accounts) {
            return user.linked_accounts.some(account =>
                account.type === 'wallet' &&
                account.address &&
                account.address.toLowerCase() === lowercasedWalletAddress
            );
        }

        return false;
    });
}

/**
 * Extrait les informations Twitter d'un utilisateur
 */
function getTwitterInfo(user) {
    if (!user) {
        return {
            username: null,
            avatar: null,
            displayName: null
        };
    }

    const twitterAccount = user.twitter;
    if (twitterAccount) {
        return {
            username: twitterAccount.username || twitterAccount.name,
            avatar: twitterAccount.profilePictureUrl,
            displayName: twitterAccount.name || twitterAccount.username
        };
    }

    return {
        username: null,
        avatar: null,
        displayName: null
    };
}

// Cache des utilisateurs Privy pour éviter les appels redondants - Ok car lib côté serveur
const getCachedPrivyUsers = unstable_cache(
    async () => {
        const users = await getPrivyUsers();
        // Créer un map avec toutes les adresses wallet comme clés
        const map = {};

        users.forEach(user => {
            // Extraire les infos Twitter
            const twitterInfo = user.twitter ? {
                username: user.twitter.username || user.twitter.name || null,
                avatar: user.twitter.profilePictureUrl || null,
                displayName: user.twitter.name || user.twitter.username || null
            } : {
                username: null,
                avatar: null,
                displayName: null
            };

            // Données minimales à stocker
            const userData = {
                mainWallet: user.wallet?.address || null,
                twitter: twitterInfo
            };

            // Indexer par l'adresse principale du wallet
            if (user.wallet?.address) {
                const mainAddress = user.wallet.address.toLowerCase();
                map[mainAddress] = userData;
            }

            // Indexer aussi par tous les linked_accounts de type wallet
            if (user.linked_accounts) {
                user.linked_accounts.forEach(account => {
                    if (account.type === 'wallet' && account.address) {
                        const linkedAddress = account.address.toLowerCase();
                        map[linkedAddress] = userData;
                    }
                });
            }
        });

        return map;
    },
    ['privy-users-map'],
    {
        tags: ['privy-users'],
        revalidate: 3600,
    }
);

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

        // Récupération simple et parallèle
        const [privyMap, graphqlData] = await Promise.all([
            getCachedPrivyUsers(), // Appel simple et propre
            getLeaderboardFromGraphQL()
        ]);

        console.log(`GraphQL: ${graphqlData.playerSeasonDatas.length} players`);
        console.log(`Privy: ${Object.keys(privyMap).length} users`);

        // Construction du leaderboard
        const leaderboard = graphqlData.playerSeasonDatas.map((playerData, index) => {
            const playerAddress = playerData.player.address;
            const privyUser = findPrivyUserByWalletFromMap(privyMap, playerAddress);
            const twitterInfo = getTwitterInfoFromMap(privyMap, playerAddress);
            const scoreInPoints = parseInt(playerData.score) / 1000000;

            return {
                rank: index + 1,
                walletAddress: playerAddress,
                score: scoreInPoints,
                totalClicks: parseInt(playerData.totalClicks),
                gameClicks: parseInt(playerData.gameClicks),
                streak: parseInt(playerData.streak),
                maxClicks: parseInt(playerData.maxClicks),
                hasClaimedPoints: playerData.hasClaimedPoints,
                totalPointsAllTime: parseInt(playerData.player.totalPointsAllTime) / 1000000,
                firstGameAt: parseInt(playerData.player.firstGameAt),
                updatedAt: parseInt(playerData.updatedAt),
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
                seasonId: "0",
                lastUpdate: new Date().toISOString(),
                topScore: leaderboard[0]?.score || 0,
                topStreak: Math.max(...leaderboard.map(p => p.streak), 0),
                topMaxClicks: Math.max(...leaderboard.map(p => p.maxClicks), 0),
                source: 'the-graph-subgraph',
                processingTimeMs: processingTime,
                privyUsersCount: Object.keys(privyMap).length,
                graphqlPlayersCount: graphqlData.playerSeasonDatas.length
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
export async function getUserRank(walletAddress) {
    try {
        const { leaderboard } = await getLeaderboard();

        const userEntry = leaderboard.find(
            entry => entry.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        );

        return userEntry || null;
    } catch (error) {
        console.error('Error fetching user rank:', error);
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