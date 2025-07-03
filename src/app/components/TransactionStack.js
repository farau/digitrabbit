'use client'

import { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const getExplorerUrl = (tx) => `https://web3.okx.com/explorer/megaeth-testnet/tx/${tx}`

export default function TransactionStack({ isExecuting, showSuccess, error, txId, transactionHash }) {
    const [stack, setStack] = useState([])
    const timeoutsRef = useRef(new Map())

    // Fonction pour nettoyer les timeouts
    const clearTimeoutForTx = (txId) => {
        const timeout = timeoutsRef.current.get(txId)
        if (timeout) {
            clearTimeout(timeout)
            timeoutsRef.current.delete(txId)
        }
    }

    // Fonction pour programmer la suppression d'une transaction après 3 secondes
    const scheduleRemoval = (txId, delay = 3000) => {
        clearTimeoutForTx(txId) // Nettoyer l'ancien timeout s'il existe

        const timeout = setTimeout(() => {
            setStack((prev) => {
                const updated = prev.filter((tx) => tx.id !== txId)
                return updated
            })
            timeoutsRef.current.delete(txId)
        }, delay)

        timeoutsRef.current.set(txId, timeout)
    }

    useEffect(() => {
        // Ne pas traiter si txId est vide
        if (!txId) return

        if (isExecuting) {
            // Nouvelle transaction lancée - supprimer toutes les transactions en cours
            // car elles seront invalidées par le nonce blockchain
            setStack((prev) => {
                // Supprimer toutes les transactions en isExecuting
                const withoutExecuting = prev.filter(tx => !tx.isExecuting)

                // Nettoyer les timeouts des transactions supprimées
                prev.forEach(tx => {
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

                // Ajouter en haut, pas de limite dans le state (limitée seulement à l'affichage)
                return [newTransaction, ...withoutExecuting]
            })

            // Programmer un timeout de sécurité pour cette nouvelle transaction
            scheduleRemoval(txId, 3000)

        } else {
            // Transaction terminée - nettoyer le timeout de sécurité
            clearTimeoutForTx(txId)

            // Mettre à jour le statut
            setStack((prev) => {
                return prev.map((tx) => {
                    if (tx.id === txId) {
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
            })

            // Programmer la suppression après 2 secondes
            scheduleRemoval(txId, 2000)
        }

    }, [isExecuting, showSuccess, error, txId, transactionHash])

    // Nettoyage lors du démontage du composant
    useEffect(() => {
        return () => {
            // Nettoyer tous les timeouts lors du démontage
            timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
            timeoutsRef.current.clear()
        }
    }, [])

    return (
        <div className="fixed top-80 md:top-50 right-4 flex flex-col gap-2 w-32 md:w-48 z-50 pointer-events-none">
            <AnimatePresence mode="popLayout" initial={false}>
                {stack.slice(0, 3).map((item, index) => (
                    <motion.div
                        key={item.id}
                        layout
                        initial={{
                            y: 0,
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