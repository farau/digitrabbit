// src/app/test-megaeth/page.tsx
'use client'

import styles from './Game.module.css'
import { useState, useEffect, useRef, useCallback } from 'react'
import { megaethTestnet } from 'viem/chains'
import { Loader2 } from 'lucide-react'
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, COOLDOWN_SECONDS, publicClient } from '@/constants'
import { encodeFunctionData } from 'viem'

import React from 'react'
import Wrapper from './Wrapper'
import { getWalletClient } from '@/utils/walletClient';
// Rabbit 3D model
import RabbitModel from './RabbitModel'

import TransactionStack from './TransactionStack'
import TransactionHistoryTable from './TransactionHistoryTable'

const play = encodeFunctionData({
  abi: DIGIT_RABBITS_ABI,
  functionName: 'play',
  args: []
})

const start = encodeFunctionData({
  abi: DIGIT_RABBITS_ABI,
  functionName: 'startGame',
  args: []
})

const test = '0xa2e62045'

function PlayerData({ refreshCounter, themeMode, seasonId, playerData, embeddedWallet }) {
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [columns, setColumns] = useState(2); // par défaut : mobile = 2 colonnes

  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const borderColor = isNight ? '#444' : '#ddd';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';

  const { rabbitPoints, playerItems, totalClicks, sessionEndsAt, boost } = playerData;

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setColumns(2);      // mobile et petits écrans
      else if (width < 1024) setColumns(3); // tablettes
      else setColumns(4);                   // desktop
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (sessionEndsAt === null || sessionEndsAt === undefined) return;
    if (sessionEndsAt === 0n || sessionEndsAt === 0) {
      setCooldownRemaining(0);
      return;
    }

    const cooldownEnd = Number(sessionEndsAt) + COOLDOWN_SECONDS;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(cooldownEnd - now, 0);
      setCooldownRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sessionEndsAt]);

  if (!playerData) return <div style={{ color: textColor }}>Loading player data...</div>;

  const baseCardStyle = {
    background: cardBg,
    padding: '12px',
    borderRadius: '10px',
    border: `1px solid ${borderColor}`,
    boxShadow,
    textAlign: 'center',
  };

  const labelStyle = {
    fontSize: '11px',
    marginBottom: '4px',
    opacity: 0.7,
  };

  const valueStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
  };

  return (
    <div style={{ color: textColor, padding: '12px' }}>
      <div
        style={{
          display: 'grid',
          gap: '12px',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        <div style={baseCardStyle}>
          <div style={labelStyle}>RabbitPoints</div>
          <div style={valueStyle}>{rabbitPoints}</div>
        </div>

        <div style={baseCardStyle}>
          <div style={labelStyle}>Total Clicks</div>
          <div style={valueStyle}>{totalClicks}</div>
        </div>

        <div style={baseCardStyle}>
          <div style={labelStyle}>Cooldown</div>
          <div style={valueStyle}>
            {cooldownRemaining > 0
              ? new Date(cooldownRemaining * 1000).toISOString().substr(11, 8)
              : 'Ready ✓'}
          </div>
        </div>

        <div style={baseCardStyle}>
          <div style={labelStyle}>Boost</div>
          <div style={valueStyle}>{boost}%</div>
        </div>
      </div>
    </div>
  );
}


export default function Game({ isTimeExpired, setIsTimeExpired, isGameStarted, setIsGameStarted, themeMode, refreshCounter, setRefreshCounter, playerData, embeddedWallet }) {
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [transactionHistory, setTransactionHistory] = useState([])
  const [isWritingContract, setIsWritingContract] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [preSignedPool, setPreSignedPool] = useState(null)
  const [signedTx, setSignedTx] = useState('')
  const [currentTransactionHash, setCurrentTransactionHash] = useState('')

  const clientRef = useRef(null)
  const extendingRef = useRef(false)

  const isNight = themeMode === 'dark';

  // Couleurs harmonisées avec Profile
  const textColor = isNight ? '#eee' : '#333'
  const cardBg = isNight ? '#222' : '#f3f3f3'
  const labelColor = isNight ? '#ccc' : '#333'
  const borderColor = isNight ? '#444' : '#ddd'
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'


  // Initialiser et stocker le client à chaque fois que embeddedWallet change
  // Réinitialiser les historiques de transactions, erreurs, results et créer les tx presigned
  useEffect(() => {
    const init = async () => {
      try {
        setResult('');
        setError('');
        setTransactionHistory([]);
        const client = await getWalletClient(); // Ajoute `await` si c'est une promesse
        clientRef.current = client;

        // On initialise le réseau avec les transactions pré-signées
        await initializeNetwork();
      } catch (err) {
        console.warn('walletClient uninitialized', err);
      }
    };

    init();
  }, [embeddedWallet]);


  // Contract interaction
  const handleStartGame = async () => {
    try {
      const walletClient = clientRef.current
      if (!walletClient || !embeddedWallet || !embeddedWallet.address) {
        setError('No embedded wallet or address')
        return
      }

      console.log(`Starting game on MegaETH Testnet...`)

      setError('')
      setIsWritingContract(true)

      const startTime = performance.now()

      // Get actual gas price from network and apply smart adjustments
      const { gasPrice, gasLimit } = await defineGasPrice(walletClient)

      const nonce = await walletClient.getTransactionCount({
        address: embeddedWallet?.address,
        state: 'pending'
      })

      const tx = await walletClient.signTransaction({
        account: embeddedWallet?.address,
        to: DIGIT_RABBITS_ADDRESS,
        data: start,
        nonce,
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: gasPrice / 10n, // 10% tip
        type: 'eip1559',
        gas: gasLimit,
      })

      const result = await walletClient.request({
        method: 'realtime_sendRawTransaction',
        params: [tx],
      })

      if (!result) {
        throw new Error('Failed to start game')
      }
      const endTime = performance.now()

      console.log(`Game started with hash: ${result}`)
      setIsGameStarted(true)

      const timeTaken = Math.round(endTime - startTime)

      setResult(`Hash: ${result}\nTime: ${timeTaken}ms`)
      setTransactionHistory(prev => [
        {
          network: 'MegaETH',
          hash: result.transactionHash || result || 'N/A',
          time: timeTaken
        },
        ...prev.slice(0, 9) // Keep only last 10
      ])
    } catch (error) {
      console.error('Contract write failed:', error)
      setError(error.message)
      setIsGameStarted(false)
    } finally {
      setIsWritingContract(false)
      setIsTimeExpired(false)
      setRefreshCounter(c => c + 1)
    }
  }

  const defineGasPrice = async (walletClient) => {
    try {
      const networkGasPrice = await walletClient.getGasPrice()
      return {
        gasPrice: networkGasPrice,
        gasLimit: 100000n // Default gas limit for simple transactions
      }
    } catch (error) {
      console.warn('⚠️ Failed to get gas price, using fallback:', error)
      // Fallback to very low prices for testnets
      return {
        gasPrice: 1000000000n, // 1 gwei
        gasLimit: 50000n // Lower limit for testnets
      }
    }
  }

  // Fixed execution with proper refill trigger
  const executeTransaction = async () => {
    if (!preSignedPool || preSignedPool.currentIndex >= preSignedPool.transactions.length) {
      setError('No pre-signed transactions available')
      return
    }

    // Générer un ID unique pour cette transaction
    const currentTxId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Initialiser les états
    setIsExecuting(true)
    setError('')
    setResult('')
    setShowSuccess(false)
    setSignedTx(currentTxId) // Utiliser l'ID généré au lieu de la transaction signée

    try {
      const walletClient = clientRef.current
      if (!walletClient) return null
      if (!embeddedWallet?.address) throw new Error('Wallet address missing')

      const signedTx = preSignedPool.transactions[preSignedPool.currentIndex]
      const startTime = performance.now()

      // Envoyer la transaction signée avec realtime_sendRawTransaction
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

      // Mettre à jour les résultats
      setResult(`Hash: ${result.transactionHash || result}\nTime: ${timeTaken}ms`)
      // Stocker le hash de transaction
      setCurrentTransactionHash(result.transactionHash || result)

      setTransactionHistory(prev => [
        {
          network: 'MegaETH',
          hash: result.transactionHash || result || 'N/A',
          time: timeTaken
        },
        ...prev.slice(0, 9),
      ])

      // Marquer comme succès
      setShowSuccess(true)
      setError('') // S'assurer qu'il n'y a pas d'erreur

    } catch (err) {
      console.error('❌ Error executing:', err)
      setError(err.message)
      setShowSuccess(false) // S'assurer que le succès est à false
    } finally {
      // Finir l'exécution
      setIsExecuting(false)
      setRefreshCounter(c => c + 1)

      // Nettoyer le txId après un délai pour permettre à la stack de se mettre à jour
      setTimeout(() => {
        setSignedTx('')
      }, 100)
    }
  }

  const clearHistory = () => {
    setTransactionHistory([])
  }

  const extendPool = async () => {
    if (extendingRef.current) return
    extendingRef.current = true

    try {
      const walletClient = clientRef.current
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
  }

  const initializeNetwork = async () => {

    setIsInitializing(true)
    setError('')
    setPreSignedPool(null)

    try {
      const walletClient = clientRef.current
      if (!walletClient) return null
      if (!embeddedWallet?.address) throw new Error('Wallet address missing')

      console.log(`🚀 Initializing MegaETH with pre-signed transactions...`)

      let nonce = await walletClient.getTransactionCount({
        address: embeddedWallet?.address,
      })
      nonce = nonce + 1; // On ajoute 1 car la 1ere transaction est pour le démarrage du jeu.

      // Get actual gas price from network and apply smart adjustments
      const { gasPrice, gasLimit } = await defineGasPrice(walletClient)

      // Pre-sign 15 transactions initially
      console.log(`Pre-signing 15 transactions...`)
      const signingPromises = Array.from({ length: 15 }, async (_, i) => {
        return await walletClient.signTransaction({
          account: embeddedWallet?.address,
          to: DIGIT_RABBITS_ADDRESS,
          data: play,
          nonce: nonce + i,
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: gasPrice / 10n, // 10% tip
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
      console.log(`Pre-signed 10 transactions for MegaETH`)
    } catch (err) {
      console.error('Error initializing network:', err)
      setError(`Failed to initialize MegaETH: ${err.message}`)
    } finally {
      setIsInitializing(false)
    }
  }

  const availableTransactions = preSignedPool ? preSignedPool.transactions.length - preSignedPool.currentIndex : 0

  return embeddedWallet ? (
    <Wrapper>
      <div className={`flex flex-col items-center text-center justify-start pt-28 p-4 sm:p-8 ${styles.bgBackground}`}>

        {/* Player Info */}
        <div className="mb-6">
          <PlayerData
            refreshCounter={refreshCounter}
            themeMode={themeMode}
            playerData={playerData}
            embeddedWallet={embeddedWallet}
          />
        </div>

        <div className="mb-6 relative w-full flex items-center justify-center">
          {/* 🐰 Le modèle interactif */}
          <div className="z-50 relative cursor-pointer">
            <RabbitModel
              isClicked={() => {
                if (isGameStarted && !isExecuting && !isInitializing && preSignedPool && availableTransactions > 0) {
                  executeTransaction();
                  setRefreshCounter(c => c + 1);
                }
              }}
              sound="hit"
            />
            <TransactionStack
              isExecuting={isExecuting}
              showSuccess={showSuccess}
              error={error}
              txId={signedTx}
              transactionHash={currentTransactionHash}
            />
          </div>
        </div>

        {/* Initialization Status */}
        {isInitializing ? (
          <div
            className="mb-6 p-4 rounded-lg flex items-center gap-3"
            style={{
              background: cardBg,
              border: `1px solid ${borderColor}`,
              boxShadow,
              color: textColor
            }}
          >
            <Loader2 className="animate-spin" size={20} />
            <span>Pre-signing transactions for MegaETH...</span>
          </div>
        ) : (
          <div className="mb-10">
            <button
              onClick={() => {
                handleStartGame();
                setRefreshCounter(c => c + 1);
              }}
              disabled={isExecuting || isGameStarted}
              className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed z-10"
              style={{
                background: cardBg,
                color: textColor,
                border: `2px solid ${borderColor}`,
                boxShadow
              }}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="animate-spin inline mr-2" size={20} />
                  Executing transaction...
                </>
              ) : (
                `Start Game`
              )}
            </button>
          </div>
        )}
      </div>


      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100/70 dark:bg-red-900/70 rounded-lg max-w-2xl text-left backdrop-blur-sm">
          <h4 className="text-red-700 dark:text-red-300 break-all">❌ Error :</h4>
          <p className="text-red-700 dark:text-red-300 break-all">{error}</p>
        </div>
      )}

      <TransactionHistoryTable
        transactionHistory={transactionHistory}
        clearHistory={clearHistory}
      />
    </Wrapper>
  ) : (
    <Wrapper>
      <div
        style={{
          background: cardBg,
          padding: '20px',
          borderRadius: '10px',
          border: `1px solid ${borderColor}`,
          boxShadow,
          textAlign: 'center',
          margin: '20px'
        }}
      >
        <p style={{ color: textColor, margin: 0 }}>Please connect your wallet</p>
      </div>
    </Wrapper>
  )
}