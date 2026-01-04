import { useState, useEffect, useRef } from 'react'

import {
    DIGIT_RABBITS_ADDRESS,
    DIGIT_RABBITS_ABI,
    customMegaethTestnet,
    wsPublicClient
} from '@/utils/chainConfig'

export const useWebSocket = ({ embeddedWallet, seasonId }) => {
    const [isConnected, setIsConnected] = useState(false)
    const unwatchContractRef = useRef(null)

    useEffect(() => {
        if (!embeddedWallet?.address || seasonId == null) {
            return
        }

        setIsConnected(true)
        // console.log('✅ WebSocket connected')
        unwatchContractRef.current = wsPublicClient.watchContractEvent({
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
