// src/app/test-megaeth/page.tsx
'use client'

import styles from './Game.module.css'
import { useState, useEffect, useRef } from 'react'
import { megaethTestnet } from 'viem/chains'
import { Loader2 } from 'lucide-react'
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, COOLDOWN_SECONDS } from '@/constants'
import { XLogo } from '@/constants'
import React from 'react'
import Wrapper from './Wrapper'
import RabbitImage from './RabbitImage'
import TransactionStack from './TransactionStack'
import { useTheme } from '@/context'
import { useWalletClient } from '../hooks/useWalletClient'

function PlayerData({ refreshCounter, themeMode, seasonId, playerData, embeddedWallet }) {
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [columns, setColumns] = useState(2);

  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const borderColor = isNight ? '#444' : '#ddd';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';

  const { rabbitPoints, totalClicks, sessionEndsAt, boost } = playerData;

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setColumns(2);
      else if (width < 1024) setColumns(4);
      else setColumns(4);
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
    marginBottom: '4px',
    opacity: 0.7,
    color: textColor,
  };

  const valueStyle = {
    fontWeight: 'bold',
    color: textColor,
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
          <div style={labelStyle} className="text-base sm:text-sm md:text-xs">RabbitPoints</div>
          <div style={valueStyle} className="text-base sm:text-sm md:text-xs">{rabbitPoints}</div>
        </div>

        <div style={baseCardStyle}>
          <div style={labelStyle} className="text-base sm:text-sm md:text-xs">Clicks</div>
          <div style={valueStyle} className="text-base sm:text-sm md:text-xs">{totalClicks - totalClicks}</div>
        </div>

        <div style={baseCardStyle}>
          <div style={labelStyle} className="text-base sm:text-sm md:text-xs">
            {cooldownRemaining > COOLDOWN_SECONDS ? 'Time remaining' : 'Cooldown'}
          </div>
          <div style={valueStyle} className="text-base sm:text-sm md:text-xs">
            {cooldownRemaining > COOLDOWN_SECONDS
              ? new Date((cooldownRemaining - COOLDOWN_SECONDS) * 1000)
                .toISOString()
                .substr(11, 8)
              : cooldownRemaining > 0
                ? new Date(cooldownRemaining * 1000).toISOString().substr(11, 8)
                : 'Ready ✓'}
          </div>
        </div>

        <div style={baseCardStyle}>
          <div style={labelStyle} className="text-base sm:text-sm md:text-xs">Boost</div>
          <div style={valueStyle} className="text-base sm:text-sm md:text-xs">{boost}%</div>
        </div>
      </div>
    </div>
  );
}

export default function Game({ refreshCounter, setRefreshCounter, playerData, embeddedWallet, preSignedPool, isInitializing, error, initializePool, executeTransaction, getAvailableTransactions, isGameStarted, setIsGameStarted, onGameEnd }) {
  const [result, setResult] = useState('')
  const [errorStartGame, setErrorStartGame] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [isWritingContract, setIsWritingContract] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [signedTx, setSignedTx] = useState('')
  const [currentTransactionHash, setCurrentTransactionHash] = useState('')
  const { themeMode, show3DEffects, toggle3DEffects } = useTheme()
  const [timer, setTimer] = useState(60)

  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333'
  const cardBg = isNight ? '#222' : '#f3f3f3'
  const borderColor = isNight ? '#444' : '#ddd'
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'

  const { walletClient } = useWalletClient(embeddedWallet)

  // Gestion de l'effet 3D
  useEffect(() => {
    // Récupère l'état global enregistré dans sessionStorage (true, false ou null)
    const previouslyManuallyDisabled = sessionStorage.getItem('show3DEffects') === 'true';

    // Si l'utilisateur n'a jamais désactivé manuellement, on laisse l'effet actif
    if (!previouslyManuallyDisabled && show3DEffects) {
      // On le désactive temporairement et on mémorise qu'on doit le restaurer
      toggle3DEffects();
      sessionStorage.setItem('3d_temp_disabled', 'true');
    }

    return () => {
      // Si l'effet a été désactivé temporairement, on le réactive au démontage
      const wasTempDisabled = sessionStorage.getItem('3d_temp_disabled') === 'true';
      if (wasTempDisabled) {
        toggle3DEffects();
        sessionStorage.removeItem('3d_temp_disabled');
      }
    };
  }, []);

  // Timer durée jeu
  useEffect(() => {
    if (!isGameStarted) return

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onGameEnd?.()  // 👈 Utilise le callback proprement
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isGameStarted])

  // Démarrage du jeu
  const handleStartGame = async () => {
    try {
      if (!walletClient || !embeddedWallet || !embeddedWallet.address) {
        throw new Error('No wallet client set')
      }

      console.log(`Starting game on MegaETH Testnet...`)

      setIsWritingContract(true)

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
      setTimer(60)
      setResult(`Hash: ${result.transactionHash || result}`)

    } catch (err) {
      console.error('Contract write failed:', err)
      setErrorStartGame(err.shortMessage)
      throw err
    } finally {
      setIsWritingContract(false)
      setRefreshCounter(c => c + 1)
    }
  }

  // Exécution d'une transaction de jeu
  const handleExecuteTransaction = async () => {
    if (!preSignedPool || getAvailableTransactions() === 0) {
      return
    }

    const currentTxId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    setIsExecuting(true)
    setResult('')
    setShowSuccess(false)
    setSignedTx(currentTxId)

    try {
      const txResult = await executeTransaction()

      if (txResult) {
        setResult(`Hash: ${txResult.hash}\nTime: ${txResult.timeTaken}ms`)
        setCurrentTransactionHash(txResult.hash)
        setShowSuccess(true)
      }
    } catch (err) {
      console.error('❌ Error executing transaction:', err)
      setShowSuccess(false)
    } finally {
      setIsExecuting(false)
      setRefreshCounter(c => c + 1)

      setTimeout(() => {
        setSignedTx('')
      }, 100)
    }
  }

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
            <RabbitImage
              isClicked={() => {
                if (isGameStarted && !isExecuting && !isInitializing && preSignedPool && getAvailableTransactions() > 0) {
                  handleExecuteTransaction();
                }
              }}
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
            <span>Loading...</span>
          </div>
        ) : (
          <div className="mb-10">
            <button
              onClick={handleStartGame}
              disabled={isExecuting || isGameStarted}
              className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed z-10"
              style={{
                background: cardBg,
                color: textColor,
                border: `2px solid ${borderColor}`,
                boxShadow
              }}
            >
              Start Game
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorStartGame && (
        <div className="mb-6 p-4 bg-red-100/70 dark:bg-red-900/70 rounded-lg max-w-2xl text-left backdrop-blur-sm">
          <h4 className="text-red-700 dark:text-red-300 break-all">❌ Error :</h4>
          <p className="text-red-700 dark:text-red-300 break-all">{errorStartGame}</p>
        </div>
      )}

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
        <p style={{ color: textColor, margin: 0 }}>
          Please log in your <XLogo size={16} className={isNight ? 'text-white' : 'text-black'} /> account to enjoy the benefits of MegaETH in our game.
        </p>
      </div>
    </Wrapper>
  )
}