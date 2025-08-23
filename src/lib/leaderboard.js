// lib/leaderboard.js
import { PrivyClient } from '@privy-io/server-auth';

// Configuration
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;

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

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
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

            const query = `
                query GetLeaderboard($seasonId: String!, $skip: Int!, $limit: Int!) {
                    playerSeasonStats_collection(
                        orderBy: leaderboardScore
                        orderDirection: desc
                        where: { seasonId: $seasonId, gamesPlayed_gt: 0 }
                        skip: $skip
                        first: $limit
                    ) {
                        leaderboardScore
                        totalClicks
                        bestClicksInGame
                        averageClicks
                        currentStreak
                        longestStreak
                        player {
                            walletAddress
                            totalPointsClaimed
                            itemsBought {
                                id
                            }
                        }
                    }
                }
            `;

            const variables = {
                seasonId: seasonId,
                skip: skip,
                limit: limit
            };

            const data = await executeGraphQLQuery(query, variables);

            if (!data.playerSeasonStats_collection) {
                throw new Error('Format de réponse GraphQL invalide');
            }

            const currentResults = data.playerSeasonStats_collection;
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
            playerSeasonStats_collection: allResults
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

        console.log(`GraphQL: ${graphqlData.playerSeasonStats_collection.length} joueurs`);
        console.log(`Privy: ${privyUsers.length} utilisateurs`);

        // Construction du leaderboard
        const leaderboard = [];

        graphqlData.playerSeasonStats_collection.forEach((playerData, index) => {
            const walletAddress = playerData.player.walletAddress;
            // Recherche de l'utilisateur Privy correspondant
            const privyUser = findPrivyUserByWallet(privyUsers, walletAddress);
            const twitterInfo = getTwitterInfo(privyUser);

            // Traitement des items achetés
            const itemsBought = playerData.player.itemsBought || [];
            const itemsCount = itemsBought.length;
            const itemIds = itemsBought.map(item => item.id);

            // Inclure tous les joueurs, même sans Twitter
            leaderboard.push({
                rank: index + 1,
                walletAddress,
                score: playerData.leaderboardScore / 10 ** 6,
                totalClicks: playerData.totalClicks,
                totalPointsClaimed: playerData.player.totalPointsClaimed,
                bestClicksInGame: playerData.bestClicksInGame,
                averageClicks: playerData.averageClicks,
                currentStreak: playerData.currentStreak,
                longestStreak: playerData.longestStreak,
                itemsBought: {
                    count: itemsCount,
                    items: itemIds
                },
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
                source: 'graphql',
                processingTimeMs: processingTime,
                privyUsersCount: privyUsers.length,
                graphqlPlayersCount: graphqlData.playerSeasonStats_collection.length,
                totalItemsBought: leaderboard.reduce((sum, player) => sum + player.itemsBought.count, 0)
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
        // Invalider seulement les caches concernés, pas Privy qui peut être réutilisé
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
 * Obtient les joueurs ayant acheté le plus d'items
 */
export async function getTopItemBuyers(limit = 10) {
    try {
        const { leaderboard } = await getLeaderboard();

        // Trier par nombre d'items achetés
        const sortedByItems = leaderboard
            .filter(player => player.itemsBought.count > 0)
            .sort((a, b) => b.itemsBought.count - a.itemsBought.count)
            .slice(0, limit);

        return {
            topItemBuyers: sortedByItems,
            metadata: {
                totalPlayersWithItems: leaderboard.filter(p => p.itemsBought.count > 0).length,
                lastUpdate: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des top item buyers:', error);
        return { topItemBuyers: [], metadata: null };
    }
}

/**
 * Obtient les statistiques sur les items achetés
 */
export async function getItemsStats() {
    try {
        const { leaderboard } = await getLeaderboard();

        const playersWithItems = leaderboard.filter(p => p.itemsBought.count > 0);
        const totalItems = leaderboard.reduce((sum, p) => sum + p.itemsBought.count, 0);

        // Comptage des items par ID
        const itemsCountById = {};
        leaderboard.forEach(player => {
            player.itemsBought.items.forEach(itemId => {
                itemsCountById[itemId] = (itemsCountById[itemId] || 0) + 1;
            });
        });

        // Items les plus populaires
        const popularItems = Object.entries(itemsCountById)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([itemId, count]) => ({ itemId, count }));

        return {
            totalItems,
            playersWithItems: playersWithItems.length,
            averageItemsPerPlayer: totalItems / leaderboard.length,
            averageItemsPerBuyer: totalItems / playersWithItems.length,
            popularItems,
            uniqueItems: Object.keys(itemsCountById).length,
            metadata: {
                lastUpdate: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des stats items:', error);
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
 * Démarre la mise à jour automatique (comme dans l'ancien fichier)
 */
export function startLeaderboardUpdater() {
    console.log('Démarrage de la mise à jour automatique du leaderboard (15 min)');

    // Première exécution
    Promise.all([
        getLeaderboard(true).catch(console.error)
    ]);

    // Puis toutes les 15 minutes
    setInterval(() => {
        console.log('Mise à jour automatique du leaderboard et top clicker...');
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