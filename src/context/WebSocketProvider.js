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
    const onGamePlayedCallbackRef = useRef(null)
    const onQuestRewardCreditedCallbackRef = useRef(null)

    // Fonction pour enregistrer les callbacks
    const registerCallbacks = useCallback((callbacks) => {
        if (callbacks.onPointsClaimed) {
            onPointsClaimedCallbackRef.current = callbacks.onPointsClaimed
        }
        if (callbacks.onUserRoleChanged) {
            onUserRoleChangedCallbackRef.current = callbacks.onUserRoleChanged
        }
        if (callbacks.onUserMuted) {
            onUserMutedCallbackRef.current = callbacks.onUserMuted
        }
        if (callbacks.onGamePlayed) {
            onGamePlayedCallbackRef.current = callbacks.onGamePlayed
        }
        if (callbacks.onQuestRewardCredited) {
            onQuestRewardCreditedCallbackRef.current = callbacks.onQuestRewardCredited
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

            const logs = await publicClient.getContractEvents({
                address: DIGIT_RABBITS_CHAT_ADDRESS,
                abi: DIGIT_RABBITS_CHAT_ABI,
                eventName: 'MessageSent',
                fromBlock,
                toBlock: currentBlock
            })

            if (!isMountedRef.current) {
                console.log('⚠️ Provider unmounted during resync, discarding results')
                return
            }

            if (logs.length) {
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
                    }

                    return next.sort((a, b) => a.messageId - b.messageId)
                })

                console.log(`✅ Synced ${logs.length} messages`)
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
    }, [])

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

                    return next
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
                        if (onUserRoleChangedCallbackRef.current) {
                            onUserRoleChangedCallbackRef.current(log)
                        }
                    } else if (log.eventName === 'UserMuted') {
                        console.log('🔇 UserMuted event detected')
                        if (onUserMutedCallbackRef.current) {
                            onUserMutedCallbackRef.current(log)
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
    }, [])

    // 📱 Détecter visibilité de l'onglet
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!isMountedRef.current) return

            if (document.hidden) {
                console.log('👁️ App hidden')
            } else {
                console.log('👁️ App visible - syncing missed events...')
                resync()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [resync])

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

            if (unwatchRabbitsRef.current) {
                unwatchRabbitsRef.current()
                unwatchRabbitsRef.current = null
            }

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
                reconnectTimeoutRef.current = null
            }
        }
    }, [resync, setupChatWebSocket, setupRabbitsWebSocket])

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