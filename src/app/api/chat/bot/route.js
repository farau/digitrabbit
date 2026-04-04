import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { unstable_cache } from 'next/cache'
import * as Sentry from '@sentry/nextjs'
import { verifyAndGetUser } from '@/lib/privyClient'
import { buildRabbitBotReply } from '@/lib/rabbitBot'
import { sendRabbitBotAwardPoints, sendRabbitBotChatMessage } from '@/lib/walletBackend'
import {
    publicClient,
    DIGIT_RABBITS_ABI,
    DIGIT_RABBITS_ADDRESS
} from '@/utils/chainConfig'

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
const RABBITBOT_MAX_INPUT_LENGTH = Math.max(Number(process.env.RABBITBOT_MAX_INPUT_LENGTH || 200), 20)
const RABBITBOT_ENABLED = process.env.RABBITBOT_ENABLED !== '0'
const RABBITBOT_AWARD_ENABLED = process.env.RABBITBOT_AWARD_ENABLED === '1'
const AUTH_CACHE_TTL_SECONDS = 30

const getCachedChatUser = unstable_cache(
    async (idToken) => verifyAndGetUser(idToken),
    ['chat-bot-auth-user'],
    {
        tags: ['chat-bot-auth-user'],
        revalidate: AUTH_CACHE_TTL_SECONDS
    }
)

function isAddressLinkedToUser(user, userAddressLower) {
    const linkedAccounts = user?.linkedAccounts
    if (!Array.isArray(linkedAccounts)) return false

    for (const account of linkedAccounts) {
        if (account?.type === 'wallet' && account?.address?.toLowerCase() === userAddressLower) {
            return true
        }
    }

    return false
}

function hasAnyGameActivity(playerCurrentSeasonData) {
    if (!Array.isArray(playerCurrentSeasonData) || playerCurrentSeasonData.length < 8) {
        return false
    }

    const [
        _score,
        totalClicks,
        _gameClicks,
        sessionEndsAt,
        _streak,
        lastClaimTimestamp,
        _maxClicks,
        gamePlayed
    ] = playerCurrentSeasonData

    return (
        BigInt(totalClicks || 0) > 0n
        || BigInt(gamePlayed || 0) > 0n
        || BigInt(sessionEndsAt || 0) > 0n
        || BigInt(lastClaimTimestamp || 0) > 0n
    )
}

function parseReplyToMessageId(value) {
    if (typeof value === 'bigint') {
        return value > 0n ? value : 0n
    }

    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
        return BigInt(value)
    }

    if (typeof value === 'string' && /^\d+$/.test(value)) {
        const parsed = BigInt(value)
        return parsed > 0n ? parsed : 0n
    }

    return 0n
}

export async function POST(request) {
    if (!RABBITBOT_ENABLED) {
        return NextResponse.json({ error: 'RabbitBot is currently disabled' }, { status: 503 })
    }

    try {
        const payload = await request.json()
        const rawContent = typeof payload?.content === 'string' ? payload.content : ''
        const userAddress = typeof payload?.userAddress === 'string' ? payload.userAddress : ''
        const replyToMessageId = parseReplyToMessageId(payload?.replyToMessageId)
        const content = rawContent.trim()

        if (!content) {
            return NextResponse.json({ error: 'Empty message' }, { status: 400 })
        }

        if (content.length > RABBITBOT_MAX_INPUT_LENGTH) {
            return NextResponse.json(
                { error: `Message too long for RabbitBot (max ${RABBITBOT_MAX_INPUT_LENGTH} chars)` },
                { status: 400 }
            )
        }

        if (!ETH_ADDRESS_REGEX.test(userAddress)) {
            return NextResponse.json({ error: 'Invalid address format' }, { status: 400 })
        }

        if (replyToMessageId <= 0n) {
            return NextResponse.json(
                { error: 'Invalid replyToMessageId for RabbitBot reply' },
                { status: 400 }
            )
        }

        const cookieStore = await cookies()
        const idToken = cookieStore.get('privy-id-token')?.value

        if (!idToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const user = await getCachedChatUser(idToken)
        const normalizedAddress = userAddress.toLowerCase()
        const isAddressLinked = isAddressLinkedToUser(user, normalizedAddress)
        if (!isAddressLinked) {
            return NextResponse.json(
                { error: 'Address does not belong to authenticated user' },
                { status: 403 }
            )
        }

        // Guardrail: user must have already interacted with the game contract
        // (lightweight check; intentionally no NFT ownership re-check here).
        const playerCurrentSeasonData = await publicClient.readContract({
            address: DIGIT_RABBITS_ADDRESS,
            abi: DIGIT_RABBITS_ABI,
            functionName: 'getPlayerCurrentSeasonData',
            args: [userAddress]
        })

        if (!hasAnyGameActivity(playerCurrentSeasonData)) {
            return NextResponse.json(
                {
                    error: 'GAME_ACTIVITY_REQUIRED',
                    message: 'You must first interact with the game before using RabbitBot.'
                },
                { status: 403 }
            )
        }

        const twitterUsername = user?.twitter?.username || `Player${userAddress.slice(2, 6)}`
        const botReply = await buildRabbitBotReply({
            content,
            username: twitterUsername,
        })

        const messageResult = await sendRabbitBotChatMessage({
            content: botReply.reply,
            score: 0n,
            replyToMessageId
        })

        let awardTxHash = null
        let awardedPoints = 0n

        if (RABBITBOT_AWARD_ENABLED && botReply.rewardPoints > 0n) {
            try {
                const awardResult = await sendRabbitBotAwardPoints({
                    userAddress,
                    amount: botReply.rewardPoints,
                    reason: botReply.reason
                })
                awardTxHash = awardResult.txHash
                awardedPoints = botReply.rewardPoints
            } catch (awardError) {
                console.error('RabbitBot award failed:', awardError)
            }
        }

        const response = NextResponse.json({
            success: true,
            botTxHash: messageResult.txHash,
            awardTxHash,
            awardedPoints: awardedPoints.toString(),
            convictionScore: botReply.convictionScore,
            modelUsed: botReply.modelUsed
        })
        return response
    } catch (error) {
        console.error('Error in RabbitBot route:', error)
        const errorMessage = typeof error?.message === 'string' ? error.message : 'Unknown RabbitBot error'

        Sentry.captureException(error, {
            tags: {
                feature: 'rabbitbot',
                endpoint: '/api/chat/bot',
            },
            extra: {
                errorMessage,
            },
        })

        if (errorMessage.includes('Message cooldown not finished')) {
            return NextResponse.json(
                { error: 'RabbitBot cooldown active. Please try again in a few seconds.' },
                { status: 429 }
            )
        }

        if (errorMessage.includes('Reply to non-existent message')) {
            return NextResponse.json(
                { error: 'RabbitBot could not link the reply to your message.' },
                { status: 400 }
            )
        }

        const response = NextResponse.json(
            {
                error: 'RabbitBot failed to answer',
                ...(process.env.NODE_ENV !== 'production' ? { details: errorMessage } : {})
            },
            { status: 500 }
        )

        return response
    }
}
