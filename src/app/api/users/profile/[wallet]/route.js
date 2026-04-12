import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAndGetUser } from '@/lib/privyClient';

const REQUEST_TIMEOUT = 25000;
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const DIGITS_REGEX = /^\d+$/;

function timeoutPromise(ms, message) {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), ms);
    });
}

function normalizeAddress(address) {
    return typeof address === 'string' ? address.trim().toLowerCase() : '';
}

function getUserWallets(user) {
    const wallets = new Set();

    if (user?.wallet?.address) {
        wallets.add(normalizeAddress(user.wallet.address));
    }

    const linkedAccounts = user?.linkedAccounts || user?.linked_accounts || [];
    linkedAccounts.forEach((account) => {
        if (account?.type === 'wallet' && account?.address) {
            wallets.add(normalizeAddress(account.address));
        }
    });

    return wallets;
}

async function executeGraphQLQuery(query, variables = {}) {
    const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT;
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!graphqlEndpoint) {
        throw new Error('GRAPHQL_ENDPOINT not configured');
    }

    if (graphqlEndpoint.includes('thegraph.com/studio/subgraph/')) {
        throw new Error(
            'GRAPHQL_ENDPOINT points to The Graph Studio UI URL. Use the GraphQL API query URL instead.'
        );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await Promise.race([
            fetch(graphqlEndpoint, {
                method: 'POST',
                ...(isDevelopment ? { cache: 'no-store', next: { revalidate: 0 } } : {}),
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query, variables }),
            }),
            timeoutPromise(REQUEST_TIMEOUT, 'GraphQL request timed out')
        ]);

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
        }

        const payload = await response.json();

        if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
            throw new Error(`GraphQL errors: ${payload.errors.map((e) => e.message).join(', ')}`);
        }

        if (!payload?.data || typeof payload.data !== 'object') {
            throw new Error('GraphQL invalid response format');
        }

        return payload.data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Requête GraphQL expirée (timeout)');
        }
        throw error;
    }
}

async function getUserProfileStatsFromSubgraph(walletAddress, seasonId = '1') {
    const queryByNestedPlayer = `
        query GetUserProfileStats($walletAddress: String!, $seasonId: BigInt!) {
            playerSeasonStats_collection(
                where: {
                    seasonId: $seasonId
                    player_: { walletAddress: $walletAddress }
                }
                orderBy: lastUpdatedTimestamp
                orderDirection: desc
                first: 1
            ) {
                player {
                    walletAddress
                }
                questsClaimed
                pointsClaimed
                leaderboardScore
                totalClicks
                gamesPlayed
                currentStreak
                bestClicksInGame
                lastUpdatedTimestamp
            }
        }
    `;

    const queryByPlayerId = `
        query GetUserProfileStatsFallback($walletAddress: String!, $seasonId: BigInt!) {
            playerSeasonStats_collection(
                where: {
                    seasonId: $seasonId
                    player: $walletAddress
                }
                orderBy: lastUpdatedTimestamp
                orderDirection: desc
                first: 1
            ) {
                player {
                    walletAddress
                }
                questsClaimed
                pointsClaimed
                leaderboardScore
                totalClicks
                gamesPlayed
                currentStreak
                bestClicksInGame
                lastUpdatedTimestamp
            }
        }
    `;

    let data;
    try {
        data = await executeGraphQLQuery(queryByNestedPlayer, { walletAddress, seasonId });
    } catch (error) {
        const message = String(error?.message || '');
        const shouldFallback = message.includes('player_') || message.includes('Unknown argument');
        if (!shouldFallback) {
            throw error;
        }
        data = await executeGraphQLQuery(queryByPlayerId, { walletAddress, seasonId });
    }

    const stats = data?.playerSeasonStats_collection?.[0] || null;
    return stats;
}

function jsonResponse(payload, init = {}) {
    const headers =
        process.env.NODE_ENV === 'development'
            ? {
                ...init.headers,
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                Pragma: 'no-cache',
                Expires: '0',
            }
            : {
                ...init.headers,
                'Cache-Control': 'private, max-age=120, stale-while-revalidate=60',
            };

    return NextResponse.json(payload, {
        ...init,
        headers,
    });
}

export async function GET(request, { params }) {
    const startTime = Date.now();

    try {
        const { wallet } = await params;
        const walletAddress = normalizeAddress(wallet);

        if (!ETH_ADDRESS_REGEX.test(walletAddress)) {
            return jsonResponse({ error: 'Invalid wallet address format' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const idToken = cookieStore.get('privy-id-token')?.value;
        if (!idToken) {
            return jsonResponse({ message: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyAndGetUser(idToken);
        const userWallets = getUserWallets(user);
        if (!userWallets.has(walletAddress)) {
            return jsonResponse(
                { error: 'Address does not belong to authenticated user' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const seasonId = searchParams.get('seasonId') || '1';
        if (!DIGITS_REGEX.test(seasonId)) {
            return jsonResponse({ error: 'Invalid seasonId. Expected a positive integer string.' }, { status: 400 });
        }

        const profileStats = await getUserProfileStatsFromSubgraph(walletAddress, seasonId);

        const processingTime = Date.now() - startTime;
        return jsonResponse({
            walletAddress,
            seasonId,
            profile: {
                questsClaimed: Number(profileStats?.questsClaimed || 0),
                hasClaimedPoints: Number(profileStats?.pointsClaimed || 0) > 0,
                score: Number(profileStats?.leaderboardScore || 0) / 1000000,
                totalClicks: Number(profileStats?.totalClicks || 0),
                gamesPlayed: Number(profileStats?.gamesPlayed || 0),
                streak: Number(profileStats?.currentStreak || 0),
                maxClicks: Number(profileStats?.bestClicksInGame || 0),
                lastUpdatedTimestamp: Number(profileStats?.lastUpdatedTimestamp || 0),
            },
            metadata: {
                source: 'the-graph-subgraph',
                found: Boolean(profileStats),
                processingTimeMs: processingTime,
                timestamp: new Date().toISOString(),
            }
        });
    } catch (error) {
        console.error('User profile stats API error:', error);
        const processingTime = Date.now() - startTime;

        let statusCode = 500;
        let errorMessage = 'Internal server error';

        if (error.message?.includes('GraphQL')) {
            errorMessage = 'Error fetching profile data';
        } else if (error.message?.includes('Authentication')) {
            statusCode = 401;
            errorMessage = 'Authentication failed';
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            statusCode = 503;
            errorMessage = 'Service temporarily unavailable';
        }

        return jsonResponse(
            {
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
                metadata: {
                    processingTimeMs: processingTime,
                    timestamp: new Date().toISOString(),
                    hasError: true,
                }
            },
            { status: statusCode }
        );
    }
}
