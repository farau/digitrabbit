// hooks/useWalletClient.js - Version améliorée
import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { initWalletClient, clearWalletClient } from '@/lib/walletClient'

export function useWalletClient(embeddedWallet) {
    const [walletClient, setWalletClient] = useState(null)
    const { ready, authenticated } = usePrivy()

    useEffect(() => {
        const init = async () => {
            try {
                const client = await initWalletClient(embeddedWallet)
                setWalletClient(client)
            } catch (err) {
                console.warn('WalletClient init failed', err)
                setWalletClient(null)
            }
        }

        // ✅ Conditions complètes : ready, authenticated ET embeddedWallet
        if (ready && authenticated && embeddedWallet?.address) {
            init()
        } else {
            // ✅ Nettoyer si une des conditions n'est plus remplie
            clearWalletClient()
            setWalletClient(null)
        }
    }, [ready, authenticated, embeddedWallet?.address])

    return { walletClient }
}