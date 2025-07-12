// hooks/usePreSignedPool.js - Version centralisée avec gestion complète du jeu
import { useState, useRef, useCallback, useEffect } from 'react'
import { encodeFunctionData } from 'viem'
import { megaethTestnet } from 'viem/chains'
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS } from '@/utils/constants.js'
import { useWalletClient } from './useWalletClient'


const play = encodeFunctionData({
    abi: DIGIT_RABBITS_ABI,
    functionName: 'play',
    args: []
})

export const usePreSignedPool = ({ embeddedWallet, isWalletReady }) => {
    const [preSignedPool, setPreSignedPool] = useState(null)
    const [isInitializing, setIsInitializing] = useState(false)
    const [error, setError] = useState('')
    const [isGameStarted, setIsGameStarted] = useState(false)
    const [isWritingContract, setIsWritingContract] = useState(false)
    const [errorStartGame, setErrorStartGame] = useState('')
    const [timer, setTimer] = useState(60)
    const [isExecuting, setIsExecuting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [currentTransactionHash, setCurrentTransactionHash] = useState('')
    const [signedTx, setSignedTx] = useState('')
    const [showTwitterShare, setShowTwitterShare] = useState(false)
    const [finalScore, setFinalScore] = useState(0)
    const [walletStatus, setWalletStatus] = useState('waiting') // 'waiting', 'ready', 'unavailable'

    const extendingRef = useRef(false)
    const hasInitialized = useRef(false)
    const timerRef = useRef(null)
    const { walletClient } = useWalletClient(embeddedWallet)

    // Gestion du statut du wallet
    useEffect(() => {
        if (!isWalletReady) {
            setWalletStatus('waiting')
            return
        }

        if (embeddedWallet && walletClient) {
            setWalletStatus('ready')
        } else {
            setWalletStatus('unavailable')
        }
    }, [isWalletReady, embeddedWallet, walletClient])

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
        if (walletStatus !== 'ready') return

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
    }, [walletClient, embeddedWallet?.address, preSignedPool, walletStatus])

    const initializePool = useCallback(async () => {
        if (walletStatus !== 'ready') {
            console.log('⏳ Wallet not ready, skipping pool initialization')
            return null
        }

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

            ///////////// ON AJOUTE + 1 CAR IL FAUT PRENDRE EN COMPTE LA TRANSACTION POUR DEMARRER LA PARTIE /////////////
            nonce = nonce + 1

            const { gasPrice, gasLimit } = await defineGasPrice(walletClient)

            console.log(`Pre-signing 15 transactions...`)
            const signingPromises = Array.from({ length: 15 }, async (_, i) => {
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

            setPreSignedPool({
                transactions,
                currentIndex: 0,
                baseNonce: nonce,
                isRefilling: false,
                hasTriggeredRefill: false
            })

            hasInitialized.current = true
            console.log(`✅ Pre-signed 15 transactions for MegaETH`)

        } catch (err) {
            console.error('❌ Error initializing network:', err)
            setError(`Failed to initialize MegaETH: ${err.message}`)
        } finally {
            setIsInitializing(false)
        }
    }, [walletClient, embeddedWallet?.address, walletStatus])

    // Auto-initialisation quand le wallet est prêt
    useEffect(() => {
        if (walletStatus !== 'ready') return
        if (hasInitialized.current) return
        if (!walletClient || !embeddedWallet?.address) return

        console.log('🔄 Auto-initializing pool...')
        initializePool()
    }, [walletClient, embeddedWallet?.address, initializePool, walletStatus])

    // Timer du jeu
    useEffect(() => {
        if (!isGameStarted) return

        timerRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current)
                    // Fin du jeu
                    setIsGameStarted(false)
                    setShowTwitterShare(true)
                    setTimer(60)
                    console.log('⏰ Game ended by timer')
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [isGameStarted])

    // Reset de l'état d'initialisation si le wallet change
    useEffect(() => {
        hasInitialized.current = false
        setPreSignedPool(null)
        setError('')
        setIsGameStarted(false)
        setErrorStartGame('')
        setTimer(60)
        setIsExecuting(false)
        setShowSuccess(false)
        setCurrentTransactionHash('')
        setSignedTx('')
        setShowTwitterShare(false)
        setFinalScore(0)
    }, [embeddedWallet?.address])

    // Fonction pour démarrer le jeu (basée sur le composant Game)
    const startGame = useCallback(async () => {
        try {
            if (walletStatus !== 'ready') {
                throw new Error('Wallet not ready. Please wait for wallet initialization.')
            }

            if (!walletClient || !embeddedWallet || !embeddedWallet.address) {
                throw new Error('No wallet client set')
            }

            console.log(`Starting game on MegaETH Testnet...`)

            setIsWritingContract(true)
            setErrorStartGame('')

            const result = await walletClient.writeContract({
                account: embeddedWallet.address,
                address: DIGIT_RABBITS_ADDRESS,
                abi: DIGIT_RABBITS_ABI,
                functionName: 'startGame',
                args: [],
                chain: megaethTestnet
            })

            if (!result) {
                throw new Error('Failed to start game')
            }

            console.log(`Game started with hash: ${result}`)
            setIsGameStarted(true)
            setPreSignedPool(prev => {
                if (!prev) return null
                return {
                    ...prev,
                    currentIndex: prev.currentIndex + 1
                }
            }) // Incrémenter l'index pour la première transaction
            setTimer(60)
            setFinalScore(0) // Sauvegarder le score initial

            return result

        } catch (err) {
            console.error('Contract write failed:', err)
            setErrorStartGame(err.shortMessage || err.message)
            throw err
        } finally {
            setIsWritingContract(false)
        }
    }, [walletClient, embeddedWallet, walletStatus])

    const executeTransaction = useCallback(async () => {

        if (walletStatus !== 'ready') {
            setError('Wallet not ready')
            return null
        }

        // Vérification que le jeu a débuté
        if (!isGameStarted) {
            setError('Game not started')
            return null
        }

        if (!preSignedPool || preSignedPool.currentIndex >= preSignedPool.transactions.length) {
            setError('No pre-signed transactions available')
            return null
        }

        const currentTxId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        setIsExecuting(true)
        setError('')
        setShowSuccess(false)
        setSignedTx(currentTxId)

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

            setCurrentTransactionHash(result.transactionHash || result)
            setShowSuccess(true)

            return {
                hash: result.transactionHash || result,
                timeTaken
            }

        } catch (err) {
            console.error('❌ Error executing:', err)
            setError(err.message)
            setShowSuccess(false)
            throw err
        } finally {
            console.log('🏁 Fin executeTransaction')
            setIsExecuting(false)
        }
    }, [walletClient, embeddedWallet?.address, preSignedPool, extendPool, isGameStarted, walletStatus])

    const syncPoolWithBlockchain = useCallback(async () => {
        if (!preSignedPool || !walletClient || !embeddedWallet?.address) {
            console.log('Cannot sync pool: missing requirements')
            return
        }

        try {
            const currentNonce = await walletClient.getTransactionCount({
                address: embeddedWallet.address,
                blockTag: 'pending'
            })

            // Calculer l'index attendu 
            const expectedIndex = currentNonce - preSignedPool.baseNonce + 1 // +1 pour inclure la transaction de démarrage du jeu


            if (expectedIndex !== preSignedPool.currentIndex) {
                console.log('Syncing pool with blockchain:', {
                    currentNonce,
                    baseNonce: preSignedPool.baseNonce,
                    expectedIndex,
                    currentIndex: preSignedPool.currentIndex
                })
                setPreSignedPool(prev => {
                    if (!prev) return null

                    const newIndex = Math.max(0, Math.min(expectedIndex, prev.transactions.length))

                    console.log(`🔄 Syncing pool index from ${prev.currentIndex} to ${newIndex}`)

                    return {
                        ...prev,
                        currentIndex: newIndex,
                        hasTriggeredRefill: newIndex < prev.currentIndex ? false : prev.hasTriggeredRefill
                    }
                })
            }

        } catch (err) {
            console.error('❌ Error syncing pool with blockchain:', err)
            setError(`Failed to sync pool: ${err.message}`)
        }
    }, [preSignedPool, walletClient, embeddedWallet?.address])

    const incrementIndex = useCallback(() => {
        // Vérification que le jeu a débuté avant d'incrémenter
        if (!isGameStarted) {
            setError('Game not started')
            return
        }

        setPreSignedPool(prev => {
            if (!prev) return null
            return {
                ...prev,
                currentIndex: prev.currentIndex + 1
            }
        })
    }, [isGameStarted])

    const getAvailableTransactions = useCallback(() => {
        return preSignedPool ? preSignedPool.transactions.length - preSignedPool.currentIndex : 0
    }, [preSignedPool])

    const resetPool = useCallback(() => {
        setPreSignedPool(null)
        setError('')
        setIsGameStarted(false)
        setErrorStartGame('')
        setTimer(60)
        setIsExecuting(false)
        setShowSuccess(false)
        setCurrentTransactionHash('')
        setSignedTx('')
        setShowTwitterShare(false)
        setFinalScore(0)
        hasInitialized.current = false

        if (timerRef.current) {
            clearInterval(timerRef.current)
        }
    }, [])

    // Fonction pour fermer le modal Twitter
    const closeTwitterShare = useCallback(() => {
        setShowTwitterShare(false)
    }, [])

    // Fonction pour mettre à jour le score final
    const updateFinalScore = useCallback((score) => {
        setFinalScore(score)
    }, [])

    return {
        // États du wallet
        walletStatus,
        isWalletReady: walletStatus === 'ready',

        // États du pool
        preSignedPool,
        isInitializing,
        error,

        // États du jeu
        isGameStarted,
        isWritingContract,
        errorStartGame,
        timer,

        // États des transactions
        isExecuting,
        showSuccess,
        currentTransactionHash,
        signedTx,

        // États du partage
        showTwitterShare,
        finalScore,

        // Fonctions du jeu
        startGame,
        updateFinalScore,
        closeTwitterShare,

        // Fonctions du pool
        initializePool,
        executeTransaction,
        incrementIndex,
        syncPoolWithBlockchain,
        getAvailableTransactions,
        resetPool,
        extendPool
    }
}