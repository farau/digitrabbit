// hooks/usePreSignedPool.js - Version améliorée avec auto-initialisation
import { useState, useRef, useCallback, useEffect } from 'react'
import { encodeFunctionData } from 'viem'
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS } from '@/utils/constants'
import { useWalletClient } from './useWalletClient'
import { InternalRpcError } from 'viem';

const play = encodeFunctionData({
    abi: DIGIT_RABBITS_ABI,
    functionName: 'play',
    args: []
})

export const usePreSignedPool = ({ embeddedWallet }) => {
    const [preSignedPool, setPreSignedPool] = useState(null)
    const [isInitializing, setIsInitializing] = useState(false)
    const [error, setError] = useState('')
    const extendingRef = useRef(false)
    const hasInitialized = useRef(false) // Pour éviter les re-initialisations
    const { walletClient } = useWalletClient(embeddedWallet)

    const defineGasPrice = async (walletClient) => {
        try {
            const networkGasPrice = await walletClient.getGasPrice()
            return {
                gasPrice: networkGasPrice,
                gasLimit: 300000n
            }
        } catch (error) {
            console.warn('⚠️ Failed to get gas price, using fallback:', error)
            return {
                gasPrice: 1000000000n, // 1 gwei
                gasLimit: 50000n
            }
        }
    }

    const extendPool = useCallback(async () => {
        if (extendingRef.current) return
        extendingRef.current = true

        try {
            if (!walletClient || !embeddedWallet?.address) throw new Error('Wallet or client not ready')

            const currentPool = preSignedPool
            if (!currentPool) throw new Error("No pool available")

            const baseNonce = currentPool.baseNonce
            const existingTxs = currentPool.transactions
            const nextNonce = baseNonce + existingTxs.length

            console.log("➡️ Start extension at nonce:", nextNonce)

            const { gasPrice, gasLimit } = await defineGasPrice(walletClient)

            const signingPromises = Array.from({ length: 10 }, (_, i) => {
                const nonce = nextNonce + i
                return walletClient.signTransaction({
                    account: embeddedWallet.address,
                    to: DIGIT_RABBITS_ADDRESS,
                    data: play,
                    nonce,
                    maxFeePerGas: gasPrice,
                    maxPriorityFeePerGas: gasPrice / 10n,
                    type: 'eip1559',
                    gas: gasLimit,
                })
            })

            const newTxs = await Promise.all(signingPromises)

            setPreSignedPool(prev => {
                if (!prev) return null
                return {
                    ...prev,
                    transactions: [...prev.transactions, ...newTxs],
                    isRefilling: false,
                    hasTriggeredRefill: false
                }
            })

            console.log(`✅ Extended pool from ${nextNonce} to ${nextNonce + 9}`)

        } catch (err) {
            console.error("❌ Error extending pool:", err)
            setPreSignedPool(prev => prev ? { ...prev, isRefilling: false } : null)
        } finally {
            extendingRef.current = false
        }
    }, [walletClient, embeddedWallet?.address, preSignedPool])

    const initializePool = useCallback(async () => {
        setIsInitializing(true)
        setError('')
        setPreSignedPool(null)

        try {
            if (!walletClient) return null
            if (!embeddedWallet?.address) throw new Error('Wallet address missing')

            console.log(`🚀 Initializing MegaETH with pre-signed transactions...`)

            let nonce = await walletClient.getTransactionCount({
                address: embeddedWallet?.address,
                blockTag: 'pending'
            })
            nonce = nonce + 1 // On ajoute 1 car la 1ere transaction est pour le démarrage du jeu

            const { gasPrice, gasLimit } = await defineGasPrice(walletClient)

            console.log(`Pre-signing 10 transactions...`)
            const signingPromises = Array.from({ length: 10 }, async (_, i) => {
                return await walletClient.signTransaction({
                    account: embeddedWallet?.address,
                    to: DIGIT_RABBITS_ADDRESS,
                    data: play,
                    nonce: nonce + i,
                    maxFeePerGas: gasPrice,
                    maxPriorityFeePerGas: gasPrice / 10n,
                    type: 'eip1559',
                    gas: gasLimit,
                })
            })

            const transactions = await Promise.all(signingPromises)

            const poolData = {
                transactions,
                currentIndex: 0,
                baseNonce: nonce,
                isRefilling: false,
                hasTriggeredRefill: false
            }
            setPreSignedPool(poolData)

            hasInitialized.current = true
            console.log(`✅ Pre-signed 10 transactions for MegaETH`)
            return poolData
        } catch (err) {
            console.error('❌ Error initializing network:', err)
            setError(`Failed to initialize MegaETH: ${err.message}`)
        } finally {
            setIsInitializing(false)
        }
    }, [walletClient, embeddedWallet?.address])

    // Reset de l'état d'initialisation si le wallet change
    useEffect(() => {
        hasInitialized.current = false
        setPreSignedPool(null)
        setError('')
    }, [embeddedWallet?.address])

    const executeTransaction = useCallback(async () => {

        setError('')

        if (!preSignedPool || preSignedPool.currentIndex >= preSignedPool.transactions.length) {
            setError('No pre-signed transactions available')
            return null
        }

        try {
            if (!walletClient) return null
            if (!embeddedWallet?.address) throw new Error('Wallet address missing')

            const signedTx = preSignedPool.transactions[preSignedPool.currentIndex]
            const startTime = performance.now()

            const result = await walletClient.request({
                method: 'realtime_sendRawTransaction',
                params: [signedTx],
            })

            if (!result) {
                throw new Error('Failed to play the game')
            }

            const endTime = performance.now()
            const timeTaken = Math.round(endTime - startTime)

            // Mettre à jour le pool de transactions
            setPreSignedPool(prev => {
                if (!prev) return null

                const newCurrentIndex = prev.currentIndex + 1

                // Refill every 7 transactions (50% of initial 15), but only once per batch
                if (newCurrentIndex % 7 === 0 && !prev.hasTriggeredRefill) {
                    console.log(`🔔 Triggering refill at ${newCurrentIndex} transactions used`)
                    setTimeout(() => extendPool(), 0)
                    return {
                        ...prev,
                        currentIndex: newCurrentIndex,
                        hasTriggeredRefill: true
                    }
                }

                return {
                    ...prev,
                    currentIndex: newCurrentIndex
                }
            })

            return {
                hash: result.transactionHash || result,
                timeTaken
            }

        } catch (err) {
            console.error('❌ Error executing:', err)
            setError(err.message)
            if (err.details?.includes('nonce too low')) {
                console.log("On incrémente l'index car erreur nonce too low")
                incrementIndex();
            }

            if (err instanceof InternalRpcError && err.details?.includes('already known')) {
                console.log("On incrémente l'index car erreur already known")
                incrementIndex();
            }

            throw err
        }
    }, [walletClient, embeddedWallet?.address, preSignedPool, extendPool])

    const incrementIndex = useCallback(() => {
        setPreSignedPool(prev => {
            if (!prev) return null
            return {
                ...prev,
                currentIndex: prev.currentIndex + 1
            }
        })
    }, [])

    const getAvailableTransactions = useCallback(() => {
        return preSignedPool ? preSignedPool.transactions.length - preSignedPool.currentIndex : 0
    }, [preSignedPool])

    const resetPool = useCallback(() => {
        console.log("Reinitializing pool")
        setPreSignedPool(null)
        setError('')
        hasInitialized.current = false
    }, [])

    return {
        preSignedPool,
        isInitializing,
        error,
        initializePool, // Garde la fonction pour une initialisation manuelle si nécessaire
        executeTransaction,
        incrementIndex,
        getAvailableTransactions,
        resetPool,
        extendPool
    }
}