import { useState, useEffect, useRef, useCallback } from 'react'

import {
    DIGIT_RABBITS_ADDRESS,
    DIGIT_RABBITS_ABI,
    DIGIT_RABBITS_CHAT_ADDRESS,
    DIGIT_RABBITS_CHAT_ABI,
    wsPublicClient,
    publicClient
} from '@/utils/chainConfig'

export const useWebSocket = ({ embeddedWallet, seasonId }) => {
    const [messages, setMessages] = useState([])
    const [isConnected, setIsConnected] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState('disconnected')

    const unwatchContractRef = useRef(null)
    const unwatchChatRef = useRef(null)
    const lastSyncedBlockRef = useRef(null)
    const reconnectTimeoutRef = useRef(null)
    const lastEventTimeRef = useRef(Date.now())
    const connectionAttempts = useRef(0)
    const isCleaningUpRef = useRef(false) // ✅ Pour éviter les reconnexions pendant le cleanup
    const maxReconnectAttempts = 5 // ✅ Limite de tentatives
    const consecutiveErrorsRef = useRef(0) // ✅ Compteur d'erreurs consécutives

    // Vérifier la connexion toutes les 30s
    const MAX_WS_SILENCE = 30_000 // 30s (ajuste)

    const isWebSocketAlive = () => {
        return Date.now() - lastEventTimeRef.current < MAX_WS_SILENCE
    }


    // ✅ Fonction pour récupérer les events manqués
    const fetchMissedEvents = useCallback(async () => {
        if (!DIGIT_RABBITS_CHAT_ADDRESS || isCleaningUpRef.current) return

        try {
            setIsSyncing(true)
            console.log('🔄 Fetching missed chat events...')

            const currentBlock = await publicClient.getBlockNumber()
            const fromBlock = lastSyncedBlockRef.current
                ? lastSyncedBlockRef.current + 1n
                : currentBlock - 100000n

            if (fromBlock > currentBlock) {
                console.log('✅ Already synced up to current block')
                lastSyncedBlockRef.current = currentBlock
                return
            }

            console.log(`Fetching from block ${fromBlock} to ${currentBlock}`)

            const logs = await publicClient.getContractEvents({
                address: DIGIT_RABBITS_CHAT_ADDRESS,
                abi: DIGIT_RABBITS_CHAT_ABI,
                eventName: 'MessageSent',
                fromBlock,
                toBlock: currentBlock
            })

            console.log(`📨 Found ${logs.length} missed messages`)

            if (logs.length > 0) {
                const newMessages = logs.map(log => {
                    const { args } = log
                    return {
                        type: 'MESSAGE_SENT',
                        messageId: Number(args.messageId),
                        sender: args.sender,
                        content: args.content,
                        score: Number(args.score),
                        senderRole: Number(args.senderRole),
                        twitterUsername: args.twitterUsername,
                        twitterProfilePictureUrl: args.twitterProfilePictureUrl,
                        timestamp: Number(args.timestamp),
                        replyToMessageId: Number(args.replyToMessageId || 0),
                        transactionHash: log.transactionHash
                    }
                })

                setMessages(prev => {
                    const existingIds = new Set(prev.map(m => m.messageId))
                    const uniqueNew = newMessages.filter(m => !existingIds.has(m.messageId))
                    return [...prev, ...uniqueNew].sort((a, b) => a.messageId - b.messageId)
                })
            }

            lastSyncedBlockRef.current = currentBlock

        } catch (error) {
            console.error('❌ Error fetching missed events:', error)
        } finally {
            setIsSyncing(false)
        }
    }, [])

    // ✅ Fonction pour nettoyer proprement les watchers
    const cleanupWatchers = useCallback(() => {
        console.log('🧹 Cleaning up watchers...')

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }

        if (unwatchContractRef.current) {
            try {
                unwatchContractRef.current()
            } catch (e) {
                console.warn('Error unwatching contract:', e)
            }
            unwatchContractRef.current = null
        }

        if (unwatchChatRef.current) {
            try {
                unwatchChatRef.current()
            } catch (e) {
                console.warn('Error unwatching chat:', e)
            }
            unwatchChatRef.current = null
        }
    }, [])

    // ✅ Fonction de reconnexion avec backoff exponentiel
    const scheduleReconnect = useCallback((reason = 'unknown') => {
        // Ne pas reconnecter si on est en train de nettoyer
        if (isCleaningUpRef.current) {
            console.log('⏸️ Cleanup in progress, skipping reconnection')
            return
        }

        connectionAttempts.current += 1
        consecutiveErrorsRef.current += 1

        // ✅ Arrêter après trop de tentatives
        if (connectionAttempts.current > maxReconnectAttempts) {
            console.error(`🛑 Max reconnection attempts (${maxReconnectAttempts}) reached. Stopping.`)
            setConnectionStatus('failed')
            cleanupWatchers()
            return
        }

        // ✅ Backoff exponentiel: 3s, 6s, 12s, 24s, 48s
        const delay = Math.min(3000 * Math.pow(2, connectionAttempts.current - 1), 48000)

        console.log(`⏳ Scheduling reconnection in ${delay / 1000}s (attempt ${connectionAttempts.current}/${maxReconnectAttempts}) - Reason: ${reason}`)

        reconnectTimeoutRef.current = setTimeout(() => {
            if (!isCleaningUpRef.current) {
                console.log(`🔄 Reconnecting... (attempt ${connectionAttempts.current})`)
                setupWatchers()
            }
        }, delay)
    }, [maxReconnectAttempts])

    // ✅ setupWatchers avec gestion d'erreurs améliorée
    const setupWatchers = useCallback(() => {
        // Ne pas setup si on est en train de nettoyer
        if (isCleaningUpRef.current) {
            console.log('⏸️ Cleanup in progress, skipping setup')
            return
        }

        console.log(`🔧 Setting up watchers (attempt ${connectionAttempts.current + 1})...`)
        setConnectionStatus('connecting')

        // Cleanup des anciens watchers
        cleanupWatchers()

        // Watch Season1 contract
        try {
            console.log('📡 Setting up Season1 watcher...')
            unwatchContractRef.current = wsPublicClient.watchContractEvent({
                address: DIGIT_RABBITS_ADDRESS,
                abi: DIGIT_RABBITS_ABI,
                onLogs(logs) {
                    console.log('📥 Season1 events:', logs.length)
                    lastEventTimeRef.current = Date.now()
                    consecutiveErrorsRef.current = 0 // ✅ Reset compteur d'erreurs

                    logs.forEach((log) => {
                        window.dispatchEvent(
                            new CustomEvent('contractEvent', { detail: log })
                        )
                    })
                },
                onError(error) {
                    console.error('❌ Season1 WebSocket error:', error.message)
                    setIsConnected(false)
                    setConnectionStatus('error')
                    scheduleReconnect('Season1 error')
                },
            })
            console.log('✅ Season1 watcher active')
        } catch (error) {
            console.error('❌ Failed to setup Season1 watcher:', error)
            scheduleReconnect('Season1 setup failed')
            return
        }

        // Watch RabbitChat
        try {
            console.log('📡 Setting up RabbitChat watcher...')
            unwatchChatRef.current = wsPublicClient.watchContractEvent({
                address: DIGIT_RABBITS_CHAT_ADDRESS,
                abi: DIGIT_RABBITS_CHAT_ABI,
                eventName: 'MessageSent',
                onLogs(logs) {
                    console.log('📨 Chat messages:', logs.length)
                    lastEventTimeRef.current = Date.now()
                    consecutiveErrorsRef.current = 0 // ✅ Reset compteur d'erreurs

                    logs.forEach((log) => {
                        const { args } = log

                        if (args) {
                            const newMessage = {
                                type: 'MESSAGE_SENT',
                                messageId: Number(args.messageId),
                                sender: args.sender,
                                content: args.content,
                                score: Number(args.score),
                                senderRole: Number(args.senderRole),
                                twitterUsername: args.twitterUsername,
                                twitterProfilePictureUrl: args.twitterProfilePictureUrl,
                                timestamp: Number(args.timestamp),
                                replyToMessageId: Number(args.replyToMessageId || 0),
                                transactionHash: log.transactionHash
                            }

                            setMessages(prev => {
                                const exists = prev.some(msg => msg.messageId === newMessage.messageId)
                                if (exists) return prev
                                return [...prev, newMessage]
                            })

                            if (log.blockNumber) {
                                lastSyncedBlockRef.current = log.blockNumber
                            }
                        }
                    })
                },
                onError(error) {
                    console.error('❌ Chat WebSocket error:', error.message)
                    setIsSubscribed(false)
                    setConnectionStatus('error')

                    // Fetch missed events avant de reconnecter
                    fetchMissedEvents().finally(() => {
                        scheduleReconnect('Chat error')
                    })
                },
            })

            // ✅ Succès !
            setIsSubscribed(true)
            setIsConnected(true)
            setConnectionStatus('connected')
            connectionAttempts.current = 0 // ✅ Reset compteur de tentatives
            consecutiveErrorsRef.current = 0
            lastEventTimeRef.current = Date.now()
            console.log('✅ All watchers active and connected')

        } catch (error) {
            console.error('❌ Failed to setup Chat watcher:', error)
            setIsSubscribed(false)
            scheduleReconnect('Chat setup failed')
        }
    }, [cleanupWatchers, scheduleReconnect, fetchMissedEvents])

    // ✅ Resync manuel
    const resyncMessages = useCallback(async () => {
        console.log('🔄 Manual resync requested')
        await fetchMissedEvents()
    }, [fetchMissedEvents])

    // ✅ Gestion du refocus avec protection
    const handleRefocus = useCallback(() => {
        if (isCleaningUpRef.current) {
            console.log('⏸️ Cleanup in progress, skipping refocus actions')
            return
        }

        console.log('👀 Page refocused')
        console.log("isConnected:", isConnected, "connectionStatus:", connectionStatus)
        // Toujours resync
        //fetchMissedEvents()

        // Si WS silencieux → restart
        if (!isWebSocketAlive()) {
            console.log('♻️ WebSocket not connected, restarting...')
            connectionAttempts.current = 0 // Reset pour le refocus
            console.log('🕳️ WS silent, restarting')
            setupWatchers()
        }

    }, [fetchMissedEvents, setupWatchers])

    // ✅ Effect principal avec cleanup amélioré
    useEffect(() => {
        if (!embeddedWallet?.address || seasonId == null) {
            console.log('⚠️ Missing wallet or seasonId')
            setConnectionStatus('disconnected')
            return
        }

        console.log('🚀 Initializing WebSocket...')
        isCleaningUpRef.current = false // ✅ Autoriser les connexions

        fetchMissedEvents().then(() => {
            console.log('✅ Initial sync done, setting up watchers')
            cleanupWatchers()
            setupWatchers()
        })

        return () => {
            console.log('🔌 Cleaning up WebSocket...')
            isCleaningUpRef.current = true // ✅ Bloquer toute reconnexion
            cleanupWatchers()
            setIsConnected(false)
            setIsSubscribed(false)
            setConnectionStatus('disconnected')
            connectionAttempts.current = 0
            consecutiveErrorsRef.current = 0
        }
    }, [embeddedWallet?.address, seasonId, fetchMissedEvents, setupWatchers, cleanupWatchers])

    // ✅ Effect pour le refocus
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                handleRefocus()
            }
        }

        const onFocus = () => {
            handleRefocus()
        }

        window.addEventListener('focus', onFocus)
        document.addEventListener('visibilitychange', onVisibilityChange)

        return () => {
            window.removeEventListener('focus', onFocus)
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [handleRefocus])

    return {
        messages,
        isConnected,
        isSubscribed,
        isSyncing,
        connectionStatus,
        resyncMessages,
        reconnectionAttempts: connectionAttempts.current,
        maxAttempts: maxReconnectAttempts
    }
}