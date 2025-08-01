// src/app/test-megaeth/page.tsx
'use client'

import styles from './Game.module.css'
import { useState, useEffect, useRef } from 'react'
import { megaethTestnet } from 'viem/chains'
import { Loader2 } from 'lucide-react'
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, COOLDOWN_SECONDS } from '@/utils/constants'
import { XLogo } from '@/utils/constants'
import React from 'react'
import Wrapper from './Wrapper'
import RabbitImage from './RabbitImage'
import TransactionStack from './TransactionStack'
import { useTheme, useGame } from '@/context'
import { useWalletClient } from '../hooks/useWalletClient'
import * as Sentry from '@sentry/nextjs'
import WalletButton from './WalletButton'

function PlayerData({ refreshCounter, themeMode, seasonId, playerData, embeddedWallet }) {
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [columns, setColumns] = useState(2);

  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const borderColor = isNight ? '#444' : '#ddd';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';

  const { rabbitPoints, totalClicks, gameClicks, playerItems, sessionEndsAt, boost, streak } = playerData;

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
          <div style={labelStyle} className="text-base sm:text-sm md:text-xs">
            {cooldownRemaining > COOLDOWN_SECONDS ? 'Clicks' : 'Last Clicks'}
          </div>
          <div style={valueStyle} className="text-base sm:text-sm md:text-xs">{gameClicks}</div>
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

function TwitterShareButton({ score, gameClicks, themeMode, onClose }) {
  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const borderColor = isNight ? '#444' : '#ddd';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';
  const subTextColor = isNight ? 'text-zinc-400' : 'text-gray-600';

  const handleTwitterShare = () => {
    const tweetText = `Just realized ${gameClicks} transactions in 1 minute on the @digitrabbits website!\n\n1 click = 1 on-chain transaction on MegaETH testnet ⚡️\n\nThink you can beat me? Come play & climb the leaderboard! 🐰\n\nOnly at digitrabbits.com`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank', 'width=600,height=400');
    onClose();
  };

  const shareButtonStyle = {
    background: isNight
      ? 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)'
      : 'linear-gradient(135deg, #000000 0%, #333333 100%)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: isNight
      ? '0 2px 6px rgba(0, 0, 0, 0.5)'
      : '0 2px 6px rgba(0, 0, 0, 0.3)',
  };

  return (
    <button className={`mt-4 mb-4 ${styles.pulse}`}
      onClick={handleTwitterShare}
      style={shareButtonStyle}
      onMouseOver={(e) => {
        e.target.style.transform = 'translateY(-1px)';
        e.target.style.boxShadow = isNight
          ? '0 3px 8px rgba(0, 0, 0, 0.6)'
          : '0 3px 8px rgba(0, 0, 0, 0.4)';
      }}
      onMouseOut={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = isNight
          ? '0 2px 6px rgba(0, 0, 0, 0.5)'
          : '0 2px 6px rgba(0, 0, 0, 0.3)';
      }}
    >
      Share score on <XLogo size={16} />
    </button>
  );
}


export default function Game({ refreshCounter, setRefreshCounter, playerData, preSignedPool, isInitializing, error, initializePool, executeTransaction, getAvailableTransactions, isGameStarted, setIsGameStarted, onGameEnd }) {
  const [result, setResult] = useState('')
  const [errorStartGame, setErrorStartGame] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [isWritingContract, setIsWritingContract] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [signedTx, setSignedTx] = useState('')
  const [currentTransactionHash, setCurrentTransactionHash] = useState('')
  const { themeMode, show3DEffects, toggle3DEffects } = useTheme()
  const [timer, setTimer] = useState(60)
  const [showTwitterShare, setShowTwitterShare] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  // Design
  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333'
  const cardBg = isNight ? '#222' : '#f3f3f3'
  const borderColor = isNight ? '#444' : '#ddd'
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'

  const { embeddedWallet, isValidating, validationError } = useGame();
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
          setShowTwitterShare(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isGameStarted, setIsGameStarted])

  // Separate useEffect to handle the parent state update
  useEffect(() => {
    if (timer == 0) {
      onGameEnd?.();
    }
  }, [timer, onGameEnd]);

  // Mettre à jour le score final quand le jeu se termine
  useEffect(() => {
    if (showTwitterShare && playerData?.gameClicks !== undefined) {
      setFinalScore(playerData.gameClicks)
    }
  }, [showTwitterShare, playerData?.gameClicks, setFinalScore])

  // Démarrage du jeu
  const handleStartGame = async () => {
    try {
      // 1. Vérification du wallet
      if (!walletClient || !embeddedWallet || !embeddedWallet.address) {
        throw new Error('No wallet client set')
      }

      // 2. Vérification et initialisation du pool si nécessaire
      setIsWritingContract(true)
      setErrorStartGame('') // Reset les erreurs précédentes

      let currentPool = preSignedPool

      const hasValidePool = currentPool?.transactions?.length > 0 && getAvailableTransactions() > 0;

      // Si le pool n'est pas valide, l'initialiser
      if (!hasValidePool) {
        console.log("Initializing pool before starting game...")

        try {
          const pool = await initializePool();

          // Vérifier que l'initialisation a réussi
          const newAvailableCount = pool.transactions.length - pool.currentIndex

          if (newAvailableCount === 0) {
            throw new Error('Pool initialization completed but no transaction available. Please try again.')
          }

          console.log("Pool successfully initialized:", {
            availableCount: newAvailableCount,
            timestamp: new Date().toISOString()
          });
        } catch (poolError) {
          console.error('Pool initialization failed:', poolError)
          throw new Error('Failed to initialize transaction pool. Please try again.')
        }
      }

      console.log(`Starting game on MegaETH Testnet...`)

      // 4. Démarrer le jeu 
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

      Sentry.addBreadcrumb({
        category: 'game',
        message: 'Game started successfully',
        level: 'info',
        data: {
          transactionHash: result.transactionHash || result,
          walletAddress: embeddedWallet.address,
          availableTransactions: getAvailableTransactions(),
          poolStats: preSignedPool ? {
            totalTransactions: preSignedPool.transactions?.length || 0,
            currentIndex: preSignedPool.currentIndex || 0,
            baseNonce: preSignedPool.baseNonce || 0,
            hasTransactions: Array.isArray(preSignedPool.transactions),
            remainingTransactions: (preSignedPool.transactions?.length || 0) - (preSignedPool.currentIndex || 0)
          } : null,
          timestamp: new Date().toISOString()
        }
      });

      setIsGameStarted(true)
      setTimer(60)
      setResult(`Hash: ${result.transactionHash || result}`)

    } catch (err) {
      // Log l'erreur dans Sentry avec contexte
      Sentry.captureException(err, {
        tags: {
          action: 'start_game',
          component: 'Game'
        },
        extra: {
          walletAddress: embeddedWallet?.address,
          availableTransactions: getAvailableTransactions(),
          // Seulement les métriques utiles du pool
          poolStats: preSignedPool ? {
            totalTransactions: preSignedPool.transactions?.length || 0,
            currentIndex: preSignedPool.currentIndex || 0,
            baseNonce: preSignedPool.baseNonce || 0,
            hasTransactions: Array.isArray(preSignedPool.transactions)
          } : null
        }
      });
      console.error('Contract write failed:', err)
      if (err.shortMessage?.toLowerCase().includes("gas value exceeds maximum value")) {
        setErrorStartGame("Please fund your wallet your testnet tokens. Go to the Settings section, copy your wallet address and paste it into the faucet.");
      } else {
        setErrorStartGame(err.message || err.shortMessage || 'Unknown error occurred');
      }

      throw err
    } finally {
      setIsWritingContract(false)
      setRefreshCounter(c => c + 1)
    }
  }

  // Fonction simplifiée pour l'état du bouton
  const getButtonText = () => {
    if (isWritingContract) return "Starting...";
    if (isGameStarted) return "Game Started";
    return "Start Game";
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
      // Log dans Sentry
      Sentry.captureException(err, {
        tags: {
          action: 'execute_transaction',
          component: 'Game'
        },
        extra: {
          currentTxId,
          availableTransactions: getAvailableTransactions(),
          walletAddress: embeddedWallet?.address,
          // Seulement les métriques utiles du pool
          poolStats: preSignedPool ? {
            totalTransactions: preSignedPool.transactions?.length || 0,
            currentIndex: preSignedPool.currentIndex || 0,
            baseNonce: preSignedPool.baseNonce || 0,
            hasTransactions: Array.isArray(preSignedPool.transactions)
          } : null
        }
      });
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


  // Error and loading states
  if (isValidating) {
    return (
      <Wrapper>
        <div style={{
          background: cardBg,
          padding: '20px',
          borderRadius: '10px',
          border: `1px solid ${borderColor}`,
          boxShadow,
          textAlign: 'center',
          margin: '20px'
        }}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="break-all">
              Validating your wallet... Please wait.
            </p>
          </div>
        </div>
      </Wrapper>
    )
  }

  if (validationError) {
    return (
      <Wrapper>
        <div style={{
          background: cardBg,
          padding: '20px',
          borderRadius: '10px',
          border: `1px solid ${borderColor}`,
          boxShadow,
          textAlign: 'center',
          margin: '20px'
        }}>
          <div className="flex items-center justify-center gap-3 text-red-700">
            <p className="break-all">
              {validationError}
            </p>
          </div>
        </div>
      </Wrapper>
    )
  }

  if (!embeddedWallet) {
    return (
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
          <p style={{ color: textColor, margin: 0, marginBottom: '12px' }}>
            Please log in your <XLogo size={16} className={isNight ? 'text-white' : 'text-black'} /> account to enjoy the benefits of MegaETH in our game.
          </p>
          <WalletButton />
        </div>

      </Wrapper>
    )
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
          </div>
        </div>

        <TransactionStack
          isExecuting={isExecuting}
          showSuccess={showSuccess}
          error={error}
          txId={signedTx}
          transactionHash={currentTransactionHash}
        />

        {/* X Share Modal */}
        {showTwitterShare && (
          <TwitterShareButton
            score={finalScore}
            gameClicks={playerData?.gameClicks}
            themeMode={themeMode}
            onClose={() => setShowTwitterShare(false)}
          />
        )}

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
            <span>
              {isInitializing ? 'Loading...' : 'Validating...'}
            </span>
          </div>
        ) : (
          // Bouton Start Game simplifié
          <div className="mb-10">
            <button
              onClick={handleStartGame}
              disabled={isWritingContract || isGameStarted}
              className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed z-10"
              style={{
                background: cardBg,
                color: textColor,
                border: `2px solid ${borderColor}`,
                boxShadow
              }}
            >
              {getButtonText()}
            </button>

            {isWritingContract && (
              <div className="mt-2 text-sm opacity-70" style={{ color: textColor }}>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Preparing game...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {errorStartGame && (
          <div className="mb-6 p-4 bg-red-100/70 dark:bg-red-900/70 rounded-lg max-w-2xl text-left backdrop-blur-sm">
            <h4 className="text-red-700 dark:text-red-300 break-all">❌ Error :</h4>
            <p className="text-red-700 dark:text-red-300 break-all">{errorStartGame}</p>
          </div>
        )}

      </div>
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
        <WalletButton />
      </div>
    </Wrapper>
  )
}