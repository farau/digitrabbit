// lib/leaderboard.js
import { PrivyClient } from '@privy-io/server-auth';

// Configuration
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_METH_ENDPOINT || process.env.NEXT_PUBLIC_GRAPHQL_METH_ENDPOINT;

// Client Privy
const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

// Cache unifié avec gestion des états
let cacheStore = {
    privyUsers: {
        data: null,
        lastUpdate: 0,
        isUpdating: false
    },
    leaderboard: {
        data: null,
        lastUpdate: 0,
        isUpdating: false
    }
};

const CACHE_DURATION = 7 * 60 * 1000; // 7 minutes
const REQUEST_TIMEOUT = 25000; // 25 secondes timeout pour GraphQL
const PRIVY_TIMEOUT = 15000; // 15 secondes timeout pour Privy

/**
 * Vérifie si le cache est encore valide
 */
function isCacheValid(cacheKey) {
    const cache = cacheStore[cacheKey];
    return cache.data && (Date.now() - cache.lastUpdate) < CACHE_DURATION;
}

/**
 * Attend qu'une mise à jour en cours se termine
 */
async function waitForUpdate(cacheKey, maxWait = 30000) {
    const cache = cacheStore[cacheKey];
    const startTime = Date.now();

    while (cache.isUpdating && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return cache.data;
}

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
            signal: controller.signal
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
        console.log(`Récupération GraphQL complète: seasonId=${seasonId}`);

        let allResults = [];
        let hasMore = true;
        let skip = 0;
        const limit = 1000; // Taille de page (ajustez selon les limites de votre API)

        while (hasMore) {
            console.log(`Récupération page: skip=${skip}, limit=${limit}`);

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

            console.log(`Page récupérée: ${currentResults.length} éléments, Total: ${allResults.length}`);

            // Petite pause pour éviter de surcharger l'API (optionnel)
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log(`Récupération terminée: ${allResults.length} éléments au total`);

        return {
            playerSeasonDatas: allResults
        };

    } catch (error) {
        console.error('Erreur getLeaderboardFromGraphQL:', error);
        throw error;
    }
}

/**
 * Récupère tous les utilisateurs de Privy avec cache et protection contre les appels multiples
 */
async function getPrivyUsers(forceRefresh = false) {
    const cache = cacheStore.privyUsers;

    // Vérifier le cache d'abord
    if (!forceRefresh && isCacheValid('privyUsers')) {
        console.log('Utilisation du cache Privy');
        return cache.data;
    }

    // Si une mise à jour est déjà en cours, attendre
    if (cache.isUpdating) {
        console.log('Mise à jour Privy en cours, attente...');
        return await waitForUpdate('privyUsers');
    }

    // Marquer comme en cours de mise à jour
    cache.isUpdating = true;

    try {
        console.log('Récupération des utilisateurs Privy...');

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

        console.log(`${users.length} utilisateurs Privy récupérés`);

        // Mise à jour du cache
        cache.data = users;
        cache.lastUpdate = Date.now();

        return users;
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs Privy:', error);

        // En cas d'erreur, retourner les données du cache si disponibles
        if (cache.data) {
            console.log('Utilisation des données Privy en cache suite à l\'erreur');
            return cache.data;
        }

        // Sinon retourner un tableau vide
        return [];
    } finally {
        cache.isUpdating = false;
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

/**
 * Calcule le leaderboard principal avec cache unifié
 */
async function calculateLeaderboard(forceRefresh = false) {
    const cache = cacheStore.leaderboard;

    // Vérifier le cache d'abord
    if (!forceRefresh && isCacheValid('leaderboard')) {
        console.log('Utilisation du cache leaderboard');
        return cache.data;
    }

    // Si une mise à jour est déjà en cours, attendre
    if (cache.isUpdating) {
        console.log('Calcul du leaderboard en cours, attente...');
        return await waitForUpdate('leaderboard');
    }

    // Marquer comme en cours de mise à jour
    cache.isUpdating = true;
    const startTime = Date.now();

    try {
        console.log('Calcul du leaderboard...');

        // Récupération des données en parallèle
        const [privyUsers, graphqlData] = await Promise.all([
            getPrivyUsers(forceRefresh).catch(err => {
                console.warn('Erreur Privy, continue sans:', err.message);
                return [];
            }),
            getLeaderboardFromGraphQL()
        ]);

        console.log(`GraphQL: ${graphqlData.playerSeasonDatas.length} joueurs`);
        console.log(`Privy: ${privyUsers.length} utilisateurs`);

        // Construction du leaderboard
        const leaderboard = [];

        graphqlData.playerSeasonDatas.forEach((playerData, index) => {
            // ===== ADAPTATION AUX NOUVELLES DONNÉES DU SUBGRAPH =====
            const playerAddress = playerData.player.address;

            // Recherche de l'utilisateur Privy correspondant
            const privyUser = findPrivyUserByWallet(privyUsers, playerAddress);
            const twitterInfo = getTwitterInfo(privyUser);

            // Convertir le score de micro-points à points (divisé par 1000000)
            const scoreInPoints = parseInt(playerData.score) / 1000000;

            // Inclure tous les joueurs, même sans Twitter
            leaderboard.push({
                rank: index + 1,
                walletAddress: playerAddress,
                score: scoreInPoints, // Score en points (pas en micro-points)
                totalClicks: parseInt(playerData.totalClicks),
                gameClicks: parseInt(playerData.gameClicks),
                streak: parseInt(playerData.streak),
                maxClicks: parseInt(playerData.maxClicks),
                hasClaimedPoints: playerData.hasClaimedPoints,
                totalPointsAllTime: parseInt(playerData.player.totalPointsAllTime) / 1000000, // Points tous les temps
                firstGameAt: parseInt(playerData.player.firstGameAt),
                updatedAt: parseInt(playerData.updatedAt),
                twitter: {
                    username: twitterInfo.username,
                    avatar: twitterInfo.avatar,
                    displayName: twitterInfo.displayName
                },
                user: {
                    createdAt: privyUser?.createdAt
                }
            });
        });

        const processingTime = Date.now() - startTime;
        console.log(`Leaderboard calculé en ${processingTime}ms avec ${leaderboard.length} joueurs`);

        const result = {
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
                privyUsersCount: privyUsers.length,
                graphqlPlayersCount: graphqlData.playerSeasonDatas.length
            }
        };

        // Mise à jour du cache
        cache.data = result;
        cache.lastUpdate = Date.now();

        return result;

    } catch (error) {
        console.error('Erreur lors du calcul du leaderboard:', error);

        // En cas d'erreur, retourner les données du cache si disponibles
        if (cache.data) {
            console.log('Utilisation des données leaderboard en cache suite à l\'erreur');
            return cache.data;
        }

        throw error;
    } finally {
        cache.isUpdating = false;
    }
}

/**
 * Obtient le leaderboard
 */
export async function getLeaderboard(forceRefresh = false) {
    if (forceRefresh) {
        console.log('Force refresh demandé - invalidation des caches');
        cacheStore.leaderboard.lastUpdate = 0;
    }

    return await calculateLeaderboard(forceRefresh);
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
        console.error('Erreur lors de la récupération du rang utilisateur:', error);
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
        console.error('Erreur lors de la récupération du top players:', error);
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
        console.error('Erreur lors de la récupération des top streakers:', error);
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
        console.error('Erreur lors de la récupération des top clickers:', error);
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
        console.error('Erreur lors de la récupération des stats:', error);
        return null;
    }
}

/**
 * Obtient les données complètes du leaderboard
 */
export async function getCompleteLeaderboardData(forceRefresh = false) {
    try {
        const [leaderboardData] = await Promise.all([
            getLeaderboard(forceRefresh)
        ]);

        return {
            topPlayers: leaderboardData.leaderboard,
            metadata: {
                ...leaderboardData.metadata,
            }
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des données complètes:', error);
        throw error;
    }
}

/**
 * Démarre la mise à jour automatique
 */
export function startLeaderboardUpdater() {
    console.log('Démarrage de la mise à jour automatique du leaderboard (15 min)');

    // Première exécution
    Promise.all([
        getLeaderboard(true).catch(console.error)
    ]);

    // Puis toutes les 15 minutes
    setInterval(() => {
        console.log('Mise à jour automatique du leaderboard...');
        Promise.all([
            getLeaderboard(true).catch(console.error)
        ]);
    }, CACHE_DURATION);
}

/**
 * Fonction utilitaire pour vider le cache manuellement
 */
export function clearCache() {
    Object.keys(cacheStore).forEach(key => {
        cacheStore[key].data = null;
        cacheStore[key].lastUpdate = 0;
        cacheStore[key].isUpdating = false;
    });
    console.log('Cache vidé manuellement');
}
