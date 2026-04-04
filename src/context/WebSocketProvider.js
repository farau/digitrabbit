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
    const initializedRef = useRef(false)
    const isMountedRef = useRef(true)
    const reconnectTimeoutRef = useRef(null)
    const isReconnectingRef = useRef(false)
    const syncQueueRef = useRef([])
    const activeResyncRef = useRef(null)

    // Callbacks enregistrés par les composants
    const onPointsClaimedCallbackRef = useRef(null)
    const onUserRoleChangedCallbackRef = useRef(null)
    const onUserMutedCallbackRef = useRef(null)
    const onGameStartedCallbackRef = useRef(null)
    const onGamePlayedCallbackRef = useRef(null)
    const onQuestRewardCreditedCallbackRef = useRef(null)
    const onChatStatsRefreshCallbackRef = useRef(null)

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

    // Fonction pour enregistrer les callbacks
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
        if ('onGameStarted' in callbacks) {
            onGameStartedCallbackRef.current = callbacks.onGameStarted
        }
        if ('onGamePlayed' in callbacks) {
            onGamePlayedCallbackRef.current = callbacks.onGamePlayed
        }
        if ('onQuestRewardCredited' in callbacks) {
            onQuestRewardCreditedCallbackRef.current = callbacks.onQuestRewardCredited
        }
        if ('onChatStatsRefresh' in callbacks) {
            onChatStatsRefreshCallbackRef.current = callbacks.onChatStatsRefresh
        }
    }, [])

    // 🔄 Resync HTTP (récupère les événements manqués)
    const resync = useCallback(async () => {
        if (!isMountedRef.current || !DIGIT_RABBITS_CHAT_ADDRESS) {
            console.log('⚠️ Provider unmounted, skipping resync')
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
            const fromBlock = lastSyncedBlockRef.current
                ? lastSyncedBlockRef.current + 1n
                : currentBlock - 10000n

            if (fromBlock > currentBlock) {
                console.log('✅ Already synced')
                setIsSyncing(false)
                activeResyncRef.current = false
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
                            content: `Reward +${amount} Rabbit Points`,
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
                            txUrl: txHash ? `https://megaeth-testnet-v2.blockscout.com/tx/${txHash}` : '',
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
                setTimeout(() => resync(), 500)
            }
        }
    }, [resolveBlockTimestamps])

    // 🔗 Établir la connexion WebSocket pour les messages du chat
    const setupChatWebSocket = useCallback(() => {
        if (!isMountedRef.current) {
            console.log('⚠️ Provider unmounted, skipping Chat WebSocket setup')
            return
        }

        // Unsubscribe previous if any
        if (unwatchChatRef.current) {
            unwatchChatRef.current()
        }

        console.log('🌐 Setting up Chat WebSocket...')

        unwatchChatRef.current = wsPublicClient.watchContractEvent({
            address: DIGIT_RABBITS_CHAT_ADDRESS,
            abi: DIGIT_RABBITS_CHAT_ABI,
            eventName: 'MessageSent',

            onLogs(logs) {
                if (!isMountedRef.current) return

                setIsConnected(true)
                isReconnectingRef.current = false

                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current)
                    reconnectTimeoutRef.current = null
                }

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

                if (!isReconnectingRef.current) {
                    isReconnectingRef.current = true
                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (isMountedRef.current) {
                            console.log('🔄 Attempting to reconnect...')
                            resync()
                            setupChatWebSocket()
                        }
                    }, 3000)
                }
            }
        })
    }, [resync])

    const formatDuration = (seconds) => {
        const total = Math.max(0, Number(seconds) || 0)
        const hrs = Math.floor(total / 3600)
        const mins = Math.floor((total % 3600) / 60)
        const secs = total % 60
        return [hrs, mins, secs].map((value) => String(value).padStart(2, '0')).join(':')
    }

    // 🔗 Événements de modération RabbitChat (messages système)
    const setupChatModerationWebSocket = useCallback(() => {
        if (!isMountedRef.current) {
            console.log('⚠️ Provider unmounted, skipping Chat moderation WebSocket setup')
            return
        }

        if (unwatchChatModerationRef.current) {
            unwatchChatModerationRef.current()
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
            }
        })
    }, [triggerChatStatsRefresh])

    // 🔗 Événements de points RabbitChat
    const setupChatPointsWebSocket = useCallback(() => {
        if (!isMountedRef.current) {
            console.log('⚠️ Provider unmounted, skipping Chat points WebSocket setup')
            return
        }

        if (unwatchChatPointsRef.current) {
            unwatchChatPointsRef.current()
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
            }
        })
    }, [triggerChatStatsRefresh])

    // 🔗 Événements de récompense RabbitBot (notification système légère)
    const setupChatBotAwardsWebSocket = useCallback(() => {
        if (!isMountedRef.current) {
            console.log('⚠️ Provider unmounted, skipping Chat bot awards WebSocket setup')
            return
        }

        if (unwatchChatBotAwardsRef.current) {
            unwatchChatBotAwardsRef.current()
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
                            content: `Reward +${amount} Rabbit Points`,
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
                            txUrl: txHash ? `https://megaeth-testnet-v2.blockscout.com/tx/${txHash}` : '',
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
            }
        })
    }, [resolveBlockTimestamps, triggerChatStatsRefresh])


    // 🔗 Établir la connexion WebSocket pour les événements de DIGIT_RABBITS
    const setupRabbitsWebSocket = useCallback(() => {
        if (!isMountedRef.current) {
            console.log('⚠️ Provider unmounted, skipping Rabbits WebSocket setup')
            return
        }

        // Unsubscribe previous if any
        if (unwatchRabbitsRef.current) {
            unwatchRabbitsRef.current()
        }

        console.log('🌐 Setting up Rabbits WebSocket...')

        unwatchRabbitsRef.current = wsPublicClient.watchContractEvent({
            address: DIGIT_RABBITS_ADDRESS,
            abi: DIGIT_RABBITS_ABI,

            onLogs(logs) {
                if (!isMountedRef.current) return

                setIsConnected(true)
                let shouldRefreshChatStats = false

                for (const log of logs) {
                    console.log(`📡 Event from DIGIT_RABBITS: ${log.eventName}`, log)

                    // Appelle le callback approprié selon l'événement
                    if (log.eventName === 'PointsClaimed') {
                        console.log('💰 PointsClaimed event detected')
                        if (onPointsClaimedCallbackRef.current) {
                            onPointsClaimedCallbackRef.current(log)
                        }
                    } else if (log.eventName === 'RoleChanged') {
                        console.log('👤 RoleChanged event detected')
                        shouldRefreshChatStats = true
                        if (onUserRoleChangedCallbackRef.current) {
                            onUserRoleChangedCallbackRef.current(log)
                        }
                    } else if (log.eventName === 'UserMuted') {
                        console.log('🔇 UserMuted event detected')
                        shouldRefreshChatStats = true
                        if (onUserMutedCallbackRef.current) {
                            onUserMutedCallbackRef.current(log)
                        }
                    } else if (log.eventName === 'GameStarted') {
                        console.log('🚀 GameStarted event detected')
                        if (onGameStartedCallbackRef.current) {
                            onGameStartedCallbackRef.current(log)
                        }
                    } else if (log.eventName === 'GamePlayed') {
                        console.log('🎮 GamePlayed event detected')
                        if (onGamePlayedCallbackRef.current) {
                            onGamePlayedCallbackRef.current(log)
                        }
                    } else if (log.eventName === 'QuestRewardCredited') {
                        console.log('💰 QuestRewardCredited event detected')
                        if (onQuestRewardCreditedCallbackRef.current) {
                            onQuestRewardCreditedCallbackRef.current(log)
                        }
                    }
                }

                if (shouldRefreshChatStats) {
                    triggerChatStatsRefresh({ reason: 'rabbits-role-or-mute', logs })
                }
            },

            onError(error) {
                if (!isMountedRef.current) return

                console.error('❌ Rabbits WebSocket error:', error)

                if (!isReconnectingRef.current) {
                    isReconnectingRef.current = true
                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (isMountedRef.current) {
                            console.log('🔄 Attempting to reconnect Rabbits...')
                            setupRabbitsWebSocket()
                        }
                    }, 3000)
                }
            }
        })
    }, [triggerChatStatsRefresh])

    // 📱 Détecter visibilité de l'onglet
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

    // 🚀 Initialisation (une seule fois)
    useEffect(() => {
        if (initializedRef.current) return
        initializedRef.current = true

        console.log('🌐 WebSocketProvider mounted')
        isMountedRef.current = true

        let intervalId = null
        let socketRpcClient = null

        const heartbeat = async () => {
            console.log('⏰ ping ->')
            wsPublicClient.request({ method: 'eth_chainId' })
                .then(() => console.log('⏰ <- pong'))
                .catch((e) => console.error('⚠️ Heartbeat failed:', e))
        }

        const setupSocketListeners = async () => {
            try {
                socketRpcClient = await wsPublicClient.transport.getRpcClient()

                const onClose = async () => {
                    console.warn('⚠️ WebSocket closed, reconnecting...')

                    // Cleanup listeners
                    socketRpcClient.socket.removeEventListener('close', onClose)
                    socketRpcClient.socket.removeEventListener('error', onError)

                    // IMPORTANT : invalide le cache viem pour forcer une nouvelle connexion
                    // Viem peut déjà avoir fermé le socket, on ignore l'erreur
                    try {
                        socketRpcClient.close()
                    } catch (e) {
                        console.log('ℹ️ Socket already closed by viem')
                    }

                    clearInterval(intervalId)

                    if (!isMountedRef.current) return

                    // Reconnexion
                    await resync()
                    setupChatWebSocket()
                    setupChatModerationWebSocket()
                    setupChatPointsWebSocket()
                    setupChatBotAwardsWebSocket()
                    setupRabbitsWebSocket()

                    // Re-établit les listeners sur le nouveau socket
                    setupSocketListeners()

                    // Relance le heartbeat
                    intervalId = setInterval(heartbeat, 5 * 60 * 1000)
                }

                const onError = (ev) => {
                    console.error('❌ Socket error:', ev)
                }

                socketRpcClient.socket.addEventListener('close', onClose)
                socketRpcClient.socket.addEventListener('error', onError)

            } catch (e) {
                console.error('❌ Failed to setup socket listeners:', e)
            }
        }

        intervalId = setInterval(heartbeat, 5 * 60 * 1000)

        resync().then(() => {
            setupChatWebSocket()
            setupChatModerationWebSocket()
            setupChatPointsWebSocket()
            setupChatBotAwardsWebSocket()
            setupRabbitsWebSocket()
            setupSocketListeners()
        })

        heartbeat()

        return () => {
            console.log('❌ WebSocketProvider unmounting')
            isMountedRef.current = false

            clearInterval(intervalId)

            if (socketRpcClient) {
                socketRpcClient.close()
            }

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
                unwatchRabbitsRef.current()
                unwatchRabbitsRef.current = null
            }

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
                reconnectTimeoutRef.current = null
            }
        }
    }, [resync, setupChatWebSocket, setupChatModerationWebSocket, setupChatPointsWebSocket, setupChatBotAwardsWebSocket, setupRabbitsWebSocket])

    return (
        <WebSocketContext.Provider
            value={{
                messages,
                isConnected,
                isSyncing,
                resync,
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
