// src/app/test-megaeth/page.tsx
'use client'

import styles from './Game.module.css'
import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { COOLDOWN_SECONDS } from '@/utils/constants.js'
import { XLogo } from '@/utils/constants.js'
import React from 'react'
import Wrapper from './Wrapper'
import RabbitImage from './RabbitImage'
import TransactionStack from './TransactionStack'
import { useTheme, useGame } from '@/context'
import { usePlayerData } from '../hooks/usePlayerData'

function PlayerData({ themeMode, playerData }) {
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

          <div
            style={{
              ...valueStyle,
              animation:
                cooldownRemaining > COOLDOWN_SECONDS &&
                  (cooldownRemaining - COOLDOWN_SECONDS) <= 10
                  ? 'pulse 1s infinite'
                  : 'none',
            }}
            className="text-base sm:text-sm md:text-xs"
          >
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

function TwitterShareButton({ score, totalClicksGame, themeMode, onClose }) {
  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const borderColor = isNight ? '#444' : '#ddd';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';
  const subTextColor = isNight ? 'text-zinc-400' : 'text-gray-600';

  const handleTwitterShare = () => {
    const tweetText = `🐰 Just scored ${score} RabbitPoints on @digitrabbits website! 🚀\n\nExperience lightning-fast blockchain gaming with MegaETH's incredible speed! ⚡\n\nWen 1M total clicks?\n\nWe just reached ${totalClicksGame} out of 1M!\n#MegaETH #DigitRabbits`;
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

export default function Game({ refreshCounter, setRefreshCounter }) {
  // ✅ TOUS LES HOOKS EN PREMIER - ORDRE FIXE
  const { themeMode, show3DEffects, toggle3DEffects } = useTheme()
  const gameState = useGame()

  // ✅ usePlayerData appelé de manière inconditionnelle
  const { playerData } = usePlayerData(
    gameState?.embeddedWallet || null,
    refreshCounter
  )

  // Destructuration des états depuis useGame
  const {
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

    // Fonctions
    startGame,
    executeTransaction,
    getAvailableTransactions,
    closeTwitterShare,
    updateFinalScore,

    // Embedded Wallet
    embeddedWallet,
    isValidating,
    validationError,
  } = gameState || {}
  const effectRan = useRef(false)

  // ✅ useEffect après tous les autres hooks
  // Gestion de l'effet 3D - s'exécute uniquement au montage
  useEffect(() => {
    if (!gameState || effectRan.current) return; // Éviter les effets si pas de gameState

    // Capture des valeurs au moment du montage
    const currentShow3DEffects = show3DEffects;
    const currentToggle3DEffects = toggle3DEffects;

    // Récupère l'état global enregistré dans sessionStorage (true, false ou null)
    const previouslyManuallyDisabled = sessionStorage.getItem('show3DEffects') === 'true'

    // Si l'utilisateur n'a jamais désactivé manuellement, on laisse l'effet actif
    if (!previouslyManuallyDisabled && currentShow3DEffects) {
      // On le désactive temporairement et on mémorise qu'on doit le restaurer
      currentToggle3DEffects()
      sessionStorage.setItem('3d_temp_disabled', 'true')
    }

    return () => {
      // Si l'effet a été désactivé temporairement, on le réactive au démontage
      const wasTempDisabled = sessionStorage.getItem('3d_temp_disabled') === 'true'
      if (wasTempDisabled) {
        currentToggle3DEffects()
        sessionStorage.removeItem('3d_temp_disabled')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState])

  // Mettre à jour le score final quand le jeu se termine
  useEffect(() => {
    if (showTwitterShare && playerData?.gameClicks !== undefined) {
      updateFinalScore(playerData.gameClicks)
    }
  }, [showTwitterShare, playerData?.gameClicks, updateFinalScore])

  // ✅ VARIABLES DÉRIVÉES ET CONSTANTES
  const isNight = themeMode === 'dark'
  const textColor = isNight ? '#eee' : '#333'
  const cardBg = isNight ? '#222' : '#f3f3f3'
  const borderColor = isNight ? '#444' : '#ddd'
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'

  // ✅ FONCTIONS D'ÉVÉNEMENTS
  // Démarrage du jeu
  const handleStartGame = async () => {
    try {
      if (!startGame) {
        throw new Error('Game functions not available')
      }

      await startGame()
      setRefreshCounter(c => c + 1)
    } catch (err) {
      console.error('Failed to start game:', err)
    }
  }

  // Exécution d'une transaction de jeu
  const handleExecuteTransaction = async () => {
    if (!executeTransaction || !preSignedPool || !getAvailableTransactions || getAvailableTransactions() === 0) {
      return
    }

    try {
      await executeTransaction()
      setRefreshCounter(c => c + 1)
    } catch (err) {
      console.error('Failed to execute transaction:', err)
    }
  }

  // ✅ RENDU CONDITIONNEL APRÈS TOUS LES HOOKS
  // Si le hook useGame n'est pas disponible (pas de wallet), on affiche un message
  if (!gameState) {
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
          <p style={{ color: textColor, margin: 0 }}>
            Please log in your <XLogo size={16} className={isNight ? 'text-white' : 'text-black'} /> account to enjoy the benefits of MegaETH in our game.
          </p>
        </div>
      </Wrapper>
    )
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
          <p style={{ color: textColor, margin: 0 }}>
            Please log in your <XLogo size={16} className={isNight ? 'text-white' : 'text-black'} /> account to enjoy the benefits of MegaETH in our game.
          </p>
        </div>
      </Wrapper>
    )
  }

  // ✅ RENDU PRINCIPAL
  return (
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
                if (/*isGameStarted && */!isExecuting && !isInitializing && preSignedPool && getAvailableTransactions && getAvailableTransactions() > 0) {
                  handleExecuteTransaction()
                }
              }}
            />
            <TransactionStack
              isExecuting={isExecuting}
              showSuccess={showSuccess}
              error={error}
              transactionHash={currentTransactionHash}
              gameState={gameState}
            />
          </div>
        </div>

        {/* X Share Modal */}
        {showTwitterShare && (
          <TwitterShareButton
            score={finalScore}
            totalClicksGame={playerData?.totalClicksGame}
            themeMode={themeMode}
            onClose={closeTwitterShare}
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
            <span>Loading...</span>
          </div>
        ) : (
          <div className="mb-10">
            <button
              onClick={handleStartGame}
              disabled={isExecuting || isGameStarted || isWritingContract}
              className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed z-10"
              style={{
                background: cardBg,
                color: textColor,
                border: `2px solid ${borderColor}`,
                boxShadow
              }}
            >
              {isWritingContract ? 'Starting Game...' : isGameStarted ? 'Game in Progress...' : 'Start Game'}
            </button>
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
  )
}