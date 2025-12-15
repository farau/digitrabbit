import { initializeGame, updateGame, playerAttack, setPlayerDirection, setPlayerWeapon, advanceState } from '@/lib/pacmanGame'

// In-memory game sessions (in production, use Redis or database)
const gameSessions = new Map()

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const TICK_INTERVAL = 100 // ms between game ticks

/**
 * GET /api/game
 * Get current game state
 * Query: sessionId (optional, generates new if not provided)
 */
export async function GET(request) {
    try {
        const url = new URL(request.url)
        const sessionId = url.searchParams.get('sessionId')

        if (!sessionId) {
            // Create new game session
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const gameState = initializeGame()

            gameSessions.set(newSessionId, {
                state: gameState,
                lastUpdate: Date.now(),
                createdAt: Date.now(),
            })

            return Response.json({
                success: true,
                sessionId: newSessionId,
                gameState,
            })
        }

        // Get existing session
        const session = gameSessions.get(sessionId)
        if (!session) {
            return Response.json(
                { error: 'Session not found' },
                { status: 404 }
            )
        }

        // Advance authoritative state by time since last update
        const now = Date.now()
        const deltaSeconds = Math.max(0, (now - session.lastUpdate) / 1000)
        if (deltaSeconds > 0) {
            session.state = advanceState(session.state, deltaSeconds)
            session.lastUpdate = now
        }

        return Response.json({
            success: true,
            sessionId,
            gameState: session.state,
        })
    } catch (error) {
        console.error('GET /api/game error:', error)
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/game
 * Update game state
 * Body: { sessionId, action, data? }
 * Actions: 'tick', 'move', 'attack'
 */
export async function POST(request) {
    try {
        const body = await request.json()
        const { sessionId, action, data } = body

        if (!sessionId) {
            return Response.json(
                { error: 'sessionId is required' },
                { status: 400 }
            )
        }

        // Get session
        const session = gameSessions.get(sessionId)
        if (!session) {
            return Response.json(
                { error: 'Session not found' },
                { status: 404 }
            )
        }

        // Advance state by elapsed time since last update
        const now = Date.now()
        const deltaSeconds = Math.max(0, (now - session.lastUpdate) / 1000)
        if (deltaSeconds > 0) {
            session.state = advanceState(session.state, deltaSeconds)
        }

        let gameState = session.state

        // Handle different actions
        switch (action) {
            case 'tick': {
                // optional small manual tick
                const d = (data && typeof data.delta === 'number') ? data.delta : 0.1
                gameState = advanceState(gameState, d)
                break
            }
            case 'move': {
                const { direction } = data
                gameState = setPlayerDirection(gameState, direction)
                // apply immediate small advancement so player movement feels responsive on server
                gameState = advanceState(gameState, 0.05)
                break
            }
            case 'attack': {
                gameState = playerAttack(gameState)
                break
            }
            case 'toggleWeapon': {
                // Toggle weapon possession on player (useful for testing)
                const enabled = data && typeof data.enabled === 'boolean' ? data.enabled : !gameState.player.hasWeapon
                gameState = setPlayerWeapon(gameState, enabled)
                break
            }
            case 'reset': {
                gameState = initializeGame()
                break
            }
            default:
                return Response.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                )
        }

        // Save updated state and set lastUpdate
        session.state = gameState
        session.lastUpdate = now

        return Response.json({
            success: true,
            gameState,
        })
    } catch (error) {
        console.error('POST /api/game error:', error)
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/game
 * Delete game session
 * Query: sessionId
 */
export async function DELETE(request) {
    try {
        const url = new URL(request.url)
        const sessionId = url.searchParams.get('sessionId')

        if (!sessionId) {
            return Response.json(
                { error: 'sessionId is required' },
                { status: 400 }
            )
        }

        const deleted = gameSessions.delete(sessionId)

        return Response.json({
            success: deleted,
            message: deleted ? 'Session deleted' : 'Session not found',
        })
    } catch (error) {
        console.error('DELETE /api/game error:', error)
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * Cleanup: Remove expired sessions every minute
 */
if (typeof window === 'undefined') {
    setInterval(() => {
        const now = Date.now()
        for (const [sessionId, session] of gameSessions.entries()) {
            if (now - session.lastUpdate > SESSION_TIMEOUT) {
                gameSessions.delete(sessionId)
            }
        }
    }, 60000)
}
