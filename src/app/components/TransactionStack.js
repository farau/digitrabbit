'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const getExplorerUrl = (tx) => `https://web3.okx.com/explorer/megaeth-testnet/tx/${tx}`

export default function TransactionStack({
    isExecuting,
    showSuccess,
    error,
    transactionHash,
    gameState
}) {
    const [stack, setStack] = useState([])
    const timeoutsRef = useRef(new Map())
    const transactionCounterRef = useRef(0)
    const gameCleanupTimeoutRef = useRef(null) // Nouveau ref pour le timeout de nettoyage

    // Debug : Afficher les props reçues
    /*console.log('TransactionStack props:', {
        isExecuting,
        showSuccess,
        error,
        transactionHash,
        gameState
    })*/

    // Fonction pour nettoyer les timeouts
    const clearTimeoutForTx = (txId) => {
        const timeout = timeoutsRef.current.get(txId)
        if (timeout) {
            clearTimeout(timeout)
            timeoutsRef.current.delete(txId)
        }
    }

    // Fonction stable avec useCallback
    const scheduleRemoval = useCallback((txId, delay = 3000) => {
        clearTimeoutForTx(txId)

        const timeout = setTimeout(() => {
            setStack((prev) => {
                const currentStack = prev || []
                const updated = currentStack.filter((tx) => tx.id !== txId)
                //console.log('Removing transaction from stack:', txId, 'Updated stack:', updated)
                return updated
            })
            timeoutsRef.current.delete(txId)
        }, delay)

        timeoutsRef.current.set(txId, timeout)
    }, [])

    // Effet principal pour gérer les transactions
    useEffect(() => {
        //console.log('useEffect triggered with:', { isExecuting, showSuccess, error, transactionHash })

        // Générer un ID unique pour chaque transaction
        const txId = `tx_${Date.now()}_${transactionCounterRef.current++}`

        if (isExecuting) {
            //console.log('Adding new executing transaction:', txId)

            // Annuler le nettoyage de fin de jeu si une nouvelle transaction commence
            if (gameCleanupTimeoutRef.current) {
                clearTimeout(gameCleanupTimeoutRef.current)
                gameCleanupTimeoutRef.current = null
            }

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

                const newStack = [newTransaction, ...withoutExecuting]
                //console.log('New stack with executing transaction:', newStack)
                return newStack
            })

            // Timeout de sécurité pour éviter les transactions qui restent bloquées
            scheduleRemoval(txId, 10000) // 10 secondes max pour une transaction

        } else if ((showSuccess || error) && !isExecuting) {
            //console.log('Updating transaction status:', { showSuccess, error, transactionHash })

            // Si on a un succès ou erreur mais pas de transaction en cours, créer une transaction terminée
            setStack((prev) => {
                const currentStack = prev || []
                //console.log('Current stack before update:', currentStack)

                // Chercher une transaction en cours d'exécution
                const executingTx = currentStack.find(tx => tx.isExecuting)

                if (executingTx) {
                    // Mettre à jour la transaction existante
                    const updated = currentStack.map((tx) => {
                        if (tx.isExecuting) {
                            clearTimeoutForTx(tx.id)
                            const updatedTx = {
                                ...tx,
                                isExecuting: false,
                                isSuccess: showSuccess && !error,
                                isError: !!error,
                                transactionHash: transactionHash || tx.transactionHash
                            }
                            //console.log('Updated existing transaction:', updatedTx)
                            return updatedTx
                        }
                        return tx
                    })
                    return updated
                } else {
                    // Créer une nouvelle transaction déjà terminée (cas où isExecuting n'a pas été vu)
                    //console.log('Creating completed transaction directly')
                    const newTransaction = {
                        id: txId,
                        isExecuting: false,
                        isSuccess: showSuccess && !error,
                        isError: !!error,
                        transactionHash: transactionHash,
                        timestamp: Date.now()
                    }
                    const newStack = [newTransaction, ...currentStack]
                    //console.log('New stack with completed transaction:', newStack)
                    return newStack
                }
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

    // Debug : Afficher la stack actuelle
    useEffect(() => {
        //console.log('Stack updated:', stack)
    }, [stack])

    // Nettoyage lors du démontage du composant
    useEffect(() => {
        const timeouts = timeoutsRef.current

        return () => {
            timeouts.forEach(timeout => clearTimeout(timeout))
            timeouts.clear()
            if (gameCleanupTimeoutRef.current) {
                clearTimeout(gameCleanupTimeoutRef.current)
            }
        }
    }, [])

    // Nettoyage lors des changements d'état de jeu avec délai
    useEffect(() => {
        if (gameState && !gameState.isGameStarted) {
            //console.log('Game ended, scheduling stack cleanup in 2 seconds')

            // Annuler le timeout précédent s'il existe
            if (gameCleanupTimeoutRef.current) {
                clearTimeout(gameCleanupTimeoutRef.current)
            }

            // Programmer le nettoyage avec un délai de 2 secondes
            gameCleanupTimeoutRef.current = setTimeout(() => {
                //console.log('Executing delayed stack cleanup')
                setStack([])
                timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
                timeoutsRef.current.clear()
                gameCleanupTimeoutRef.current = null
            }, 2000) // 2 secondes de délai
        } else if (gameState && gameState.isGameStarted) {
            // Si le jeu recommence, annuler le nettoyage programmé
            if (gameCleanupTimeoutRef.current) {
                //console.log('Game started, canceling scheduled cleanup')
                clearTimeout(gameCleanupTimeoutRef.current)
                gameCleanupTimeoutRef.current = null
            }
        }
    }, [gameState?.isGameStarted, gameState])

    // Protection contre les valeurs undefined
    if (!Array.isArray(stack)) {
        return null
    }

    // Debug : Afficher ce qui va être rendu
    //console.log('Rendering stack with', stack.length, 'items:', stack)

    return (
        <div className="fixed top-80 md:top-50 right-4 flex flex-col gap-2 w-32 md:w-48 z-50 pointer-events-none">
            {/* Retirer le debug en prod */}
            {/* <div className="bg-red-500 text-white p-2 text-xs rounded">
                Debug: Stack has {stack.length} items
            </div> */}

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
                            zIndex: 1000 - index
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
                                        <p className="text-xs font-medium hidden sm:block">Tx Successful</p>
                                        <p className="text-xs font-medium sm:hidden">Success</p>
                                        {item.transactionHash && (
                                            <p className="text-xs opacity-70 font-mono hidden sm:block">Click to view</p>
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
                                        <p className="text-xs font-medium hidden sm:block">Tx Failed</p>
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
