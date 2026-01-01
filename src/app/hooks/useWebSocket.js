import { useState, useEffect, useRef } from 'react'
import { createPublicClient, webSocket } from 'viem'
import { mainnet } from 'viem/chains'
import {
    DIGIT_RABBITS_ADDRESS,
    DIGIT_RABBITS_ABI,
} from '@/utils/chainConfig'

export const useWebSocket = ({ embeddedWallet, seasonId }) => {
    const [isConnected, setIsConnected] = useState(false)
    const unwatchContractRef = useRef(null)

    useEffect(() => {
        if (!embeddedWallet?.address || seasonId == null) {
            return
        }

        const client = createPublicClient({
            chain: mainnet,
            transport: webSocket(
                `wss://carrot.megaeth.com/ws?vip=1&u=digitrabbits%20v2&v=5184000&s=mafia&verify=${process.env.NEXT_PUBLIC_RPC_KEY}`,
                {
                    reconnect: { attempts: 10, delay: 3000 },
                }
            ),
        })

        setIsConnected(true)
        // console.log('✅ WebSocket connected')
        unwatchContractRef.current = client.watchContractEvent({
            address: DIGIT_RABBITS_ADDRESS,
            abi: DIGIT_RABBITS_ABI,
            onLogs(logs) {
                logs.forEach((log) => {
                    window.dispatchEvent(
                        new CustomEvent('contractEvent', { detail: log })
                    )
                })
            },
            onError(error) {
                console.error('❌ WebSocket contract event error:', error)
                // éventuellement: setIsConnected(false)
            },
        })

        return () => {
            if (unwatchContractRef.current) {
                unwatchContractRef.current()
                unwatchContractRef.current = null
            }
            setIsConnected(false)
        }
    }, [embeddedWallet?.address, seasonId])

    return { isConnected }
}
