// lib/leaderboard.js
import { PrivyClient } from '@privy-io/server-auth';
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, publicClient } from '@/constants';

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
                    totalClicks: Number(totalClicks),
                    streak: Number(streak),
                    hasClaimedPoints,
                    twitter: {
                        username: twitterInfo.username,
                        avatar: twitterInfo.avatar,
                        displayName: twitterInfo.displayName
                    },
                    user: {
                        id: privyUser?.id,
                        createdAt: privyUser?.created_at
                    }
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
 * Démarre la mise à jour automatique du leaderboard
 */
export function startLeaderboardUpdater() {
    console.log('Démarrage de la mise à jour automatique du leaderboard (15 min)');

    // Première exécution
    getLeaderboard(true).catch(console.error);

    // Puis toutes les 15 minutes
    setInterval(() => {
        console.log('Mise à jour automatique du leaderboard...');
        getLeaderboard(true).catch(console.error);
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