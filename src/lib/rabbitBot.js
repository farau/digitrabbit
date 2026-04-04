import 'server-only'

import { OpenRouter } from '@openrouter/sdk'
import * as Sentry from '@sentry/nextjs'

const MAX_BOT_RESPONSE_LENGTH = 200

const openRouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        'HTTP-Referer': 'https://digitrabbits.com', // URL de votre app
        'X-OpenRouter-Title': 'RabbitBot Game', // Nom d'affichage de votre app
        'X-OpenRouter-Categories': 'game,general-chat', // Catégories optionnelles
    },
});


function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}

function sanitizeUserContent(content) {
    return String(content || '')
        .replace(/\s+/g, ' ')
        .trim()
}

function isLikelySpam(content) {
    return (
        /(.)\1{5,}/.test(content)
        || /^(.+?)\1{2,}$/.test(content)
        || (content.length > 0 && content === content.toUpperCase() && content.length > 20)
    )
}

function computeSoulHeuristic(content) {
    const safeContent = sanitizeUserContent(content)
    if (!safeContent) return 0
    if (isLikelySpam(safeContent)) return 0

    let soul = 1
    const lower = safeContent.toLowerCase()
    const words = safeContent.split(' ').filter(Boolean).length

    if (words >= 8) soul += 1
    if (words >= 18) soul += 1
    if (safeContent.length >= 60) soul += 1
    if (safeContent.length >= 120) soul += 1
    if (/\?/.test(safeContent)) soul += 1
    if (/because|therefore|donc|car|puisque|preuve|evidence|argument|thesis/i.test(lower)) soul += 2
    if (/community|rabbit|quest|leaderboard|season|feature|bot|onchain|game/i.test(lower)) soul += 1
    if (/(merci|thanks|please|s'il te plait|svp)/i.test(lower)) soul += 1

    return clamp(soul, 0, 10)
}

function computeRewardPoints(soulScore) {
    const soul = clamp(Number(soulScore || 0), 0, 10)
    if (soul >= 10) return 10n
    if (soul >= 9) return 8n
    if (soul >= 8) return 6n
    if (soul >= 7) return 4n
    if (soul >= 6) return 2n
    return 0n
}

function computeFallbackRewardPoints(soulScore) {
    const soul = clamp(Number(soulScore || 0), 0, 10)
    // Fallback mode is intentionally stingy to avoid abuse.
    // Only very strong messages can earn a minimal reward.
    if (soul >= 9) return 1n
    return 0n
}

function inferSoulFloorFromReply(reply) {
    const text = String(reply || '').toLowerCase()
    if (!text) return 0

    const hasNegation = /(no|not|cannot|can't|won't|pas|aucun|impossible)\s+(?:\w+\s+){0,3}(points?|rabbit\s*points?)/i.test(text)
    if (hasNegation) return 0

    const explicitPointsMatch = text.match(/(?:\+|\b)(\d{1,2})\s*(?:rabbit\s*)?points?\b/i)
    if (explicitPointsMatch) {
        const points = clamp(Number(explicitPointsMatch[1] || 0), 0, 10)
        if (points >= 10) return 10
        if (points >= 8) return 9
        if (points >= 6) return 8
        if (points >= 4) return 7
        if (points >= 2) return 6
    }

    const genericRewardIntent = /(award|awarded|grant|granted|bonus|extra points|give you points|rewarded|recompense|récompense|bonus de points|te donner des points)/i.test(text)
    return genericRewardIntent ? 6 : 0
}

function alignSoulWithReplyIntent(soulScore, reply) {
    const floor = inferSoulFloorFromReply(reply)
    return clamp(Math.max(Number(soulScore || 0), floor), 0, 10)
}

function capResponseLength(text) {
    const safe = String(text || '').trim()
    if (!safe) return 'I did not catch that. Can you try again with a bit more detail?'
    if (safe.length <= MAX_BOT_RESPONSE_LENGTH) return safe
    return `${safe.slice(0, MAX_BOT_RESPONSE_LENGTH - 1)}...`
}

function extractJsonObject(text) {
    const safe = String(text || '').trim()
    if (!safe) return null

    try {
        return JSON.parse(safe)
    } catch {
        const start = safe.indexOf('{')
        const end = safe.lastIndexOf('}')
        if (start === -1 || end === -1 || end <= start) return null
        try {
            return JSON.parse(safe.slice(start, end + 1))
        } catch {
            return null
        }
    }
}


function buildFallbackReply({ content, username, soulScore }) {
    const safeContent = sanitizeUserContent(content)
    const shortPreview = safeContent.length > 80 ? `${safeContent.slice(0, 80)}...` : safeContent

    if (soulScore >= 7) {
        return `Nice point, ${username}. "${shortPreview}" is thoughtful and clear. Keep this level of depth.`
    }
    if (soulScore >= 4) {
        return `Thanks ${username}. I get your idea. Add one concrete example to strengthen it.`
    }
    return `Thanks ${username}. I need a bit more detail to be convinced. Try adding your reasoning step by step.`
}

async function queryOpenRouter({ content, username, heuristicSoul }) {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is missing')
    }

    const systemPrompt = [
        // IDENTITY & CORE BEHAVIOR
        'You are RabbitBot, the official rabbit assistant of Digit Rabbits.',
        'Identity: be playful, supportive, concise, and rabbit-like while staying accurate.',
        'Language: always reply in the same language as the user (French→French, English→English).',

        // PROJECT CONTEXT
        'Digit Rabbits: generative meme-based PFP collection of 2367 NFTs with retro-futuristic vibes on MegaETH.',
        'Community DNA: culture before hype, community-first, welcoming for degens and meme lovers.',
        'Mission: onboard people to MegaETH through culture and fun.',

        // GAME MECHANICS
        'Current: Season 1 - top leaderboard players get rewards.',
        'Features: clicker game, RabbitChat, quests, profile, leaderboard.',
        'RabbitPoints: earned from gameplay, chat activity, quests. Affects leaderboard and rewards.',
        'Chat: onchain messages, moderated. Roles: Rabbit Mob, Confirmed Rabbit, Moderator, Bot.',
        'Confirmed Rabbit status increases chat rewards.',
        'Clicker: each click = onchain transaction on MegaETH.',
        'Auth: Privy with embedded wallets.',

        // RESPONSE RULES
        'Output: ONLY valid JSON {"reply":"string","soul":number}. No markdown, no explanations.',
        'Reply: <200 chars, friendly, match user energy, directly address them.',
        'Soul scoring: 0-2=spam, 3-5=normal, 6-8=helpful, 9-10=exceptional insight.',

        // RESTRICTIONS
        'Never invent: partnerships, tokenomics, dates, contracts, roadmap details.',
        'Never promise: specific point amounts (backend computes from soul).',
        'Never include: wallet addresses, private data, policy text.',
        'If unsure: suggest checking FAQ/official links in app.',
        'If you do not know the exact answer about Season 1, Digit Rabbits, or precise game mechanics, explicitly refer the user to the in-app FAQ.',
        'Links (only when asked): X https://x.com/digitrabbits, Telegram https://t.me/digitrabbitsHQ, Discord https://discord.com/invite/QzJvgbr2, MegaETH https://www.megaeth.com/, Website https://digitrabbits.com.',
        'Privacy: user data not used for training.',
    ].join(' ')



    const userPrompt = [
        `username: ${username}`,
        `message: ${sanitizeUserContent(content)}`,
        `heuristic_soul_hint: ${heuristicSoul}`,
    ].join('\n')

    const completion = await openRouter.chat.send({
        chatRequest: {
            models: [
                'openai/gpt-4o-mini',           // Principal : caching + JSON excellent
                'deepseek/deepseek-chat',       // Fallback : excellent rapport qualité/prix + caching
                'qwen/qwen3.6-plus:free'       // Sécurité gratuite
            ],
            stream: false,
            messages: [
                { role: 'system', content: systemPrompt },  // Caching automatique sur GPT-4o-mini et DeepSeek
                { role: 'user', content: userPrompt },
            ],
            user: username,
            temperature: 0.4,
        },
    })

    console.log('RabbitBot OpenRouter response:', { completion })

    const raw = completion?.choices?.[0]?.message?.content
    const parsed = extractJsonObject(raw)
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('RabbitBot invalid JSON response from model')
    }

    const reply = capResponseLength(parsed.reply)
    const soul = clamp(Number(parsed.soul || 0), 0, 10)
    const modelUsed = typeof completion?.model === 'string' && completion.model.trim().length > 0
        ? completion.model
        : null

    return { reply, soul, modelUsed }
}

export async function buildRabbitBotReply({ content, username = 'Rabbit' }) {
    const safeContent = sanitizeUserContent(content)
    const safeUsername = sanitizeUserContent(username) || 'Rabbit'
    const heuristicSoul = computeSoulHeuristic(safeContent)

    let reply = ''
    let soulScore = heuristicSoul
    let modelUsed = 'fallback'
    let usedFallback = false

    try {
        const modelResult = await queryOpenRouter({
            content: safeContent,
            username: safeUsername,
            heuristicSoul,
        })
        reply = modelResult.reply
        const modelSoul = clamp(Number(modelResult.soul), 0, 10)
        soulScore = alignSoulWithReplyIntent(modelSoul, reply)
        modelUsed = modelResult.modelUsed

        if (soulScore !== modelSoul) {
            Sentry.captureMessage('RabbitBot soul aligned with reply intent', {
                level: 'info',
                tags: {
                    feature: 'rabbitbot',
                    stage: 'soul-alignment',
                    modelUsed,
                },
                extra: {
                    username: safeUsername,
                    heuristicSoul,
                    modelSoul,
                    alignedSoul: soulScore,
                    rewardPointsAfterAlign: computeRewardPoints(soulScore).toString(),
                    contentPreview: safeContent.slice(0, 120),
                    replyPreview: reply.slice(0, 200),
                },
            })
        }
    } catch (error) {
        usedFallback = true
        console.error('RabbitBot OpenRouter fallback:', error)
        reply = buildFallbackReply({
            content: safeContent,
            username: safeUsername,
            soulScore: heuristicSoul,
        })
        soulScore = alignSoulWithReplyIntent(heuristicSoul, reply)
        Sentry.captureMessage('RabbitBot fallback used', {
            level: 'warning',
            tags: {
                feature: 'rabbitbot',
                stage: 'fallback',
                modelUsed: 'fallback',
            },
            extra: {
                username: safeUsername,
                heuristicSoul,
                alignedSoul: soulScore,
                rewardPointsAfterAlign: computeRewardPoints(soulScore).toString(),
                contentPreview: safeContent.slice(0, 120),
                errorMessage: typeof error?.message === 'string' ? error.message : 'unknown',
            },
        })
    }

    const rewardPoints = usedFallback
        ? computeFallbackRewardPoints(soulScore)
        : computeRewardPoints(soulScore)

    return {
        reply: capResponseLength(reply),
        convictionScore: soulScore,
        soulScore,
        rewardPoints,
        modelUsed,
        reason: `RabbitBot SOUL reward (soul=${soulScore}/10)`,
    }
}
