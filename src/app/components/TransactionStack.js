'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const getExplorerUrl = (tx) => `https://web3.okx.com/explorer/megaeth-testnet/tx/${tx}`

export default function TransactionStack({
    isExecuting,
    showSuccess,
    error,
    transactionHash,
    gameState // Nouvel prop pour accéder à l'état complet du jeu
}) {
    const [stack, setStack] = useState([])
    const timeoutsRef = useRef(new Map())
    const transactionCounterRef = useRef(0)

    // Fonction pour nettoyer les timeouts
    const clearTimeoutForTx = (txId) => {
        const timeout = timeoutsRef.current.get(txId)
        if (timeout) {
            clearTimeout(timeout)
            timeoutsRef.current.delete(txId)
        }
    }

    // Fonction pour programmer la suppression d'une transaction après un délai
    // Fonction stable avec useCallback
    const scheduleRemoval = useCallback((txId, delay = 3000) => {
        clearTimeoutForTx(txId)

        const timeout = setTimeout(() => {
            setStack((prev) => {
                const currentStack = prev || []
                const updated = currentStack.filter((tx) => tx.id !== txId)
                return updated
            })
            timeoutsRef.current.delete(txId)
        }, delay)

        timeoutsRef.current.set(txId, timeout)
    }, []) // Vide car toutes les dépendances sont stables

    // Effet principal pour gérer les transactions
    useEffect(() => {
        // Générer un ID unique pour chaque transaction
        const txId = `tx_${Date.now()}_${transactionCounterRef.current++}`

        if (isExecuting) {
            // Nouvelle transaction en cours - nettoyer les anciennes transactions en cours
            setStack((prev) => {
                const currentStack = prev || []

                // Supprimer toutes les transactions en cours d'exécution
                const withoutExecuting = currentStack.filter(tx => !tx.isExecuting)

                // Nettoyer les timeouts des transactions supprimées
                currentStack.forEach(tx => {
                    if (tx.isExecuting) {
                        clearTimeoutForTx(tx.id)
                    }
                })

                // Ajouter la nouvelle transaction
                const newTransaction = {
                    id: txId,
                    isExecuting: true,
                    isSuccess: false,
                    isError: false,
                    transactionHash: null,
                    timestamp: Date.now()
                }

                return [newTransaction, ...withoutExecuting]
            })

            // Timeout de sécurité pour éviter les transactions qui restent bloquées
            scheduleRemoval(txId, 10000) // 10 secondes max pour une transaction

        } else if (showSuccess || error) {
            // Transaction terminée - mettre à jour le statut
            setStack((prev) => {
                const currentStack = prev || []

                const updated = currentStack.map((tx) => {
                    // Mettre à jour la transaction la plus récente en cours d'exécution
                    if (tx.isExecuting) {
                        clearTimeoutForTx(tx.id) // Nettoyer le timeout de sécurité

                        return {
                            ...tx,
                            isExecuting: false,
                            isSuccess: showSuccess && !error,
                            isError: !!error,
                            transactionHash: transactionHash || tx.transactionHash
                        }
                    }
                    return tx
                })

                return updated
            })

            // Programmer la suppression après 1 secondes pour les succès, 5 secondes pour les erreurs
            const delay = error ? 5000 : 1000
            setTimeout(() => {
                setStack((prev) => {
                    const currentStack = prev || []
                    const mostRecentCompleted = currentStack.find(tx => !tx.isExecuting)
                    if (mostRecentCompleted) {
                        scheduleRemoval(mostRecentCompleted.id, 100)
                    }
                    return currentStack
                })
            }, delay)
        }

    }, [isExecuting, showSuccess, error, transactionHash, scheduleRemoval])

    // Nettoyage lors du démontage du composant
    useEffect(() => {
        // Capturer la référence actuelle dans une variable locale
        const timeouts = timeoutsRef.current

        return () => {
            // Nettoyer tous les timeouts lors du démontage
            timeouts.forEach(timeout => clearTimeout(timeout))
            timeouts.clear()
        }
    }, [])

    // Nettoyage lors des changements d'état de jeu
    useEffect(() => {
        if (gameState && !gameState.isGameStarted) {
            // Nettoyer la stack quand le jeu se termine
            setStack([])
            timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
            timeoutsRef.current.clear()
        }
    }, [gameState?.isGameStarted, gameState])

    // Protection contre les valeurs undefined
    if (!Array.isArray(stack)) {
        return null
    }

    return (
        <div className="fixed top-80 md:top-50 right-4 flex flex-col gap-2 w-32 md:w-48 z-50 pointer-events-none">
            <AnimatePresence mode="popLayout" initial={false}>
                {(stack || []).slice(0, 3).map((item, index) => (
                    <motion.div
                        key={item.id}
                        layout
                        initial={{
                            y: -20,
                            opacity: 0,
                            scale: 0.8,
                        }}
                        animate={{
                            y: 0,
                            opacity: 1,
                            scale: 1
                        }}
                        exit={{
                            y: 100,
                            opacity: 0,
                            scale: 0.8,
                            transition: { duration: 0.4, ease: "easeInOut" }
                        }}
                        transition={{
                            type: 'spring',
                            damping: 20,
                            stiffness: 250,
                            layout: { duration: 0.4, ease: "easeInOut" }
                        }}
                        className={`rounded-lg p-3 border shadow-md backdrop-blur-sm transition-all duration-300 ${item.isError
                            ? 'bg-red-50/90 border-red-200 text-red-700 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300'
                            : item.isSuccess
                                ? 'bg-green-50/90 border-green-200 text-green-700 dark:bg-green-950/50 dark:border-green-800 dark:text-green-300 pointer-events-auto cursor-pointer hover:bg-green-100/90 dark:hover:bg-green-900/50'
                                : 'bg-white/90 dark:bg-neutral-900/90 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
                            }`}
                        onClick={item.isSuccess && item.transactionHash ? () => window.open(getExplorerUrl(item.transactionHash), '_blank') : undefined}
                        style={{
                            zIndex: 1000 - index // Les nouvelles transactions apparaissent au-dessus
                        }}
                    >
                        <div className="flex items-center space-x-2">
                            {item.isExecuting && (
                                <>
                                    <div className="w-3 h-3 border-2 border-t-transparent border-current rounded-full animate-spin flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-medium">Processing...</p>
                                    </div>
                                </>
                            )}
                            {item.isSuccess && (
                                <>
                                    <div className="w-4 h-4 flex items-center justify-center bg-green-500 text-white rounded-full text-xs font-bold flex-shrink-0">
                                        ✓
                                    </div>
                                    <div>
                                        {/* Texte desktop */}
                                        <p className="text-xs font-medium hidden sm:block">Tx Successful</p>
                                        {/* Texte mobile */}
                                        <p className="text-xs font-medium sm:hidden">Success</p>

                                        {item.transactionHash && (
                                            <>
                                                {/* Texte desktop */}
                                                <p className="text-xs opacity-70 font-mono hidden sm:block">Click to view</p>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}

                            {item.isError && (
                                <>
                                    <div className="w-4 h-4 flex items-center justify-center bg-red-500 text-white rounded-full text-xs font-bold flex-shrink-0">
                                        ✕
                                    </div>
                                    <div>
                                        {/* Texte desktop */}
                                        <p className="text-xs font-medium hidden sm:block">Tx Failed</p>
                                        {/* Texte mobile */}
                                        <p className="text-xs font-medium sm:hidden">Failed</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}