// app/api/chat/send/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseAbi } from 'viem';
import { signMessageChat } from '@/lib/walletBackend';
import { publicClientEth } from '@/utils/chainConfig';
import { verifyAndGetUser } from '@/lib/privyClient';

// ERC721 ABI
const erc721Abi = parseAbi([
    'function balanceOf(address owner) view returns (uint256)'
]);

/**
 * Calculer le score d'un message (0-5)
 */
async function calculateMessageScore(content, userAddress, privyUserId) {
    // 1. Score de base selon la longueur (0-2 points)
    const length = content.length;
    let lengthBonus = 0;

    if (length < 10) {
        lengthBonus = 0;
    } else if (length < 50) {
        lengthBonus = 0.5;
    } else if (length < 100) {
        lengthBonus = 1;
    } else if (length < 200) {
        lengthBonus = 1.5;
    } else {
        lengthBonus = 2;
    }

    // 2. Score de qualité du contenu (0-2 points)
    let qualityScore = 0;
    const hasLinks = /https?:\/\//.test(content);
    const hasEmojis = /[\u{1F600}-\u{1F64F}]/u.test(content);
    const hasQuestions = /\?/.test(content);
    const words = content.split(/\s+/).length;

    // Détection de spam
    const isSpam =
        /(.)\1{4,}/.test(content) ||
        content.toUpperCase() === content ||
        /^(.+?)\1+$/.test(content);

    if (!isSpam) {
        if (words >= 5) qualityScore += 0.5;
        if (words >= 15) qualityScore += 0.5;
        if (hasQuestions) qualityScore += 0.3;
        if (hasLinks && words >= 10) qualityScore += 0.4;
        if (hasEmojis && words >= 5) qualityScore += 0.3;
    }

    qualityScore = Math.min(qualityScore, 2);

    // 3. Bonus NFT (0-1 point)
    let nftBonus = 0;
    /*const nftCount = await countUserNFTs(privyUserId);
    

    if (nftCount >= 5) {
        nftBonus = 1;
    } else if (nftCount >= 3) {
        nftBonus = 0.7;
    } else if (nftCount >= 1) {
        nftBonus = 0.4;
    }*/

    // 4. Calcul du score final
    const totalScore = lengthBonus + qualityScore + nftBonus;
    const finalScore = Math.min(Math.round(totalScore), 5);

    return {
        baseScore: finalScore,
        lengthBonus,
        nftBonus,
        qualityScore,
        finalScore
    };
}

/**
 * Compter les NFTs de l'utilisateur
 */
async function countUserNFTs(privyUserId) {
    try {
        const user = await verifyAndGetUser(privyUserId);
        const allAddresses = [];

        if (user.wallet?.address) {
            allAddresses.push(user.wallet.address);
        }

        if (user.linkedAccounts) {
            user.linkedAccounts.forEach(account => {
                if (account.type === 'wallet' && account.address) {
                    allAddresses.push(account.address);
                }
            });
        }

        let totalNFTs = 0;

        for (const address of allAddresses) {
            try {
                const balance = await publicClientEth.readContract({
                    address: process.env.ERC721_DIGIT_RABBITS_CONTRACT_ADDRESS,
                    abi: erc721Abi,
                    functionName: 'balanceOf',
                    args: [address]
                });

                totalNFTs += Number(balance);
            } catch (error) {
                console.error(`Error checking NFTs for ${address}:`, error);
            }
        }

        return totalNFTs;
    } catch (error) {
        console.error('Error counting NFTs:', error);
        return 0;
    }
}


/**
 * POST /api/chat/send
 */
export async function POST(request) {
    try {
        const { content, userAddress } = await request.json();

        // 1. Get identity token from cookie
        const cookieStore = await cookies();
        const idToken = cookieStore.get('privy-id-token')?.value;

        if (!idToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // 2. Vérifications du message
        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Empty message' }, { status: 400 });
        }

        if (content.length > 500) {
            return NextResponse.json({ error: 'Message too long' }, { status: 400 });
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
            return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
        }

        console.log('Scoring message from', userAddress);
        // 3. Calculer le score
        const scoreFactors = await calculateMessageScore(content, userAddress, idToken);

        // Extraire les infos Twitter de l'utilisateur Privy
        const user = await verifyAndGetUser(idToken);
        const twitterAccount = user?.twitter;

        const twitterUsername = twitterAccount ? twitterAccount.username : '';
        const twitterProfilePictureUrl = twitterAccount ? twitterAccount.profilePictureUrl : '';

        // 4. Générer un nonce unique
        const nonce = Date.now() + Math.floor(Math.random() * 1000000);

        // 5. Signer le message
        const signature = await signMessageChat(
            userAddress,
            content,
            scoreFactors.finalScore,
            nonce
        );

        return NextResponse.json({
            success: true,
            score: scoreFactors.finalScore,
            scoreBreakdown: scoreFactors,
            nonce,
            twitterUsername,
            twitterProfilePictureUrl,
            signature,
            message: 'Message scored and signed'
        });

    } catch (error) {
        console.error('Error in sendChatMessage:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}