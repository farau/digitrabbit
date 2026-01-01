// src/app/components/Game.js
'use client'

import styles from './Game.module.css'
import { useState, useEffect, useRef } from 'react'
import { megaethTestnet } from 'viem/chains'
import { Loader2 } from 'lucide-react'
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, COOLDOWN_SECONDS, customMegaethTestnet } from '@/utils/constants'
import { XLogo } from '@/utils/constants'
import React from 'react'
import Wrapper from './Wrapper'
import RabbitImage from './RabbitImage'
import Image from 'next/image'
import TransactionStack from './TransactionStack'
import BlockchainHealthIndicator from './BlockchainHealthIndicator'
import { useTheme, useGame } from '@/context'
import { useWalletClient } from '../hooks/useWalletClient'
import { useBlockchainHealth } from '../hooks/useBlockchainHealth'
import * as Sentry from '@sentry/nextjs'
import WalletButton from './WalletButton'

function PlayerData({ themeMode, seasonId, playerData, embeddedWallet }) {
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
      else if (width < 1024) setColumns(3);
      else setColumns(3);
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

        <div style={{
          ...baseCardStyle,
          gridColumn: columns === 2 ? 'span 2' : 'auto',
          ...(columns === 2 && {
            maxWidth: '50%',
            marginLeft: 'auto',
            marginRight: 'auto'
          })
        }}>
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


export default function Game({ playerData, preSignedPool, isInitializing, error, initializePool, executeTransaction, getAvailableTransactions, isGameStarted, setIsGameStarted, onGameEnd }) {
  const [result, setResult] = useState('')
  const [errorStartGame, setErrorStartGame] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [isWritingContract, setIsWritingContract] = useState(false)
  const [isRelaunchingPool, setIsRelaunchingPool] = useState(false)
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false)
  const [signedTx, setSignedTx] = useState('')
  const [currentTransactionHash, setCurrentTransactionHash] = useState('')
  const { themeMode, show3DEffects, toggle3DEffects } = useTheme()
  const [timer, setTimer] = useState(60)
  const [showTwitterShare, setShowTwitterShare] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isCheckingPause, setIsCheckingPause] = useState(true)

  // Hook pour la vérification de la blockchain
  const {
    healthStatus,
    isCheckingHealth,
    healthError,
    checkBlockchainHealth,
    getStatusInfo,
    canPlay
  } = useBlockchainHealth();

  // Design
  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333'
  const cardBg = isNight ? '#222' : '#f3f3f3'
  const borderColor = isNight ? '#444' : '#ddd'
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'

  const { embeddedWallet, isValidating, validationError } = useGame();
  const { walletClient } = useWalletClient(embeddedWallet)

  // Vérifier l'état paused du contrat et la saison
  useEffect(() => {
    const checkPausedState = async () => {
      if (!walletClient) {
        setIsCheckingPause(false)
        return
      }

      try {
        setIsCheckingPause(true)
        const paused = await walletClient.readContract({
          address: DIGIT_RABBITS_ADDRESS,
          abi: DIGIT_RABBITS_ABI,
          functionName: 'isPaused',
        })
        setIsPaused(paused)
      } catch (err) {
        console.error('Error checking paused state:', err)
        Sentry.captureException(err, {
          tags: {
            action: 'check_paused_state',
            component: 'Game'
          }
        })
      } finally {
        setIsCheckingPause(false)
      }
    }

    checkPausedState()

  }, [walletClient])


  // Gestion de l'effet 3D
  useEffect(() => {
    const previouslyManuallyDisabled = sessionStorage.getItem('show3DEffects') === 'true';

    if (!previouslyManuallyDisabled && show3DEffects) {
      toggle3DEffects();
      sessionStorage.setItem('3d_temp_disabled', 'true');
    }

    return () => {
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

  // Démarrage du jeu avec vérification de la blockchain
  const handleStartGame = async () => {
    try {

      // 0. Vérification de l'état de la blockchain avant de commencer
      if (!canPlay) {
        if (healthStatus?.status === 'down') {
          setErrorStartGame('Blockchain is currently down. Please try again later.');
        } else if (healthStatus?.status === 'degraded') {
          setErrorStartGame('Blockchain performance is degraded. Game may not work optimally.');
        }
      }

      // 1. Vérification du wallet
      if (!walletClient || !embeddedWallet || !embeddedWallet.address) {
        throw new Error('No wallet client set');
      }

      // 2. Vérification et initialisation du pool si nécessaire
      setIsWritingContract(true);
      setErrorStartGame('');

      let currentPool = preSignedPool;
      const hasValidePool = currentPool?.transactions?.length > 0 && getAvailableTransactions() > 0;

      if (!hasValidePool) {
        console.log("Initializing pool before starting game...");
        try {
          const pool = await initializePool(false);
          const newAvailableCount = pool.transactions.length - pool.currentIndex;
          if (newAvailableCount === 0) {
            throw new Error('Pool initialization completed but no transaction available. Please try again.');
          }
          console.log("Pool successfully initialized:", {
            availableCount: newAvailableCount,
            timestamp: new Date().toISOString()
          });
        } catch (poolError) {
          console.error('Pool initialization failed:', poolError);
          throw new Error('Failed to initialize transaction pool. Please try again.');
        }
      }

      console.log(`Starting game on MegaETH Testnet...`);


      // 5. Démarrer le jeu (envoi réel)
      const txHash = await walletClient.writeContract({
        account: embeddedWallet.address,
        address: DIGIT_RABBITS_ADDRESS,
        abi: DIGIT_RABBITS_ABI,
        functionName: 'startGame',
        args: [],
        chain: customMegaethTestnet,
        gas: 30000000n
      });

      if (!txHash) {
        throw new Error('Failed to start game');
      }

      // 6. Attendre le minage et vérifier le statut
      const receipt = await walletClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status === 'reverted') {
        const tx = await walletClient.getTransaction({ hash: txHash });
        console.log({ tx })
        try {
          await walletClient.call({ to: tx.to, data: tx.input, from: tx.from, gas: tx.gasPrice });
        } catch (error) {
          const revertReason = error.details || error.message || 'Transaction reverted';
          throw new Error(`Transaction reverted: ${revertReason}`);
        }
      }


      console.log(`Game started with hash: ${txHash}`);

      Sentry.addBreadcrumb({
        category: 'game',
        message: 'Game started successfully',
        level: 'info',
        data: {
          transactionHash: txHash,
          walletAddress: embeddedWallet.address,
          gasUsed: receipt.gasUsed?.toString(),
          availableTransactions: getAvailableTransactions(),
          blockchainHealth: healthStatus?.status,
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

      setIsGameStarted(true);
      setTimer(60);
      setResult(`Hash: ${txHash}`);

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
          blockchainHealth: healthStatus?.status,
          poolStats: preSignedPool ? {
            totalTransactions: preSignedPool.transactions?.length || 0,
            currentIndex: preSignedPool.currentIndex || 0,
            baseNonce: preSignedPool.baseNonce || 0,
            hasTransactions: Array.isArray(preSignedPool.transactions)
          } : null
        }
      });
      console.error('Contract write failed:', err);
      if (
        err.shortMessage?.toLowerCase().includes("maximum limit") ||
        err.shortMessage?.toLowerCase().includes("exceeds the balance of the account")
      ) {
        setErrorStartGame("Please fund your wallet with testnet tokens. Go to the Settings section, copy your wallet address and paste it into the faucet.");
      } else if (err.shortMessage?.toLowerCase().includes("not finished")) {
        setErrorStartGame("Cooldown not finished yet. Please try again later.");
      } else {
        setErrorStartGame(err.message || err.shortMessage || 'Unknown error occurred');
      }
      throw err;
    } finally {
      setIsWritingContract(false);
    }
  };


  // Relancer la pool en cas de problème 
  const handleRelaunchPool = async () => {
    try {
      if (!walletClient || !embeddedWallet || !embeddedWallet.address) {
        throw new Error('No wallet client set')
      }

      setIsRelaunchingPool(true)
      setIsButtonDisabled(true)
      console.log("Initializing a new pool...")

      try {
        const pool = await initializePool(true);
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

    } catch (err) {
      Sentry.captureException(err, {
        tags: {
          action: 'relaunch_pool',
          component: 'Game'
        },
        extra: {
          walletAddress: embeddedWallet?.address,
          availableTransactions: getAvailableTransactions(),
          blockchainHealth: healthStatus?.status,
          poolStats: preSignedPool ? {
            totalTransactions: preSignedPool.transactions?.length || 0,
            currentIndex: preSignedPool.currentIndex || 0,
            baseNonce: preSignedPool.baseNonce || 0,
            hasTransactions: Array.isArray(preSignedPool.transactions)
          } : null
        }
      });
      console.error('Relaunch pool failed:', err)
      throw err
    } finally {
      setTimeout(() => {
        setIsRelaunchingPool(false)
      }, 1000)

      setTimeout(() => {
        setIsButtonDisabled(false)
      }, 10000)
    }
  }

  // Fonction pour rafraîchir l'état de la blockchain
  const handleRefreshBlockchainHealth = () => {
    checkBlockchainHealth(true); // Force refresh
  }

  // Fonction simplifiée pour l'état du bouton
  const getButtonText = () => {
    if (isWritingContract) return "Starting...";
    else if (isRelaunchingPool && isGameStarted) return "Relaunching...";
    else if (isButtonDisabled && isGameStarted) return "Synchronized ✓";
    else if (isGameStarted) return "Stuck? 🥕";
    return "Start Game";
  }

  // Vérifier si le bouton de démarrage doit être désactivé
  const isStartGameDisabled = () => {
    return (
      isWritingContract ||
      isButtonDisabled
    );
  }

  // Exécution d'une transaction de jeu
  const handleExecuteTransaction = async () => {
    if (!preSignedPool || getAvailableTransactions() === 0) {
      return
    }

    // Vérifier l'état de la blockchain avant d'exécuter
    if (healthStatus?.status === 'down') {
      console.warn('Blockchain is down, skipping transaction execution');
      return;
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
        setShowSuccess(!!txResult.hash)
      }
    } catch (err) {
      Sentry.captureException(err, {
        tags: {
          action: 'execute_transaction',
          component: 'Game'
        },
        extra: {
          currentTxId,
          availableTransactions: getAvailableTransactions(),
          walletAddress: embeddedWallet?.address,
          blockchainHealth: healthStatus?.status,
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

  // Afficher l'état de pause du contrat
  if (isPaused) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center justify-center p-8 min-h-[60vh]">
          <div
            style={{
              background: cardBg,
              padding: '20px',
              borderRadius: '16px',
              border: `2px solid ${borderColor}`,
              boxShadow,
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            <Image
              src="/img/season-ended-rabbit.webp"
              alt="Maintenance"
              width={500}
              height={500}
              className="mx-auto object-contain mb-4"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextElementSibling.style.display = 'block'
              }}
            />

            <h2
              style={{
                color: textColor,
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '16px'
              }}
            >
              Season is paused for maintenance
            </h2>

            <p style={{ color: textColor, opacity: 0.8, marginBottom: '24px' }}>
              Let us take a short break to hop into some improvements! We appreciate your patience and can’t wait to welcome you back to the game soon.
            </p>

            <button
              className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
              style={{
                background: cardBg,
                color: textColor,
                border: `2px solid ${borderColor}`,
                boxShadow
              }}
            >
              But you can continue to click here for fun because you are a rabbit degen.
            </button>
          </div>
        </div>
      </Wrapper>
    )
  }

  return embeddedWallet ? (
    <Wrapper>
      <div className={`flex flex-col items-center text-center justify-start pt-10 p-4 sm:p-8 ${styles.bgBackground}`}>
        {/* Player Info */}
        <div className="mb-6">
          <PlayerData
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
                if (isGameStarted && !isExecuting && !isInitializing && preSignedPool && getAvailableTransactions() > 0 && canPlay) {
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

        {/* Blockchain Warning */}
        {healthStatus && !canPlay && (
          <div
            className="mb-6 p-4 rounded-lg flex items-center gap-3"
            style={{
              background: isNight ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${isNight ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              boxShadow,
              color: isNight ? '#ef4444' : '#dc2626'
            }}
          >
            <span>⚠️</span>
            <span className="text-sm">
              {healthStatus.status === 'down'
                ? 'RPC/connectivity issue. Game may be unavailable.'
                : 'Blockchain performance is degraded. Game may not work optimally.'
              }
            </span>
          </div>
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
          // Bouton Start Game
          <div className="mb-10">
            <button
              onClick={!isGameStarted ? handleStartGame : handleRelaunchPool}
              disabled={isStartGameDisabled()}
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

            {isRelaunchingPool && (
              <div className="mt-2 text-sm opacity-70" style={{ color: textColor }}>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Syncing with blockchain state...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {errorStartGame && (
          <div className="mb-6 p-4 bg-red-100/70 dark:bg-red-900/70 rounded-lg max-w-2xl text-left backdrop-blur-sm">
            <h4 className="text-red-700 dark:text-red-300 break-all">❌ Error :</h4>
            <p className="text-red-700 dark:text-red-300 break-all whitespace-pre-line">{errorStartGame}</p>
          </div>
        )}
      </div>
      {/* Blockchain Health Status */}
      <div className="w-full flex justify-center">
        <div className="w-fit max-w-md">
          <BlockchainHealthIndicator
            healthStatus={healthStatus}
            isCheckingHealth={isCheckingHealth}
            onRefresh={handleRefreshBlockchainHealth}
            getStatusInfo={getStatusInfo}
          />
        </div>
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