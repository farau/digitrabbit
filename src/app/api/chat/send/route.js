// app/api/chat/send/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { signMessageChat } from '@/lib/walletBackend';
import { verifyAndGetUser } from '@/lib/privyClient';

const CHAT_AUTH_CACHE_TTL_SECONDS = 30;
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const CHAT_SEND_PERF_LOG_ENABLED = process.env.NODE_ENV !== 'production' || process.env.DEBUG_CHAT_PERF === '1';
const CHAT_MESSAGE_MAX_SCORE = 2;

/**
 * Calculer le score d'un message (0-2)
 */
function calculateMessageScore(content) {
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
    const finalScore = Math.min(Math.round(totalScore), CHAT_MESSAGE_MAX_SCORE);

    return {
        baseScore: finalScore,
        lengthBonus,
        nftBonus,
        qualityScore,
        finalScore
    };
}

function isAddressLinkedToUser(user, userAddressLower) {
    const linkedAccounts = user?.linkedAccounts;

    if (!Array.isArray(linkedAccounts)) {
        return false;
    }

    for (const account of linkedAccounts) {
        if (account?.type === 'wallet' && account?.address?.toLowerCase() === userAddressLower) {
            return true;
        }
    }

    return false;
}

const getCachedChatUser = unstable_cache(
    async (idToken) => verifyAndGetUser(idToken),
    ['chat-auth-user'],
    {
        tags: ['chat-auth-user'],
        revalidate: CHAT_AUTH_CACHE_TTL_SECONDS
    }
);


/**
 * POST /api/chat/send
 */
export async function POST(request) {
    const startedAt = Date.now();
    const timingsMs = {};
    const mark = (step) => {
        timingsMs[step] = Date.now() - startedAt;
    };

    try {
        const payload = await request.json();
        const rawContent = typeof payload?.content === 'string' ? payload.content : '';
        const content = rawContent.trim();
        const userAddress = typeof payload?.userAddress === 'string' ? payload.userAddress : '';
        const sendToRabbitBot = payload?.sendToRabbitBot === true;
        const normalizedAddress = userAddress.toLowerCase();
        mark('parsed_payload');

        // 1. Get identity token from cookie
        const cookieStore = await cookies();
        const idToken = cookieStore.get('privy-id-token')?.value;
        mark('id_token_loaded');

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

        if (!ETH_ADDRESS_REGEX.test(userAddress)) {
            return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
        }

        // 3. Calculer le score (pure function)
        const scoreFactors = calculateMessageScore(content);
        const effectiveScore = sendToRabbitBot ? 0 : scoreFactors.finalScore;
        mark('message_scored');

        // 4. Auth user (cached) + vérification ownership adresse
        const user = await getCachedChatUser(idToken);
        mark('auth_user_loaded');

        const isAddressLinked = isAddressLinkedToUser(user, normalizedAddress);

        if (!isAddressLinked) {
            return NextResponse.json({ error: 'Address does not belong to authenticated user' }, { status: 403 });
        }

        // Extraire les infos Twitter de l'utilisateur Privy
        const twitterAccount = user?.twitter;

        const twitterUsername = twitterAccount ? twitterAccount.username : '';
        const twitterProfilePictureUrl = twitterAccount ? twitterAccount.profilePictureUrl : '';
        mark('twitter_extracted');

        // 5. Générer un nonce unique
        const nonce = Date.now() + Math.floor(Math.random() * 1000000);
        mark('nonce_generated');

        // 6. Signer le message
        const signature = await signMessageChat(
            userAddress,
            content,
            effectiveScore,
            nonce
        );
        mark('message_signed');

        const response = NextResponse.json({
            success: true,
            score: effectiveScore,
            scoreBreakdown: {
                ...scoreFactors,
                finalScore: effectiveScore,
                botModeNoMessageScore: sendToRabbitBot
            },
            nonce,
            twitterUsername,
            twitterProfilePictureUrl,
            signature,
            message: 'Message scored and signed'
        });

        mark('response_built');

        const serverTiming = Object.entries(timingsMs)
            .map(([name, duration]) => `${name};dur=${duration}`)
            .join(', ');
        response.headers.set('Server-Timing', serverTiming);

        if (CHAT_SEND_PERF_LOG_ENABLED) {
            console.log('[chat/send][perf]', {
                userAddress,
                contentLength: content.length,
                score: effectiveScore,
                sendToRabbitBot,
                timingsMs,
                totalMs: Date.now() - startedAt
            });
        }

        return response;

    } catch (error) {
        console.error('Error in sendChatMessage:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
