// lib/leaderboard.js
import { PrivyClient } from '@privy-io/server-auth';
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, publicClient } from '@/utils/constants';

// Configuration
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

// Client Privy
const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

// Cache pour éviter les appels répétés
let leaderboardCache = {
    data: null,
    lastUpdate: 0,
    isUpdating: false
};

// Cache pour le top clicker
let topClickerCache = {
    data: null,
    lastUpdate: 0,
    isUpdating: false
};

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes en millisecondes
const PRECISION = 1000000; // 1e6 comme dans le contrat

/**
 * Récupère tous les utilisateurs de Privy
 */
async function getPrivyUsers() {
    try {
        const users = await privy.getUsers();
        return users;
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs Privy:', error);
        throw error;
    }
}

/**
 * Récupère les données du contrat
 */
async function getContractData() {
    try {
        const [currentSeasonId, playersData] = await Promise.all([
            publicClient.readContract({
                address: DIGIT_RABBITS_ADDRESS,
                abi: DIGIT_RABBITS_ABI,
                functionName: 'currentSeasonId'
            }),
            publicClient.readContract({
                address: DIGIT_RABBITS_ADDRESS,
                abi: DIGIT_RABBITS_ABI,
                functionName: 'getAllPlayersSeasonData'
            })
        ]);

        return {
            currentSeasonId,
            addresses: playersData[0],
            scores: playersData[1],
            totalClicks: playersData[2],
            itemsList: playersData[3],
            streak: playersData[4],
            hasClaimedPoints: playersData[5]
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des données du contrat:', error);
        throw error;
    }
}

/**
 * Récupère les données du top clicker depuis le contrat
 */
async function getTopClickerFromContract() {
    try {
        const topClickerData = await publicClient.readContract({
            address: DIGIT_RABBITS_ADDRESS,
            abi: DIGIT_RABBITS_ABI,
            functionName: 'getTopClicker'
        });

        return {
            topPlayer: topClickerData[0],
            maxClicks: topClickerData[1],
            totalClicks: topClickerData[2]
        };
    } catch (error) {
        console.error('Erreur lors de la récupération du top clicker:', error);
        throw error;
    }
}

/**
 * Trouve un utilisateur Privy par son adresse wallet
 */
function findPrivyUserByWallet(users, walletAddress) {
    // The address to find, in lowercase for case-insensitive comparison.
    const lowercasedWalletAddress = walletAddress.toLowerCase();

    return users.find(user => {
        // First, check if the user has an embedded wallet and if its address matches.
        // The embedded wallet is a top-level property on the user object.
        if (user.wallet && user.wallet.address.toLowerCase() === lowercasedWalletAddress) {
            return true;
        }

        // If no match is found, check the user's externally linked accounts.
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
    if (!user || !user.linkedAccounts) {
        return {
            username: null,
            avatar: null,
            displayName: null
        };
    }

    const twitterAccount = user.twitter
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
 * Calcule le leaderboard principal
 */
async function calculateLeaderboard() {
    try {
        console.log('Début du calcul du leaderboard...');

        // Récupération des données en parallèle
        const [privyUsers, contractData] = await Promise.all([
            getPrivyUsers(),
            getContractData()
        ]);

        console.log(`Utilisateurs Privy trouvés: ${privyUsers.length}`);
        console.log(`Joueurs dans le contrat: ${contractData.addresses.length}`);

        // Construction du leaderboard
        const leaderboard = [];

        for (let i = 0; i < contractData.addresses.length; i++) {
            const walletAddress = contractData.addresses[i];
            const score = contractData.scores[i];
            const totalClicks = contractData.totalClicks[i];
            const streak = contractData.streak[i];
            const hasClaimedPoints = contractData.hasClaimedPoints[i];

            // Conversion des points (diviser par PRECISION)
            const displayScore = Number(score) / PRECISION;

            // Recherche de l'utilisateur Privy correspondant
            const privyUser = findPrivyUserByWallet(privyUsers, walletAddress);
            const twitterInfo = getTwitterInfo(privyUser);

            // Si l'utilisateur n'existe pas dans notre liste privy il est exclu du leaderboard
            if (twitterInfo) {
                // Ajout au leaderboard
                leaderboard.push({
                    rank: 0, // Sera calculé après le tri
                    walletAddress,
                    score: displayScore,
                    totalClicks: parseInt(totalClicks, 10),
                    streak: Number(streak),
                    hasClaimedPoints,
                    twitter: {
                        username: twitterInfo.username,
                        avatar: twitterInfo.avatar,
                        displayName: twitterInfo.displayName
                    },
                    /*user: {
                        id: privyUser?.id,
                        createdAt: privyUser?.created_at
                    }*/
                });
            }

        }

        // Tri par score décroissant
        leaderboard.sort((a, b) => b.score - a.score);

        // Attribution des rangs
        leaderboard.forEach((player, index) => {
            player.rank = index + 1;
        });

        console.log(`Leaderboard calculé avec ${leaderboard.length} joueurs`);

        return {
            leaderboard,
            metadata: {
                totalPlayers: leaderboard.length,
                currentSeasonId: Number(contractData.currentSeasonId),
                lastUpdate: new Date().toISOString(),
                topScore: leaderboard[0]?.score || 0
            }
        };

    } catch (error) {
        console.error('Erreur lors du calcul du leaderboard:', error);
        throw error;
    }
}

/**
 * Calcule les données du top clicker avec informations utilisateur
 */
async function calculateTopClicker() {
    try {
        console.log('Début du calcul du top clicker...');

        // Récupération des données en parallèle
        const [privyUsers, topClickerData] = await Promise.all([
            getPrivyUsers(),
            getTopClickerFromContract()
        ]);

        // Si aucun joueur n'est trouvé
        if (topClickerData.topPlayer === '0x0000000000000000000000000000000000000000') {
            return {
                topClicker: null,
                metadata: {
                    lastUpdate: new Date().toISOString(),
                    hasData: false
                }
            };
        }

        // Recherche de l'utilisateur Privy correspondant
        const privyUser = findPrivyUserByWallet(privyUsers, topClickerData.topPlayer);
        const twitterInfo = getTwitterInfo(privyUser);

        const topClicker = {
            walletAddress: topClickerData.topPlayer,
            maxClicks: Number(topClickerData.maxClicks),
            totalClicks: Number(topClickerData.totalClicks),
            twitter: {
                username: twitterInfo.username,
                avatar: twitterInfo.avatar,
                displayName: twitterInfo.displayName
            },
            user: {
                id: privyUser?.id,
                createdAt: privyUser?.created_at
            }
        };

        console.log(`Top clicker calculé: ${topClicker.walletAddress} avec ${topClicker.maxClicks} max clicks`);

        return {
            topClicker,
            metadata: {
                lastUpdate: new Date().toISOString(),
                hasData: true
            }
        };

    } catch (error) {
        console.error('Erreur lors du calcul du top clicker:', error);
        throw error;
    }
}

/**
 * Obtient le leaderboard avec cache
 */
export async function getLeaderboard(forceRefresh = false) {
    const now = Date.now();

    // Vérifier si le cache est valide
    if (!forceRefresh &&
        leaderboardCache.data &&
        (now - leaderboardCache.lastUpdate) < CACHE_DURATION) {
        console.log('Retour du leaderboard depuis le cache');
        return leaderboardCache.data;
    }

    // Éviter les calculs multiples simultanés
    if (leaderboardCache.isUpdating) {
        console.log('Calcul en cours, attente...');
        while (leaderboardCache.isUpdating) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return leaderboardCache.data;
    }

    // Calcul du nouveau leaderboard
    leaderboardCache.isUpdating = true;

    try {
        const result = await calculateLeaderboard();

        // Mise à jour du cache
        leaderboardCache.data = result;
        leaderboardCache.lastUpdate = now;

        return result;
    } finally {
        leaderboardCache.isUpdating = false;
    }
}

/**
 * Obtient le top clicker avec cache
 */
export async function getTopClicker(forceRefresh = false) {
    const now = Date.now();

    // Vérifier si le cache est valide
    if (!forceRefresh &&
        topClickerCache.data &&
        (now - topClickerCache.lastUpdate) < CACHE_DURATION) {
        console.log('Retour du top clicker depuis le cache');
        return topClickerCache.data;
    }

    // Éviter les calculs multiples simultanés
    if (topClickerCache.isUpdating) {
        console.log('Calcul du top clicker en cours, attente...');
        while (topClickerCache.isUpdating) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return topClickerCache.data;
    }

    // Calcul du nouveau top clicker
    topClickerCache.isUpdating = true;

    try {
        const result = await calculateTopClicker();

        // Mise à jour du cache
        topClickerCache.data = result;
        topClickerCache.lastUpdate = now;

        return result;
    } finally {
        topClickerCache.isUpdating = false;
    }
}

/**
 * Démarre la mise à jour automatique du leaderboard et du top clicker
 */
export function startLeaderboardUpdater() {
    console.log('Démarrage de la mise à jour automatique du leaderboard et top clicker (15 min)');

    // Première exécution
    Promise.all([
        getLeaderboard(true).catch(console.error),
        getTopClicker(true).catch(console.error)
    ]);

    // Puis toutes les 15 minutes
    setInterval(() => {
        console.log('Mise à jour automatique du leaderboard et top clicker...');
        Promise.all([
            getLeaderboard(true).catch(console.error),
            getTopClicker(true).catch(console.error)
        ]);
    }, CACHE_DURATION);
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
            metadata
        };
    } catch (error) {
        console.error('Erreur lors de la récupération du top players:', error);
        return { topPlayers: [], metadata: null };
    }
}

/**
 * Obtient les données complètes du leaderboard avec le top clicker
 */
export async function getCompleteLeaderboardData(forceRefresh = false) {
    try {
        const [leaderboardData, topClickerData] = await Promise.all([
            getLeaderboard(forceRefresh),
            getTopClicker(forceRefresh)
        ]);

        return {
            topPlayers: leaderboardData.leaderboard,
            topClicker: topClickerData.topClicker,
            metadata: {
                ...leaderboardData.metadata,
                topClickerLastUpdate: topClickerData.metadata.lastUpdate,
                hasTopClickerData: topClickerData.metadata.hasData
            }
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des données complètes:', error);
        throw error;
    }
}