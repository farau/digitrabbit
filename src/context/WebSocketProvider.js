'use client'

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback
} from 'react'

import {
    DIGIT_RABBITS_CHAT_ADDRESS,
    DIGIT_RABBITS_CHAT_ABI,
    DIGIT_RABBITS_ADDRESS,
    DIGIT_RABBITS_ABI,
    wsPublicClient,
    publicClient
} from '@/utils/chainConfig'

const WebSocketContext = createContext(null)

export function WebSocketProvider({ children }) {
    const [messages, setMessages] = useState([])
    const [isConnected, setIsConnected] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)

    const unwatchChatRef = useRef(null)
    const unwatchChatModerationRef = useRef(null)
    const unwatchChatPointsRef = useRef(null)
    const unwatchChatBotAwardsRef = useRef(null)
    const unwatchRabbitsRef = useRef(null)
    const lastSyncedBlockRef = useRef(null)
    const isMountedRef = useRef(false)
    const syncQueueRef = useRef([])
    const activeResyncRef = useRef(null)

    // Callbacks enregistrés par les composants
    const onPointsClaimedCallbackRef = useRef(null)
    const onUserRoleChangedCallbackRef = useRef(null)
    const onUserMutedCallbackRef = useRef(null)
    const onQuestRewardCreditedCallbackRef = useRef(null)
    const onChatStatsRefreshCallbackRef = useRef(null)

    // FIX 2 — ref vers les dernières versions des fonctions setup (évite closures stales dans onClose)
    const setupFnsRef = useRef({})

    const triggerChatStatsRefresh = useCallback((payload = {}) => {
        if (!isMountedRef.current) return
        if (typeof onChatStatsRefreshCallbackRef.current === 'function') {
            onChatStatsRefreshCallbackRef.current(payload)
        }
    }, [])

    const resolveBlockTimestamps = useCallback(async (logs = []) => {
        const uniqueBlockNumbers = Array.from(
            new Set(
                logs
                    .map((log) => log?.blockNumber)
                    .filter((blockNumber) => typeof blockNumber === 'bigint')
                    .map((blockNumber) => blockNumber.toString())
            )
        )

        if (uniqueBlockNumbers.length === 0) return {}

        const entries = await Promise.all(
            uniqueBlockNumbers.map(async (blockNumberAsString) => {
                try {
                    const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumberAsString) })
                    return [blockNumberAsString, Number(block?.timestamp || 0)]
                } catch (error) {
                    console.error(`❌ Failed to fetch block timestamp for ${blockNumberAsString}:`, error)
                    return [blockNumberAsString, 0]
                }
            })
        )

        return Object.fromEntries(entries)
    }, [])

    const registerCallbacks = useCallback((callbacks) => {
        if ('onPointsClaimed' in callbacks) {
            onPointsClaimedCallbackRef.current = callbacks.onPointsClaimed
        }
        if ('onUserRoleChanged' in callbacks) {
            onUserRoleChangedCallbackRef.current = callbacks.onUserRoleChanged
        }
        if ('onUserMuted' in callbacks) {
            onUserMutedCallbackRef.current = callbacks.onUserMuted
        }
        if ('onQuestRewardCredited' in callbacks) {
            onQuestRewardCreditedCallbackRef.current = callbacks.onQuestRewardCredited
        }
        if ('onChatStatsRefresh' in callbacks) {
            onChatStatsRefreshCallbackRef.current = callbacks.onChatStatsRefresh
        }
    }, [])

    const cleanupWebSocketWatchers = useCallback(() => {
        if (unwatchChatRef.current) {
            unwatchChatRef.current()
            unwatchChatRef.current = null
        }

        if (unwatchChatModerationRef.current) {
            unwatchChatModerationRef.current()
            unwatchChatModerationRef.current = null
        }

        if (unwatchChatPointsRef.current) {
            unwatchChatPointsRef.current()
            unwatchChatPointsRef.current = null
        }

        if (unwatchChatBotAwardsRef.current) {
            unwatchChatBotAwardsRef.current()
            unwatchChatBotAwardsRef.current = null
        }

        if (unwatchRabbitsRef.current) {
            const unwatchers = Array.isArray(unwatchRabbitsRef.current)
                ? unwatchRabbitsRef.current
                : [unwatchRabbitsRef.current]
            unwatchers.forEach((unwatch) => unwatch?.())
            unwatchRabbitsRef.current = null
        }
    }, [])

    const checkConnection = useCallback(async () => {
        try {
            await wsPublicClient.request({ method: 'eth_chainId' })
            if (isMountedRef.current) {
                setIsConnected(true)
            }
            return true
        } catch (error) {
            console.error('❌ WebSocket check failed:', error)
            if (isMountedRef.current) {
                setIsConnected(false)
            }
            return false
        }
    }, [])

    // 🔄 Resync HTTP (récupère les événements manqués)
    const resync = useCallback(async () => {
        if (!isMountedRef.current || !DIGIT_RABBITS_CHAT_ADDRESS) {
            console.log('⚠️ Provider unmounted or no address, skipping resync')
            return
        }

        if (activeResyncRef.current) {
            console.log('⏳ Resync already in progress, queuing...')
            syncQueueRef.current.push({ timestamp: Date.now() })
            return
        }

        try {
            activeResyncRef.current = true
            setIsSyncing(true)

            const currentBlock = await publicClient.getBlockNumber()

            // FIX — vérifier après chaque await que le provider est toujours monté
            if (!isMountedRef.current) return

            const fromBlock = lastSyncedBlockRef.current
                ? lastSyncedBlockRef.current + 1n
                : currentBlock - 10000n

            if (fromBlock > currentBlock) {
                console.log('✅ Already synced')
                return
            }

            console.log(`📡 Syncing from block ${fromBlock} to ${currentBlock}`)

            const [messageLogs, botAwardLogs] = await Promise.all([
                publicClient.getContractEvents({
                    address: DIGIT_RABBITS_CHAT_ADDRESS,
                    abi: DIGIT_RABBITS_CHAT_ABI,
                    eventName: 'MessageSent',
                    fromBlock,
                    toBlock: currentBlock
                }),
                publicClient.getContractEvents({
                    address: DIGIT_RABBITS_CHAT_ADDRESS,
                    abi: DIGIT_RABBITS_CHAT_ABI,
                    eventName: 'BotPointsAwarded',
                    fromBlock,
                    toBlock: currentBlock
                })
            ])

            if (!isMountedRef.current) {
                console.log('⚠️ Provider unmounted during resync, discarding results')
                return
            }

            if (messageLogs.length || botAwardLogs.length) {
                const botAwardTimestampsByBlock = await resolveBlockTimestamps(botAwardLogs)

                if (!isMountedRef.current) return

                setMessages(prev => {
                    const existing = new Set(prev.map(m => m.messageId))
                    const next = [...prev]

                    for (const log of messageLogs) {
                        const { args } = log
                        if (!args) continue

                        const messageId = Number(args.messageId)
                        if (existing.has(messageId)) continue

                        next.push({
                            messageId,
                            sender: args.sender,
                            content: args.content,
                            score: Number(args.score),
                            senderRole: Number(args.senderRole),
                            twitterUsername: args.twitterUsername,
                            twitterProfilePictureUrl: args.twitterProfilePictureUrl,
                            timestamp: Number(args.timestamp),
                            replyToMessageId: Number(args.replyToMessageId || 0),
                            transactionHash: log.transactionHash
                        })
                    }

                    for (const log of botAwardLogs) {
                        const { args } = log
                        if (!args) continue

                        const rewardedUser = typeof args.user === 'string'
                            ? args.user
                            : '0x0000000000000000000000000000000000000000'
                        const amountRaw = Number(args.amount || 0n)
                        const amount = Number.isFinite(amountRaw) ? Math.max(0, amountRaw) : 0
                        const txHash = typeof log.transactionHash === 'string' ? log.transactionHash : ''
                        const syntheticId = `system-bot-award-${txHash}-${String(log.logIndex ?? 0)}`

                        if (existing.has(syntheticId)) continue

                        next.push({
                            messageId: syntheticId,
                            sender: rewardedUser,
                            content: `Reward +${amount} RabbitPoints`,
                            score: 0,
                            senderRole: 0,
                            twitterUsername: 'System',
                            twitterProfilePictureUrl: '',
                            timestamp: Number(
                                botAwardTimestampsByBlock[String(log.blockNumber || '')]
                                || Math.floor(Date.now() / 1000)
                            ),
                            replyToMessageId: 0,
                            transactionHash: txHash,
                            txUrl: txHash ? `https://megaeth.blockscout.com/tx/${txHash}` : '',
                            rewardPoints: amount,
                            rewardedUser,
                            hideAvatar: true,
                            systemType: 'bot-award'
                        })
                    }

                    return next.sort((a, b) => {
                        const ta = Number(a?.timestamp || 0)
                        const tb = Number(b?.timestamp || 0)
                        if (ta !== tb) return ta - tb

                        const ida = typeof a?.messageId === 'number' ? a.messageId : Number.MAX_SAFE_INTEGER
                        const idb = typeof b?.messageId === 'number' ? b.messageId : Number.MAX_SAFE_INTEGER
                        return ida - idb
                    })
                })

                console.log(`✅ Synced ${messageLogs.length} chat messages and ${botAwardLogs.length} bot rewards`)
            }

            lastSyncedBlockRef.current = currentBlock
        } catch (e) {
            console.error('❌ Resync failed:', e)
        } finally {
            if (isMountedRef.current) {
                setIsSyncing(false)
            }
            activeResyncRef.current = false

            if (syncQueueRef.current.length > 0) {
                syncQueueRef.current = []
                console.log('📋 Processing queued resync...')
                setTimeout(() => {
                    if (isMountedRef.current) resync()
                }, 500)
            }
        }
    }, [resolveBlockTimestamps])

    // 🔗 Chat — MessageSent
    const setupChatWebSocket = useCallback(() => {
        if (!isMountedRef.current) return

        if (unwatchChatRef.current) {
            unwatchChatRef.current()
            unwatchChatRef.current = null
        }

        console.log('🌐 Setting up Chat WebSocket...')

        unwatchChatRef.current = wsPublicClient.watchContractEvent({
            address: DIGIT_RABBITS_CHAT_ADDRESS,
            abi: DIGIT_RABBITS_CHAT_ABI,
            eventName: 'MessageSent',

            onLogs(logs) {
                if (!isMountedRef.current) return

                setIsConnected(true)

                setMessages(prev => {
                    const existing = new Set(prev.map(m => m.messageId))
                    const next = [...prev]

                    for (const log of logs) {
                        const { args } = log
                        if (!args) continue

                        const messageId = Number(args.messageId)
                        if (existing.has(messageId)) continue

                        next.push({
                            messageId,
                            sender: args.sender,
                            content: args.content,
                            score: Number(args.score),
                            senderRole: Number(args.senderRole),
                            twitterUsername: args.twitterUsername,
                            twitterProfilePictureUrl: args.twitterProfilePictureUrl,
                            timestamp: Number(args.timestamp),
                            replyToMessageId: Number(args.replyToMessageId || 0),
                            transactionHash: log.transactionHash
                        })

                        if (log.blockNumber) {
                            lastSyncedBlockRef.current = log.blockNumber
                        }
                    }

                    return next.sort((a, b) => {
                        const ta = Number(a?.timestamp || 0)
                        const tb = Number(b?.timestamp || 0)
                        if (ta !== tb) return ta - tb

                        const ida = typeof a?.messageId === 'number' ? a.messageId : Number.MAX_SAFE_INTEGER
                        const idb = typeof b?.messageId === 'number' ? b.messageId : Number.MAX_SAFE_INTEGER
                        return ida - idb
                    })
                })
            },

            onError(error) {
                if (!isMountedRef.current) return

                console.error('❌ Chat WebSocket error:', error)
                setIsConnected(false)
            }
        })
    }, [])

    const formatDuration = (seconds) => {
        const total = Math.max(0, Number(seconds) || 0)
        const hrs = Math.floor(total / 3600)
        const mins = Math.floor((total % 3600) / 60)
        const secs = total % 60
        return [hrs, mins, secs].map((value) => String(value).padStart(2, '0')).join(':')
    }

    // 🔗 Chat — UserMuted (modération)
    const setupChatModerationWebSocket = useCallback(() => {
        if (!isMountedRef.current) return

        if (unwatchChatModerationRef.current) {
            unwatchChatModerationRef.current()
            unwatchChatModerationRef.current = null
        }

        console.log('🌐 Setting up Chat moderation WebSocket...')

        unwatchChatModerationRef.current = wsPublicClient.watchContractEvent({
            address: DIGIT_RABBITS_CHAT_ADDRESS,
            abi: DIGIT_RABBITS_CHAT_ABI,
            eventName: 'UserMuted',

            onLogs(logs) {
                if (!isMountedRef.current) return
                setIsConnected(true)

                setMessages(prev => {
                    const existing = new Set(prev.map(m => m.messageId))
                    const next = [...prev]

                    for (const log of logs) {
                        const { args } = log
                        if (!args) continue

                        const mutedUser = args.user
                        const mutedBy = args.mutedBy
                        const duration = Number(args.duration || 0)
                        const expiresAt = Number(args.expiresAt || 0)
                        const syntheticId = `system-muted-${log.transactionHash}-${mutedUser}-${expiresAt}`

                        if (existing.has(syntheticId)) continue

                        const shortMutedUser = mutedUser
                            ? `${mutedUser.slice(0, 6)}...${mutedUser.slice(-4)}`
                            : 'Unknown'
                        const shortMutedBy = mutedBy
                            ? `${mutedBy.slice(0, 6)}...${mutedBy.slice(-4)}`
                            : 'Unknown'

                        next.push({
                            messageId: syntheticId,
                            sender: mutedBy || '0x0000000000000000000000000000000000000000',
                            content: `🔇 ${shortMutedUser} has been muted by ${shortMutedBy} for ${formatDuration(duration)}.`,
                            score: 0,
                            senderRole: 3,
                            twitterUsername: 'RabbitBot',
                            twitterProfilePictureUrl: '/img/default-avatar.jpg',
                            timestamp: expiresAt > duration ? (expiresAt - duration) : Math.floor(Date.now() / 1000),
                            replyToMessageId: 0,
                            transactionHash: log.transactionHash
                        })

                        if (onUserMutedCallbackRef.current) {
                            onUserMutedCallbackRef.current(log)
                        }
                    }

                    if (logs.length > 0) {
                        triggerChatStatsRefresh({ reason: 'chat-user-muted', logs })
                    }

                    return next
                })
            },

            onError(error) {
                if (!isMountedRef.current) return
                console.error('❌ Chat moderation WebSocket error:', error)
                setIsConnected(false)
            }
        })
    }, [triggerChatStatsRefresh])

    // 🔗 Chat — PointsAwarded
    const setupChatPointsWebSocket = useCallback(() => {
        if (!isMountedRef.current) return

        if (unwatchChatPointsRef.current) {
            unwatchChatPointsRef.current()
            unwatchChatPointsRef.current = null
        }

        console.log('🌐 Setting up Chat points WebSocket...')

        unwatchChatPointsRef.current = wsPublicClient.watchContractEvent({
            address: DIGIT_RABBITS_CHAT_ADDRESS,
            abi: DIGIT_RABBITS_CHAT_ABI,
            eventName: 'PointsAwarded',

            onLogs(logs) {
                if (!isMountedRef.current) return
                setIsConnected(true)

                if (logs.length > 0) {
                    triggerChatStatsRefresh({ reason: 'chat-points-awarded', logs })
                }
            },

            onError(error) {
                if (!isMountedRef.current) return
                console.error('❌ Chat points WebSocket error:', error)
                setIsConnected(false)
            }
        })
    }, [triggerChatStatsRefresh])

    // 🔗 Chat — BotPointsAwarded
    const setupChatBotAwardsWebSocket = useCallback(() => {
        if (!isMountedRef.current) return

        if (unwatchChatBotAwardsRef.current) {
            unwatchChatBotAwardsRef.current()
            unwatchChatBotAwardsRef.current = null
        }

        console.log('🌐 Setting up Chat bot awards WebSocket...')

        unwatchChatBotAwardsRef.current = wsPublicClient.watchContractEvent({
            address: DIGIT_RABBITS_CHAT_ADDRESS,
            abi: DIGIT_RABBITS_CHAT_ABI,
            eventName: 'BotPointsAwarded',

            async onLogs(logs) {
                if (!isMountedRef.current) return
                setIsConnected(true)

                if (!Array.isArray(logs) || logs.length === 0) return

                const botAwardTimestampsByBlock = await resolveBlockTimestamps(logs)
                if (!isMountedRef.current) return

                setMessages(prev => {
                    const existing = new Set(prev.map(m => m.messageId))
                    const next = [...prev]

                    for (const log of logs) {
                        const { args } = log
                        if (!args) continue

                        const rewardedUser = typeof args.user === 'string'
                            ? args.user
                            : '0x0000000000000000000000000000000000000000'
                        const amountRaw = Number(args.amount || 0n)
                        const amount = Number.isFinite(amountRaw) ? Math.max(0, amountRaw) : 0
                        const txHash = typeof log.transactionHash === 'string' ? log.transactionHash : ''
                        const syntheticId = `system-bot-award-${txHash}-${String(log.logIndex ?? 0)}`

                        if (existing.has(syntheticId)) continue

                        next.push({
                            messageId: syntheticId,
                            sender: rewardedUser,
                            content: `Reward +${amount} RabbitPoints`,
                            score: 0,
                            senderRole: 0,
                            twitterUsername: 'System',
                            twitterProfilePictureUrl: '',
                            timestamp: Number(
                                botAwardTimestampsByBlock[String(log.blockNumber || '')]
                                || Math.floor(Date.now() / 1000)
                            ),
                            replyToMessageId: 0,
                            transactionHash: txHash,
                            txUrl: txHash ? `https://megaeth.blockscout.com/tx/${txHash}` : '',
                            rewardPoints: amount,
                            rewardedUser,
                            hideAvatar: true,
                            systemType: 'bot-award'
                        })
                    }

                    return next
                })

                triggerChatStatsRefresh({ reason: 'chat-bot-points-awarded', logs })
            },

            onError(error) {
                if (!isMountedRef.current) return
                console.error('❌ Chat bot awards WebSocket error:', error)
                setIsConnected(false)
            }
        })
    }, [resolveBlockTimestamps, triggerChatStatsRefresh])

    // 🔗 DIGIT_RABBITS — événements non-game nécessaires
    const setupRabbitsWebSocket = useCallback(() => {
        if (!isMountedRef.current) return

        if (unwatchRabbitsRef.current) {
            const unwatchers = Array.isArray(unwatchRabbitsRef.current)
                ? unwatchRabbitsRef.current
                : [unwatchRabbitsRef.current]
            unwatchers.forEach((unwatch) => unwatch?.())
            unwatchRabbitsRef.current = null
        }

        console.log('🌐 Setting up Rabbits WebSocket...')

        const onError = (error) => {
            if (!isMountedRef.current) return

            console.error('❌ Rabbits WebSocket error:', error)
            setIsConnected(false)
        }

        const unwatchPointsClaimed = wsPublicClient.watchContractEvent({
            address: DIGIT_RABBITS_ADDRESS,
            abi: DIGIT_RABBITS_ABI,
            eventName: 'PointsClaimed',

            onLogs(logs) {
                if (!isMountedRef.current) return
                setIsConnected(true)

                for (const log of logs) {
                    console.log('💰 PointsClaimed event detected', log)
                    if (onPointsClaimedCallbackRef.current) {
                        onPointsClaimedCallbackRef.current(log)
                    }
                }
            },

            onError
        })

        const unwatchQuestRewardCredited = wsPublicClient.watchContractEvent({
            address: DIGIT_RABBITS_ADDRESS,
            abi: DIGIT_RABBITS_ABI,
            eventName: 'QuestRewardCredited',

            onLogs(logs) {
                if (!isMountedRef.current) return
                setIsConnected(true)

                for (const log of logs) {
                    console.log('💰 QuestRewardCredited event detected', log)
                    if (onQuestRewardCreditedCallbackRef.current) {
                        onQuestRewardCreditedCallbackRef.current(log)
                    }
                }
            },

            onError
        })

        unwatchRabbitsRef.current = [unwatchPointsClaimed, unwatchQuestRewardCredited]
    }, [])

    // FIX 2 — synchroniser setupFnsRef à chaque changement des fonctions
    useEffect(() => {
        setupFnsRef.current = {
            setupChatWebSocket,
            setupChatModerationWebSocket,
            setupChatPointsWebSocket,
            setupChatBotAwardsWebSocket,
            setupRabbitsWebSocket,
        }
    }, [
        setupChatWebSocket,
        setupChatModerationWebSocket,
        setupChatPointsWebSocket,
        setupChatBotAwardsWebSocket,
        setupRabbitsWebSocket,
    ])

    const restartWebSocket = useCallback(async () => {
        if (!isMountedRef.current) return false

        console.log('🔄 Manually restarting WebSocket subscriptions...')
        cleanupWebSocketWatchers()
        setIsConnected(false)

        await resync()

        if (!isMountedRef.current) return false

        const fns = setupFnsRef.current
        fns.setupChatWebSocket?.()
        fns.setupChatModerationWebSocket?.()
        fns.setupChatPointsWebSocket?.()
        fns.setupChatBotAwardsWebSocket?.()
        fns.setupRabbitsWebSocket?.()

        const connected = await checkConnection()
        if (connected) {
            triggerChatStatsRefresh({ reason: 'manual-websocket-restart' })
        }

        return connected
    }, [checkConnection, cleanupWebSocketWatchers, resync, triggerChatStatsRefresh])

    // 📱 Visibilité de l'onglet
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!isMountedRef.current) return

            if (document.hidden) {
                console.log('👁️ App hidden')
            } else {
                console.log('👁️ App visible - syncing missed events...')
                resync()
                triggerChatStatsRefresh({ reason: 'visibility-visible' })
            }
        }

        const handleFocus = () => {
            if (!isMountedRef.current) return
            triggerChatStatsRefresh({ reason: 'window-focus' })
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('focus', handleFocus)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('focus', handleFocus)
        }
    }, [resync, triggerChatStatsRefresh])

    // 🚀 Initialisation
    // FIX 1 — suppression de initializedRef, on utilise un flag local `active`
    // Cela corrige le bug StrictMode (double montage) et les remontages réels
    useEffect(() => {
        let active = true
        isMountedRef.current = true

        console.log('🌐 WebSocketProvider mounted')

        resync().then(() => {
            if (!active) return
            setupChatWebSocket()
            setupChatModerationWebSocket()
            setupChatPointsWebSocket()
            setupChatBotAwardsWebSocket()
            setupRabbitsWebSocket()
            void checkConnection()
        })

        return () => {
            console.log('❌ WebSocketProvider unmounting')
            active = false
            isMountedRef.current = false

            cleanupWebSocketWatchers()

            // Reset des états internes
            activeResyncRef.current = false
            syncQueueRef.current = []
        }
    }, [
        checkConnection,
        cleanupWebSocketWatchers,
        resync,
        setupChatWebSocket,
        setupChatModerationWebSocket,
        setupChatPointsWebSocket,
        setupChatBotAwardsWebSocket,
        setupRabbitsWebSocket
    ])

    return (
        <WebSocketContext.Provider
            value={{
                messages,
                isConnected,
                isSyncing,
                resync,
                checkConnection,
                restartWebSocket,
                registerCallbacks
            }}
        >
            {children}
        </WebSocketContext.Provider>
    )
}

export function useWebSocketContext() {
    const ctx = useContext(WebSocketContext)
    if (!ctx) {
        throw new Error('useWebSocketContext must be used inside WebSocketProvider')
    }
    return ctx
}
