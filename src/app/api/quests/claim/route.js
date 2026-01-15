// app/api/quests/claim/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseAbi, keccak256, encodePacked } from 'viem';
import { verifyAndGetUser } from '@/lib/privyClient';
import { publicClient, publicClientEth } from '@/utils/chainConfig';
import { signMessageQuests } from '@/lib/walletBackend';
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, DIGIT_RABBITS_CHAT_ABI, DIGIT_RABBITS_CHAT_ADDRESS } from '@/utils/chainConfig';

// ERC721 ABI
const erc721Abi = parseAbi([
    'function balanceOf(address owner) view returns (uint256)'
]);

const NFT_ADDRESS = process.env.ERC721_DIGIT_RABBITS_CONTRACT_ADDRESS;

/**
 * ✅ Configuration centralisée des quêtes
 * C'EST ICI que sont définis les montants de récompense
 */
const QUEST_CONFIG = {
    daily_messages: {
        type: 'daily',
        calculateTarget: (streak) => 10 + (streak - 1) * 2,
        calculateReward: (streak) => (10 + (streak - 1) * 2) * 10 ** 6, // avec 6 decimals
    },
    daily_streak: {
        type: 'daily',
        calculateTarget: (streak) => 1,
        calculateReward: (streak) => (10 + (streak - 1) * 2) * 10 ** 6,
    },
    daily_hold: {
        type: 'daily',
        calculateTarget: (streak) => streak,
        calculateReward: (streak) => (100 * streak) * 10 ** 6,
    },
    weekly_messages: {
        type: 'weekly',
        calculateTarget: (streak) => 1000,
        calculateReward: (streak) => 500 * 10 ** 6,
    },
    weekly_games: {
        type: 'weekly',
        calculateTarget: (streak) => 14,
        calculateReward: (streak) => 1000 * 10 ** 6,
    }
};

/**
 * Obtenir la clé de période actuelle
 */
function getCurrentPeriodKey(period) {
    const now = new Date();

    if (period === 'daily') {
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (period === 'weekly') {
        const weekNumber = getWeekNumber(now);
        return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
    }

    return '';
}

/**
 * Obtenir le numéro de semaine ISO
 */
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Vérifier le nombre de NFTs possédés
 */
async function checkNFTBalance(allLinkedWallets) {
    try {
        const balances = await publicClientEth.multicall({
            contracts: allLinkedWallets.map(address => ({
                address: NFT_ADDRESS,
                abi: erc721Abi,
                functionName: 'balanceOf',
                args: [address],
            })),
        });
        const balance = balances.reduce((total, bal) => total + Number(bal.result), 0);

        return Number(balance);
    } catch (error) {
        console.error('Error checking NFT balance:', error);
        return 0;
    }
}

/**
 * Valider la completion d'une quête
 */
async function validateQuestCompletion(
    questId,
    playerAddress,
    playerData,
    allLinkedWallets,
    lastQuestClaimTime
) {
    try {
        const streak = Number(playerData[4]); // streak
        const gamePlayed = Number(playerData[7]); // gamePlayed
        const now = Math.floor(Date.now() / 1000);

        // ✅ Récupérer la config de la quête
        const questConfig = QUEST_CONFIG[questId];
        if (!questConfig) {
            return {
                success: false,
                error: 'Unknown quest ID'
            };
        }

        // Définir le cooldown basé sur le type
        const cooldown = questConfig.type === 'daily' ? 24 * 60 * 60 : 7 * 24 * 60 * 60;

        // ✅ Vérifier que le cooldown est écoulé
        if (lastQuestClaimTime > 0 && now < lastQuestClaimTime + cooldown) {
            const remaining = lastQuestClaimTime + cooldown - now;
            return {
                success: false,
                error: `Cooldown not elapsed. Remaining: ${remaining}s`
            };
        }

        // ✅ Calculer la target depuis la config
        const target = questConfig.calculateTarget(streak);

        switch (questId) {
            case 'daily_messages': {
                const messageCount = await publicClient.readContract({
                    address: DIGIT_RABBITS_CHAT_ADDRESS,
                    abi: DIGIT_RABBITS_CHAT_ABI,
                    functionName: 'getUserMessageCountInLastDays',
                    args: [playerAddress, 1n]
                });

                if (Number(messageCount) < target) {
                    return {
                        success: false,
                        error: `Need ${target} messages, currently at ${messageCount}`
                    };
                }
                break;
            }

            case 'daily_streak': {
                if (streak < target) {
                    return {
                        success: false,
                        error: 'No active streak'
                    };
                }
                break;
            }

            case 'daily_hold': {
                const nftBalance = await checkNFTBalance(allLinkedWallets);

                if (nftBalance < target) {
                    return {
                        success: false,
                        error: `Need ${target} NFTs, currently holding ${nftBalance}`
                    };
                }
                break;
            }

            case 'weekly_messages': {
                const messageCount = await publicClient.readContract({
                    address: DIGIT_RABBITS_CHAT_ADDRESS,
                    abi: DIGIT_RABBITS_CHAT_ABI,
                    functionName: 'getUserMessageCountInLastDays',
                    args: [playerAddress, 7n]
                });

                if (Number(messageCount) < target) {
                    return {
                        success: false,
                        error: `Need ${target} messages this week, currently at ${messageCount}`
                    };
                }
                break;
            }

            case 'weekly_games': {
                if (gamePlayed < target) {
                    return {
                        success: false,
                        error: `Need ${target} games, currently at ${gamePlayed}`
                    };
                }
                break;
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Validation error:', error);
        return {
            success: false,
            error: `Validation error: ${error.message}`
        };
    }
}

/**
 * POST /api/quests/claim
 * ✅ L'API calcule elle-même le montant de la récompense
 */
export async function POST(request) {
    try {
        // Rien d'autre que le questId et playerAddress ne sont nécessaires
        const { questId, playerAddress } = await request.json();

        // 1️⃣ Validation des paramètres
        if (!questId || !playerAddress) {
            return NextResponse.json({
                success: false,
                error: 'Missing required parameters'
            }, { status: 400 });
        }

        // ✅ Vérifier que le questId existe dans la config
        const questConfig = QUEST_CONFIG[questId];
        if (!questConfig) {
            return NextResponse.json({
                success: false,
                error: 'Invalid quest ID'
            }, { status: 400 });
        }

        // 2️⃣ Vérifier l'authentification via Privy
        const cookieStore = await cookies();
        const idToken = cookieStore.get('privy-id-token')?.value;

        if (!idToken) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        const user = await verifyAndGetUser(idToken);

        const allLinkedWallets = user.linkedAccounts.filter(
            (account) => account.type === 'wallet'
        );

        // Vérifier que l'adresse correspond à l'embedded wallet
        const embeddedWallet = user.linkedAccounts.find(
            (account) => account.type === 'wallet' && account.walletClientType === 'privy'
        );

        if (!embeddedWallet) {
            return NextResponse.json({
                success: false,
                error: 'No embedded wallet found'
            }, { status: 403 });
        }

        const normalizedPlayerAddress = playerAddress.toLowerCase();
        const isAuthorized = embeddedWallet.address.toLowerCase() === normalizedPlayerAddress;

        if (!isAuthorized) {
            return NextResponse.json({
                success: false,
                error: 'Address does not belong to authenticated user'
            }, { status: 403 });
        }

        // 3️⃣ Récupérer les données du joueur depuis le smart contract
        const seasonId = await publicClient.readContract({
            address: DIGIT_RABBITS_ADDRESS,
            abi: DIGIT_RABBITS_ABI,
            functionName: 'currentSeasonId'
        });

        const playerData = await publicClient.readContract({
            address: DIGIT_RABBITS_ADDRESS,
            abi: DIGIT_RABBITS_ABI,
            functionName: 'getPlayerData',
            args: [playerAddress, seasonId]
        });

        const streak = Number(playerData[4]);

        // 4️⃣ ✅ CALCULER le montant de la récompense côté serveur
        const rewardAmount = questConfig.calculateReward(streak);

        console.log(`💰 Calculated reward for ${questId}: ${rewardAmount} (streak: ${streak})`);

        // 5️⃣ Récupérer le dernier claim time
        const lastQuestClaimTime = await publicClient.readContract({
            address: DIGIT_RABBITS_ADDRESS,
            abi: DIGIT_RABBITS_ABI,
            functionName: 'getLastQuestClaimTime',
            args: [playerAddress, questId]
        });

        // 6️⃣ Valider les conditions de la quête
        const validation = await validateQuestCompletion(
            questId,
            playerAddress,
            playerData,
            allLinkedWallets,
            Number(lastQuestClaimTime)
        );

        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: validation.error
            }, { status: 400 });
        }

        // 7️⃣ Générer un nonce unique
        const nonce = Date.now() + Math.floor(Math.random() * 1000000);

        // 8️⃣ Créer la période et le type
        const period = questConfig.type;
        const periodKey = getCurrentPeriodKey(period);
        const periodType = period === 'daily' ? 0 : 1;

        // 9️⃣ Signer avec le wallet backend
        const signature = await signMessageQuests(
            playerAddress,
            questId,
            periodKey,
            periodType,
            rewardAmount,
            nonce
        );

        console.log(`✅ Quest claim validated: ${questId} for ${playerAddress}`);
        console.log(`   Period: ${periodKey} | Reward: ${rewardAmount} | Nonce: ${nonce}`);

        // 🔟 Retourner les données pour le claim on-chain
        return NextResponse.json({
            success: true,
            data: {
                questId,
                periodKey,
                periodType,
                rewardAmount: Number(rewardAmount),
                nonce,
                signature,
                message: 'Quest validated. Call claimQuest() on-chain to claim rewards.'
            }
        });

    } catch (error) {
        console.error('Error in quest claim:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}

/**
 * GET /api/quests/claim?playerAddress=0x...&questIds=daily_messages,daily_streak&period=daily
 * Récupérer les quêtes déjà claim pour un joueur + les cooldowns restants
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const playerAddress = searchParams.get('playerAddress');
        const questIdsParam = searchParams.get('questIds');
        const period = searchParams.get('period') || 'daily';

        // 2️⃣ Vérifier l'authentification via Privy
        const cookieStore = await cookies();
        const idToken = cookieStore.get('privy-id-token')?.value;

        if (!idToken) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        const user = await verifyAndGetUser(idToken);

        if (!playerAddress || !questIdsParam) {
            return NextResponse.json({
                success: false,
                error: 'Missing playerAddress or questIds parameter'
            }, { status: 400 });
        }

        const questIds = questIdsParam.split(',').map(id => id.trim());
        const periodKey = getCurrentPeriodKey(period);

        let claimedQuestsArray = [];
        let cooldowns = {};

        try {
            // ✅ Interroger directement le smart contract pour les claims
            claimedQuestsArray = await publicClient.readContract({
                address: DIGIT_RABBITS_ADDRESS,
                abi: DIGIT_RABBITS_ABI,
                functionName: 'getClaimedQuests',
                args: [playerAddress, questIds, periodKey]
            });

            // ✅ Récupérer les cooldowns pour chaque quête
            const now = Math.floor(Date.now() / 1000);
            const cooldownDuration = period === 'daily' ? 24 * 60 * 60 : 7 * 24 * 60 * 60;

            for (const questId of questIds) {
                try {
                    const lastClaimTime = await publicClient.readContract({
                        address: DIGIT_RABBITS_ADDRESS,
                        abi: DIGIT_RABBITS_ABI,
                        functionName: 'getLastQuestClaimTime',
                        args: [playerAddress, questId]
                    });

                    const lastClaimTimeNum = Number(lastClaimTime);

                    if (lastClaimTimeNum > 0) {
                        const nextClaimTime = lastClaimTimeNum + cooldownDuration;
                        const remaining = Math.max(0, nextClaimTime - now);
                        cooldowns[questId] = remaining;
                    } else {
                        cooldowns[questId] = 0;
                    }
                } catch (error) {
                    console.warn(`Failed to get cooldown for ${questId}:`, error.message);
                    cooldowns[questId] = 0;
                }
            }

        } catch (contractError) {
            console.warn('SC call failed, returning all unclaimed:', contractError.message);
            // Si l'appel SC échoue, retourner tous les quêtes comme non-claim avec cooldown 0
            claimedQuestsArray = new Array(questIds.length).fill(false);
            cooldowns = questIds.reduce((acc, questId) => {
                acc[questId] = 0;
                return acc;
            }, {});
        }

        // ✅ Construire la réponse avec tous les quêtes, claim ou non
        const claimStatus = questIds.reduce((acc, questId, index) => {
            acc[questId] = claimedQuestsArray[index] === true;
            return acc;
        }, {});

        const claimedQuests = Object.entries(claimStatus)
            .filter(([_, isClaimed]) => isClaimed)
            .map(([questId, _]) => questId);


        const allLinkedWallets = user?.linkedAccounts
            ?.filter(acc => acc.chainType === 'ethereum')
            .map(acc => acc.address) // ← Extraire les adresses
            || [];

        // Récupérer le nombre de NFTs détenus par le joueur par la requête GET
        const balance = await checkNFTBalance(allLinkedWallets);

        return NextResponse.json({
            success: true,
            data: {
                playerAddress,
                period,
                periodKey,
                questIds,          // ✅ Toutes les quêtes demandées
                claimedQuests,      // ✅ Seulement celles qui sont claim
                claimStatus,        // ✅ Map complète de chaque quête
                cooldowns,          // ✅ NOUVEAU: Map des cooldowns en secondes
                holdings: balance,
                totalQuestCount: questIds.length,
                claimedCount: claimedQuests.length
            }
        });

    } catch (error) {
        console.error('Error fetching claimed quests:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
