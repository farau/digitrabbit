"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import styles from "./MainPage.module.css";
import Icon, { FloatingHeadModel } from "./Icon";
import Footer from "./Footer";
import MemeGallery from "./MemeGallery";
import Profile from "./Profile";
import Settings from "./Settings";
import { useWindowSize } from "../hooks/useWindowSize"; // Assurez-vous d'importer le bon hook
import Leaderboard from "./Leaderboard";
import About from "./About";
import { useTheme, useGame } from "@/context";
import DraggableWindow from "./DraggableWindow";
import Game from "./Game";
import Chill from "./Chill";
import RabbitChat from '@/app/components/RabbitChat'
import Assets from "./Assets";
import FAQ from "./FAQ";
import Roadmap from "./Roadmap";
import MobileBackground from "./MobileBackground";
import Quests from "./Quests";
import Linktree from "./Linktree";
import { useChatMessages } from "../hooks/useChatMessages";
import { useMainPageOnboarding } from "../hooks/useMainPageOnboarding";
import { useQuestsStatus } from "../hooks/useQuestsStatus";

import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, DIGIT_RABBITS_CHAT_ADDRESS, DIGIT_RABBITS_CHAT_ABI, publicClient, NUM_SLOTS, COOLDOWN_SECONDS } from '@/utils/chainConfig'
import { usePreSignedPool } from "../hooks/usePreSignedPool";

// Dynamic import pour le BackgroundEffect
import dynamic from 'next/dynamic';
import { userData } from "three/src/nodes/accessors/UserDataNode";
import { Canvas } from "@react-three/fiber";

export default function MainPage() {
  const QUEST_REFRESH_INTERVAL_MS = 120000
  const PLAYER_MIN_FETCH_INTERVAL_MS = 5000

  const [visibleApps, setVisibleApps] = useState([]);
  const [minimizedApps, setMinimizedApps] = useState([]);
  const [appZIndices, setAppZIndices] = useState({});

  const [sound, setSound] = useState("crying");
  const [volume, setVolume] = useState(0.5);

  const [volumePlayer, setVolumePlayer] = useState(0.2); // Volume musique principale

  const { themeMode, toggleTheme, show3DEffects, toggle3DEffects, setShow3DEffects } = useTheme();
  const { width, isMobile } = useWindowSize();
  // Setters pour memes
  const [selectedMemeIndex, setSelectedMemeIndex] = useState(null);
  const [memeList, setMemeList] = useState([]);

  // Setters pour assets
  const [selectedAssetsIndex, setSelectedAssetsIndex] = useState(null);
  const [assetsList, setAssetsList] = useState([]);

  // Refresher compteur pour réactualiser les valeurs du player
  //const [refreshCounter, setRefreshCounter] = useState(0)
  const [seasonId, setSeasonId] = useState(null)

  const [playerData, setPlayerData] = useState({
    rabbitPoints: 0,
    totalClicks: 0,
    gameClicks: 0,
    playerItems: Array(NUM_SLOTS).fill(0),
    sessionEndsAt: null,
    boost: 0,
    streak: 0,
    hasClaimedPoints: false,
    maxClicks: 0,
    totalClicksGame: 0,
    gamePlayed: 0,
    // Chat stats
    dailyMessages: 0,
    weeklyMessages: 0,
    totalMessages: 0,

  })

  // On récupère l'embedded wallet ici puis on propage ensuite
  const { embeddedWallet, validationError, isValidating } = useGame()

  // Setter game
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [chatNotifications, setChatNotifications] = useState({
    unreadNewMessages: 0,
    totalLoadedMessages: 0,
    lastMessageAt: 0
  })
  const [hasLoadedPlayerData, setHasLoadedPlayerData] = useState(false)
  const [notificationNow, setNotificationNow] = useState(Date.now())
  const [gameCooldownSeconds, setGameCooldownSeconds] = useState(COOLDOWN_SECONDS)
  const previousMessagesLengthRef = useRef(0)
  const playerFetchStateRef = useRef({ inFlight: false, lastAt: 0, pendingForce: false })

  // Utilisation du hook usePreSignedPool
  const {
    preSignedPool,
    isInitializing,
    error,
    initializePool,
    executeTransaction,
    incrementIndex,
    getAvailableTransactions,
    resetPool
  } = usePreSignedPool({ embeddedWallet })

  // ✅ Hook WebSocket
  const { messages, isConnected, isSyncing, resync, registerCallbacks } = useChatMessages()
  const hasNoPoints = Number(playerData?.rabbitPoints || 0) <= 0
  const isAppInteractionLocked = Boolean(embeddedWallet?.address) && !hasLoadedPlayerData
  const questIds = useMemo(() => ['daily_messages', 'daily_streak', 'daily_hold', 'weekly_messages', 'weekly_games'], [])
  const {
    claimStatus: allQuestClaimStatus,
    cooldowns: allQuestCooldowns,
    isLoading: isQuestStatusLoading,
    error: questStatusError,
    refetch: refetchQuestStatus,
    holdings: questHoldings
  } = useQuestsStatus(hasLoadedPlayerData ? embeddedWallet?.address : null, questIds, 'all')

  const questNotifications = useMemo(() => {
    if (!embeddedWallet?.address) {
      return {
        readyCount: 0,
        nextReadyIn: null,
        isLoading: true,
        error: null
      }
    }

    if (!hasLoadedPlayerData) {
      return {
        readyCount: 0,
        nextReadyIn: null,
        isLoading: true,
        error: null
      }
    }

    const streak = Number(playerData?.streak || 0)
    const dailyMessages = Number(playerData?.dailyMessages || 0)
    const weeklyMessagesTotal = Array.isArray(playerData?.weeklyMessages)
      ? playerData.weeklyMessages.reduce((sum, value) => sum + Number(value || 0), 0)
      : Number(playerData?.weeklyMessages || 0)
    const weeklyGames = Number(playerData?.gamePlayed || 0)
    const holdings = Number(questHoldings || 0)

    const targets = {
      daily_messages: Math.max(10 + Math.max(streak - 1, 0) * 2, 10),
      daily_streak: 1,
      daily_hold: Math.max(streak, 1),
      weekly_messages: 1000,
      weekly_games: 14,
    }

    const progress = {
      daily_messages: dailyMessages,
      daily_streak: streak >= 1 ? 1 : 0,
      daily_hold: holdings,
      weekly_messages: weeklyMessagesTotal,
      weekly_games: weeklyGames,
    }

    let readyCount = 0
    let nextReadyIn = null

    for (const questId of questIds) {
      const isClaimed = allQuestClaimStatus?.[questId] === true
      const cooldown = Number(allQuestCooldowns?.[questId] || 0)
      const isCompleted = Number(progress?.[questId] || 0) >= Number(targets?.[questId] || 0)

      if (!isClaimed && isCompleted && cooldown <= 0) {
        readyCount += 1
      } else if (!isClaimed && isCompleted && cooldown > 0) {
        nextReadyIn = nextReadyIn === null ? cooldown : Math.min(nextReadyIn, cooldown)
      }
    }

    return {
      readyCount,
      nextReadyIn,
      isLoading: isQuestStatusLoading,
      error: questStatusError || null
    }
  }, [
    embeddedWallet?.address,
    hasLoadedPlayerData,
    playerData?.streak,
    playerData?.dailyMessages,
    playerData?.weeklyMessages,
    playerData?.gamePlayed,
    questHoldings,
    questIds,
    allQuestClaimStatus,
    allQuestCooldowns,
    isQuestStatusLoading,
    questStatusError
  ])

  const formatDuration = useCallback((seconds) => {
    const total = Math.max(0, Number(seconds) || 0)
    const hrs = Math.floor(total / 3600)
    const mins = Math.floor((total % 3600) / 60)
    const secs = total % 60
    return [hrs, mins, secs].map((value) => String(value).padStart(2, '0')).join(':')
  }, [])

  const getGameStartCooldownRemaining = useCallback(() => {
    const sessionEndsAt = Number(playerData?.sessionEndsAt || 0)
    if (!sessionEndsAt) return 0

    const now = Math.floor(notificationNow / 1000)
    const cooldownEnd = sessionEndsAt + Number(gameCooldownSeconds || COOLDOWN_SECONDS || 0)
    return Math.max(cooldownEnd - now, 0)
  }, [notificationNow, playerData?.sessionEndsAt, gameCooldownSeconds])

  useEffect(() => {
    const interval = setInterval(() => setNotificationNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let mounted = true

    const fetchGameCooldown = async () => {
      try {
        const cooldown = await publicClient.readContract({
          address: DIGIT_RABBITS_ADDRESS,
          abi: DIGIT_RABBITS_ABI,
          functionName: 'COOLDOWN',
        })

        if (!mounted) return
        const parsedCooldown = Number(cooldown)
        if (Number.isFinite(parsedCooldown) && parsedCooldown > 0) {
          setGameCooldownSeconds(parsedCooldown)
        }
      } catch (cooldownError) {
        console.warn('Could not read COOLDOWN from contract for Notification Center, fallback to local constant:', cooldownError)
      }
    }

    void fetchGameCooldown()

    return () => {
      mounted = false
    }
  }, [embeddedWallet?.address])

  useEffect(() => {
    if (embeddedWallet?.address && seasonId !== null) {
      setHasLoadedPlayerData(false)
    }
  }, [embeddedWallet?.address, seasonId])

  // Récupération de la liste des assets et des memes
  useEffect(() => {
    fetch("/api/assets")
      .then((res) => res.json())
      .then((data) => setAssetsList(data))
      .catch((err) => console.error("Error loading assets.", err));
  }, []);

  useEffect(() => {
    fetch("/api/memes")
      .then((res) => res.json())
      .then((data) => setMemeList(data))
      .catch((err) => console.error("Error loading memes", err));
  }, []);

  useEffect(() => {
    const wasTempDisabled = sessionStorage.getItem('3d_temp_disabled') === 'true';
    if (wasTempDisabled) {
      setShow3DEffects(true); // Réactive explicitement l'effet 3D
      localStorage.setItem('show3DEffects', JSON.stringify(true))
      sessionStorage.removeItem('3d_temp_disabled'); // Nettoie le flag
    }
  }, [setShow3DEffects]);

  // 1. On récupère la saison une seule fois au montage
  useEffect(() => {
    async function fetchSeason() {

      console.log("📦 Fetching season ID...")
      const season = await publicClient.readContract({
        address: DIGIT_RABBITS_ADDRESS,
        abi: DIGIT_RABBITS_ABI,
        functionName: 'currentSeasonId',
      })
      setSeasonId(Number(season))
    }

    if (embeddedWallet?.address) {
      fetchSeason()
    }
  }, [embeddedWallet])


  // Fonction séparée pour récupérer uniquement les clics totaux
  const fetchTotalClicks = async () => {
    console.log("📥 Fetching total clicks of the game")
    try {
      const totalClicksGame = await publicClient.readContract({
        address: DIGIT_RABBITS_ADDRESS,
        abi: DIGIT_RABBITS_ABI,
        functionName: 'totalClicksGame',
        args: [],
      })

      const data = {
        rabbitPoints: 0,
        totalClicks: 0,
        gameClicks: 0,
        playerItems: Array(NUM_SLOTS).fill(0),
        sessionEndsAt: null,
        boost: 0,
        streak: 0,
        hasClaimedPoints: false,
        maxClicks: 0,
        totalClicksGame: totalClicksGame,
        gamePlayed: 0,
        // Chat stats
        dailyMessages: 0,
        weeklyMessages: 0,
        totalMessages: 0,
      }
      setPlayerData(data)
    } catch (error) {
      console.error("Error fetching total clicks:", error)
    }
  }

  // Fonction pour fetch toutes les données du joueur
  const fetchPlayerData = useCallback(async ({ force = false } = {}) => {
    if (!embeddedWallet?.address || seasonId === null) return;

    const now = Date.now()
    if (playerFetchStateRef.current.inFlight) {
      if (force) {
        playerFetchStateRef.current.pendingForce = true
      }
      return
    }
    if (!force && now - playerFetchStateRef.current.lastAt < PLAYER_MIN_FETCH_INTERVAL_MS) {
      return
    }

    playerFetchStateRef.current.inFlight = true
    playerFetchStateRef.current.lastAt = now

    console.log("📥 Fetching player data");
    try {
      const result = await publicClient.readContract({
        address: DIGIT_RABBITS_ADDRESS,
        abi: DIGIT_RABBITS_ABI,
        functionName: 'getPlayerData',
        args: [embeddedWallet.address, seasonId],
      });

      const totalClicksGame = await publicClient.readContract({
        address: DIGIT_RABBITS_ADDRESS,
        abi: DIGIT_RABBITS_ABI,
        functionName: 'totalClicksGame',
        args: [],
      });

      const messages7days = await publicClient.readContract({
        address: DIGIT_RABBITS_CHAT_ADDRESS,
        abi: DIGIT_RABBITS_CHAT_ABI,
        functionName: 'getUserMessageCountPerDay',
        args: [embeddedWallet.address, 7],
      });

      // returns (role, messageCount, totalScore, lastMessageTimestamp, canSendMessage, isMuted, muteExpiresAt)
      const userDataChat = await publicClient.readContract({
        address: DIGIT_RABBITS_CHAT_ADDRESS,
        abi: DIGIT_RABBITS_CHAT_ABI,
        functionName: 'getUserData',
        args: [embeddedWallet.address],
      });

      const rabbitPoints = result[0] !== undefined ? Number(result[0]) / 1_000_000 : -1;
      const [totalClicks, gameClicks, sessionEndsAt, streak, hasClaimedPoints, maxClicks, gamePlayed] = result.slice(1);

      setPlayerData({
        rabbitPoints,
        totalClicks: Number(totalClicks),
        gameClicks: Number(gameClicks),
        playerItems: Array(NUM_SLOTS).fill(0),
        sessionEndsAt: Number(sessionEndsAt),
        streak: Number(streak),
        hasClaimedPoints,
        maxClicks: Number(maxClicks),
        gamePlayed: Number(gamePlayed),
        totalClicksGame: Number(totalClicksGame),
        dailyMessages: Number(messages7days[0]),
        weeklyMessages: messages7days,
        totalMessages: Number(userDataChat[1]),
      });
      setHasLoadedPlayerData(true)
    } catch (error) {
      console.error("Error fetching player data:", error);
      setHasLoadedPlayerData(false)
    } finally {
      playerFetchStateRef.current.inFlight = false

      if (playerFetchStateRef.current.pendingForce) {
        playerFetchStateRef.current.pendingForce = false
        setTimeout(() => {
          void fetchPlayerData({ force: true })
        }, 0)
      }
    }
  }, [embeddedWallet?.address, seasonId]);


  // Chargement initial
  useEffect(() => {
    if (!embeddedWallet?.address || seasonId === null) {
      fetchTotalClicks();
      return;
    }
    void fetchPlayerData({ force: true });
  }, [embeddedWallet?.address, seasonId]);

  // Enregistrement des callbacks pour les événements du contrat
  useEffect(() => {
    const currentAddress = embeddedWallet?.address?.toLowerCase()
    const isCurrentPlayerEvent = (log) => {
      const eventAddress = (log?.args?.player || log?.args?.user)?.toLowerCase?.()
      return Boolean(currentAddress && eventAddress && eventAddress === currentAddress)
    }

    registerCallbacks({
      onPointsClaimed: (log) => {
        if (!isCurrentPlayerEvent(log)) return
        console.log('💰 Points claimed, refreshing player data...')
        void fetchPlayerData({ force: true })
      },
      onGameStarted: (log) => {
        if (!isCurrentPlayerEvent(log)) return
        console.log('🚀 Game started, refreshing player data...')
        void fetchPlayerData({ force: true })
      },
      onGamePlayed: (log) => {
        if (!isCurrentPlayerEvent(log)) return
        console.log('🎮 Game played, refreshing player data...')
        void fetchPlayerData({ force: true })
      },
      onQuestRewardCredited: (log) => {
        if (!isCurrentPlayerEvent(log)) return
        console.log('💰 Quest reward credited, refreshing player data...')
        void fetchPlayerData({ force: true })
        void refetchQuestStatus()
      },
      onUserRoleChanged: (log) => {
        if (!isCurrentPlayerEvent(log)) return
        console.log('👤 Role changed, refreshing player data...')
        void fetchPlayerData({ force: true })
      },
      onUserMuted: (log) => {
        console.log('🔇 User muted')
      },
    })
  }, [embeddedWallet?.address, fetchPlayerData, refetchQuestStatus, registerCallbacks])

  // Notification center: refresh des quêtes même si la fenêtre Quests n'est pas ouverte
  useEffect(() => {
    if (!embeddedWallet?.address || !hasLoadedPlayerData) return

    void refetchQuestStatus()

    const interval = setInterval(() => {
      void refetchQuestStatus()
    }, QUEST_REFRESH_INTERVAL_MS)

    const onFocus = () => {
      if (document.hidden) return
      void refetchQuestStatus()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [embeddedWallet?.address, hasLoadedPlayerData, refetchQuestStatus])

  // Notification center: activité chat
  useEffect(() => {
    const currentLength = Array.isArray(messages) ? messages.length : 0
    const newestTimestamp = currentLength > 0
      ? Number(messages[currentLength - 1]?.timestamp || 0)
      : 0

    setChatNotifications((previous) => ({
      ...previous,
      totalLoadedMessages: currentLength,
      lastMessageAt: newestTimestamp || previous.lastMessageAt
    }))

    previousMessagesLengthRef.current = currentLength
  }, [messages])

  // Fonction pour recharger uniquement les clics totaux (pour le bouton reload)
  const reloadTotalClicks = async () => {
    try {
      const totalClicksGame = await publicClient.readContract({
        address: DIGIT_RABBITS_ADDRESS,
        abi: DIGIT_RABBITS_ABI,
        functionName: 'totalClicksGame',
        args: [],
      })

      // Met à jour seulement le totalClicksGame dans playerData existant
      setPlayerData(prevData => ({
        ...prevData,
        totalClicksGame: totalClicksGame
      }))
    } catch (error) {
      console.error("Error reloading total clicks:", error)
    }
  }


  const restoreApp = (appName, options = {}) => {
    const { force = false } = options
    if (isAppInteractionLocked && !force) return

    setVisibleApps((apps) => {
      if (apps.includes(appName)) {
        // L'app est déjà visible : on ne change pas l'ordre, on met simplement le zIndex à jour
        bringToFront(appName, apps);
        return apps; // on ne modifie pas la liste visibleApps
      } else {
        // L'app n'est pas visible, on l'ajoute à la fin
        const newApps = [...apps, appName];

        // On met aussi le zIndex de cette nouvelle app au plus haut
        setAppZIndices((oldZ) => {
          const allApps = Array.from(new Set([...newApps, ...Object.keys(oldZ)]));
          const appsWithZ = allApps.map(app => [app, oldZ[app] || 0]);
          appsWithZ.sort((a, b) => a[1] - b[1]);
          const newZ = {};
          appsWithZ.forEach(([app], index) => {
            newZ[app] = index + 1;
          });
          newZ[appName] = appsWithZ.length + 1;
          return newZ;
        });

        return newApps;
      }
    });

    // On traite le cas des app minimized
    setMinimizedApps((prev) => {
      if (prev.includes(appName)) {
        return prev.filter((app) => app !== appName);
      }
      return prev; // <-- ici manquait un return
    });


    setTimeout(() => {
      const event = new CustomEvent('recenterApp', { detail: { appName } });
      window.dispatchEvent(event);
    }, 0);

  };

  const bringToFront = (appName, visibleAppsRaw) => {
    const visibleApps = Array.isArray(visibleAppsRaw) ? visibleAppsRaw : [];

    setAppZIndices((oldZ) => {
      const allApps = Array.from(new Set([...visibleApps, ...Object.keys(oldZ)]));
      const appsWithZ = allApps.map(app => [app, oldZ[app] || 0]);
      appsWithZ.sort((a, b) => a[1] - b[1]);
      const newZ = {};
      appsWithZ.forEach(([app], index) => {
        newZ[app] = index + 1;
      });
      newZ[appName] = appsWithZ.length + 1;
      return newZ;
    });
  };


  const handleClose = (appName) => {
    setVisibleApps((apps) => apps.filter((app) => app !== appName));
    setAppZIndices((prev) => {
      const updated = { ...prev };
      delete updated[appName];
      return updated;
    });
  };

  const closeAppWindow = useCallback((appName) => {
    setVisibleApps((apps) => apps.filter((app) => app !== appName))
    setMinimizedApps((apps) => apps.filter((app) => app !== appName))
    setAppZIndices((previous) => {
      if (!Object.prototype.hasOwnProperty.call(previous, appName)) return previous
      const updated = { ...previous }
      delete updated[appName]
      return updated
    })
  }, [])

  const {
    activeOnboardingStep,
    onboardingStepIndex,
    onboardingBaseZ,
    onboardingTargetPosition,
    onboardingBubblePosition,
    onboardingTargetRect,
    typedOnboardingDescription,
    onboardingProgressText,
    onboardingDescriptionText,
    fundingLinkWarningText,
    isFundingStep,
    isFundingCopySubStep,
    isFundingLinkSubStep,
    hasGasBalance,
    hasClickedLinkWallet,
    isFundingNextLocked,
    onboardingTargetAppOverride,
    advanceOnboardingStep,
    onboardingStepsLength,
  } = useMainPageOnboarding({
    embeddedWalletAddress: embeddedWallet?.address,
    hasLoadedPlayerData,
    hasNoPoints,
    appZIndices,
    isMobile,
    show3DEffects,
    setShow3DEffects,
    openApp: restoreApp,
    closeApp: closeAppWindow,
  })

  const onGameEnd = useCallback(async () => {
    setIsGameStarted(false)
    resetPool() // Reset de la pool avant début d'une nouvelle partie
  }, [resetPool]) // Dépendre de resetPool qui est stable

  const renderAppContent = (appName) => {
    switch (appName) {
      case "About":
        return <About />;
      case "Memes":
        return <MemeGallery memeList={memeList} setSelectedMemeIndex={setSelectedMemeIndex} />;
      case "Assets":
        return <Assets assetsList={assetsList} setSelectedAssetsIndex={setSelectedAssetsIndex} />;
      case "Profile":
        return <Profile playerData={playerData} />;
      case "Game":
        return <Game
          playerData={playerData}
          embeddedWallet={embeddedWallet}
          preSignedPool={preSignedPool}
          isInitializing={isInitializing} error={error}
          initializePool={initializePool}
          executeTransaction={executeTransaction}
          isGameStarted={isGameStarted}
          setIsGameStarted={setIsGameStarted}
          onGameEnd={onGameEnd}
          getAvailableTransactions={getAvailableTransactions}
        />;
      case "RabbitChat":
        return <RabbitChat
          playerData={playerData}
          messages={messages}
          isConnected={isConnected}
          resyncMessages={resync}
        />;
      case "Quests":
        return <Quests
          playerData={playerData}
          embeddedWallet={embeddedWallet}
          onQuestClaimed={() => {
            void refetchQuestStatus()
            void fetchPlayerData({ force: true })
          }}
        />;
      case "Leaderboard":
        return <Leaderboard />;
      case "Settings":
        return <Settings
          sound={sound}
          setSound={setSound}
          volume={volume}
          setVolume={setVolume}
          volumePlayer={volumePlayer}
          setVolumePlayer={setVolumePlayer}
        />;
      case "Chill":
        return <Chill />;
      case "FAQ":
        return <FAQ />;
      case "Roadmap":
        return <Roadmap
          embeddedWallet={embeddedWallet}
          playerData={playerData}
          onReloadClicks={reloadTotalClicks}
        />
      case "Linktree":
        return <Linktree />
      default:
        return null;
    }
  };


  // Styles pour les boutons de navigation
  // (gauche et droite) pour la visualisation des memes  
  const navButtonStyle = {
    background: "none",
    color: "white",
    fontSize: "clamp(1rem, 2vw, 2rem)", // taille entre 1rem et 2rem selon la largeur d’écran
    border: "none",
    cursor: "pointer",
    margin: "0 clamp(10px, 2vw, 20px)", // marge latérale responsive
  };


  const BackgroundEffect = dynamic(() => import('./BackgroundEffect'), { ssr: false });

  return (
    <div className={`${themeMode === 'light' ? styles.bgDay : styles.bgNight}`}>

      {embeddedWallet?.address && (
        <>
          <div
            style={{
              position: 'fixed',
              bottom: isMobile ? '62px' : '52px',
              right: isMobile ? '12px' : '16px',
              zIndex: 1,
              width: isMobile ? 'min(78vw, 220px)' : '230px',
              maxWidth: '80vw',
              background: themeMode === 'dark' ? 'rgba(26, 26, 26, 0.78)' : 'rgba(255, 255, 255, 0.8)',
              border: `1px solid ${themeMode === 'dark' ? '#3f3f46' : '#d1d5db'}`,
              borderRadius: '10px',
              backdropFilter: 'blur(5px)',
              boxShadow: themeMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.28)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
              padding: '8px 10px'
            }}
          >

            <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: themeMode === 'dark' ? '#e5e7eb' : '#111827', opacity: 0.92 }}>
              Notification Center
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: themeMode === 'dark' ? '#d1d5db' : '#1f2937', opacity: 0.88 }}>
                <Image src="/img/icons/quests.png" alt="Quests" width={12} height={12} />
                <span>{questNotifications.isLoading
                  ? 'checking...'
                  : questNotifications.readyCount > 0
                    ? <a onClick={() => { restoreApp("Quests") }} style={{ color: 'inherit' }}>
                      {questNotifications.readyCount} ready to claim
                    </a>
                    : questNotifications.nextReadyIn !== null
                      ? `next in ${formatDuration(questNotifications.nextReadyIn)}`
                      : 'no quest claimable'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: themeMode === 'dark' ? '#d1d5db' : '#1f2937', opacity: 0.88 }}>
                <Image src="/img/icons/game.png" alt="Game" width={12} height={12} />
                <span>{getGameStartCooldownRemaining() > 0
                  ? `ready in ${formatDuration(getGameStartCooldownRemaining())}`
                  : 'ready to start'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: themeMode === 'dark' ? '#d1d5db' : '#1f2937', opacity: 0.88 }}>
                <Image src="/img/icons/rabbitchat.png" alt="Chat" width={12} height={12} />
                <span>{Number(chatNotifications.totalLoadedMessages || 0)} messages in chat</span>
              </div>
            </div>
          </div>
        </>
      )}

      {activeOnboardingStep && onboardingStepIndex < onboardingStepsLength && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: onboardingBaseZ,
              pointerEvents: 'auto',
              cursor: 'not-allowed',
              background: onboardingTargetPosition
                ? `radial-gradient(circle 84px at ${onboardingTargetPosition.left}px ${onboardingTargetPosition.top}px, rgba(0,0,0,0.05) 0, rgba(0,0,0,0.08) 38px, rgba(0,0,0,0.5) 84px, rgba(0,0,0,0.62) 100%)`
                : 'rgba(0, 0, 0, 0.58)'
            }}
            onClick={(event) => event.preventDefault()}
          />

          {onboardingTargetPosition && !isMobile && (
            <div
              style={{
                position: 'fixed',
                left: onboardingTargetPosition.left + (onboardingTargetAppOverride === 'digit-head' ? 0 : 72),
                top: onboardingTargetPosition.top - (onboardingTargetAppOverride === 'digit-head' ? 0 : 46) + (isFundingLinkSubStep ? 36 : 0),
                transform: 'translate(-50%, -50%)',
                zIndex: onboardingBaseZ + 5,
                pointerEvents: 'none',
                width: isMobile ? 56 : 90,
                height: isMobile ? 56 : 120,
                filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.35))',
                transition: 'left 0.28s ease, top 0.28s ease, width 0.28s ease, height 0.28s ease'
              }}
            >
              <Canvas camera={{ position: [1, 0, 3] }} style={{ pointerEvents: 'none' }}>
                <ambientLight intensity={1.1} />
                <directionalLight position={[2, 2, 2]} intensity={1.3} />
                <FloatingHeadModel
                  mouse={null}
                  isClicked={false}
                  themeMode={themeMode}
                  forceLight={true}
                  onPointerDown={() => { }}
                  onPointerUp={() => { }}
                />
              </Canvas>
            </div>
          )}

          {onboardingBubblePosition && (
            <div
              style={{
                position: 'fixed',
                top: onboardingBubblePosition.top,
                left: onboardingBubblePosition.left,
                transform: 'translateX(-50%)',
                zIndex: onboardingBaseZ + 6,
                width: onboardingBubblePosition.width,
                background: themeMode === 'dark'
                  ? 'linear-gradient(160deg, rgba(245,245,245,0.96) 0%, rgba(231,231,231,0.94) 100%)'
                  : 'linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(244,244,244,0.98) 100%)',
                border: '3px solid #111827',
                borderRadius: '18px',
                boxShadow: '6px 6px 0 #111827',
                padding: isMobile ? '10px 12px' : '12px 14px',
                backdropFilter: 'blur(2px)',
                fontFamily: '"Comic Sans MS", "Comic Neue", "Chalkboard SE", cursive',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{
                  fontSize: '12px',
                  color: '#111827',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase'
                }}>
                  New player onboarding
                </strong>
                <span style={{ fontSize: '10px', color: '#374151', fontWeight: 700 }}>
                  {onboardingProgressText}
                </span>
              </div>

              <div style={{ fontSize: '11px', lineHeight: 1.4, color: '#111827' }}>
                <strong>{activeOnboardingStep.title}:</strong> {typedOnboardingDescription}
                {typedOnboardingDescription.length < (onboardingDescriptionText?.length || 0) && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: '2px',
                      width: '6px',
                    }}
                  >
                    |
                  </span>
                )}
              </div>
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '10px',
                  lineHeight: 1.35,
                  color: isFundingLinkSubStep ? '#b91c1c' : '#374151',
                  fontWeight: isFundingLinkSubStep ? 700 : 400
                }}
              >
                {isFundingStep
                  ? hasGasBalance
                    ? isFundingLinkSubStep
                      ? hasClickedLinkWallet
                        ? 'Perfect. You clicked Link Wallet. Continue when you are ready.'
                        : 'Click Link Wallet at least once to continue. You can still continue even if you choose not to link after opening it.'
                      : 'Wallet funded. Continue to Link wallet.'
                    : isFundingCopySubStep
                      ? 'Use Copy first, then continue to Add funds.'
                      : 'Click Add funds, fund your wallet, then wait for balance refresh.'
                  : null}
              </div>
              {isFundingLinkSubStep && fundingLinkWarningText && (
                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '10px',
                    lineHeight: 1.35,
                    color: '#b91c1c',
                    fontWeight: 700,
                    whiteSpace: 'pre-line'
                  }}
                >
                  {fundingLinkWarningText}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={advanceOnboardingStep}
                  disabled={isFundingNextLocked}
                  style={{
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: isFundingNextLocked ? 'not-allowed' : 'pointer',
                    background: isFundingNextLocked ? '#6b7280' : '#111827',
                    color: '#f9fafb',
                    border: '2px solid #111827'
                  }}
                >
                  {isFundingStep && !hasGasBalance
                    ? 'Waiting for ETH'
                    : isFundingLinkSubStep && !hasClickedLinkWallet
                      ? 'Click Link Wallet first'
                    : onboardingStepIndex >= onboardingStepsLength - 1
                      ? 'Finish'
                      : 'Next'}
                </button>
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: isMobile
                    ? activeOnboardingStep?.app === 'Game'
                      ? '36%'
                      : activeOnboardingStep?.app === 'FAQ'
                        ? '66%'
                        : '50%'
                    : '50%',
                  bottom: '-12px',
                  width: '20px',
                  height: '20px',
                  transform: 'translateX(-50%) rotate(45deg)',
                  background: '#f8f8f8',
                  borderRight: '3px solid #111827',
                  borderBottom: '3px solid #111827',
                  borderTop: '0',
                  borderLeft: '0'
                }}
              />
            </div>
          )}
        </>
      )}

      {activeOnboardingStep && isFundingStep && onboardingTargetRect && (
        <button
          type="button"
          aria-label={
            isFundingCopySubStep
              ? 'Copy embedded wallet address'
              : isFundingLinkSubStep
                ? 'Open link wallet flow'
                : 'Open faucet link from Add funds button'
          }
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            const target = document.querySelector(
              isFundingCopySubStep
                ? '[data-app="settings-copy-wallet"]'
                : isFundingLinkSubStep
                  ? '[data-app="settings-link-wallet"]'
                  : '[data-app="settings-send-funds"], [data-app="settings-add-funds"]'
            )
            if (target && typeof target.click === 'function') {
              target.click()
            }
          }}
          style={{
            position: 'fixed',
            left: onboardingTargetRect.left,
            top: onboardingTargetRect.top,
            width: onboardingTargetRect.width,
            height: onboardingTargetRect.height,
            zIndex: onboardingBaseZ + 10,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        />
      )}

      {/* Icônes interactives */}
      <Icon
        name="About"
        src="/img/icons/about.png"
        label="About"
        onClick={() => restoreApp("About")}
        position={{ x: "20%", y: "10%" }}
      />
      <Icon
        name="Memes"
        src="/img/icons/memes.png"
        label="Memes"
        onClick={() => restoreApp("Memes")}
        position={{ x: "20%", y: "20%" }}
      />
      <Icon
        name="Quests"
        src="/img/icons/quests.png"
        label="Quests"
        onClick={() => restoreApp("Quests")}
        position={{ x: "60%", y: "50%" }}
      />
      <Icon
        name="Profile"
        src="/img/icons/profile.png"
        label="Profile"
        onClick={() => restoreApp("Profile")}
        position={{ x: -140, y: "40%" }}
      />
      <Icon
        name="Leaderboard"
        src="/img/icons/leaderboard.png"
        label="Leaderboard"
        onClick={() => restoreApp("Leaderboard")}
        position={{ x: 260, y: "32%" }}
      />
      <Icon
        name="Game"
        src="/img/icons/game.png"
        label="Game.exe"
        onClick={() => restoreApp("Game")}
        position={{ x: -100, y: "35%" }}
      />
      <Icon
        name="Chill"
        src="/img/icons/chill.png"
        label="Chill.mp4"
        onClick={() => restoreApp("Chill")}
        position={{ x: 30, y: "75%" }}
      />
      <Icon
        name="RabbitChat"
        src="/img/icons/rabbitchat.png"
        label="RabbitChat"
        onClick={() => restoreApp("RabbitChat")}
        position={{ x: -100, y: "50%" }}
      />
      <Icon
        name="digit-head"
        src="/3d/head"
        sound={sound}
        themeMode={themeMode}
        position={{ x: `${width - 790}px`, y: "1%" }}
        show3DEffects={show3DEffects && !(activeOnboardingStep && !isMobile)}
        volume={volume}
      />
      <Icon
        name="settings"
        label={"Settings"}
        src="/img/icons/settings.png"
        onClick={() => restoreApp("Settings")}
        position={{ x: "1%", y: "16%" }}
      />
      <Icon
        name="assets"
        label={"Assets"}
        src="/img/icons/assets.png"
        onClick={() => restoreApp("Assets")}
        position={{ x: "10%", y: "6%" }}
      />
      <Icon
        name="FAQ"
        label={"FAQ"}
        src="/img/icons/faq.png"
        onClick={() => restoreApp("FAQ")}
        position={{ x: "2%", y: "30%" }}
      />

      <Icon
        name="Roadmap"
        label={"Roadmap"}
        src="/img/icons/roadmap.png"
        onClick={() => restoreApp("Roadmap")}
        position={{ x: "12%", y: "26%" }}
      />
      <Icon
        name="Linktree"
        label={"Links"}
        src="/img/icons/link.png"
        onClick={() => restoreApp("Linktree")}
        position={{ x: "15%", y: "16%" }}
      />

      {/* Affichage des memes plein écran*/}
      {
        selectedMemeIndex !== null && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setSelectedMemeIndex(null)}
          >
            <button onClick={(e) => { e.stopPropagation(); setSelectedMemeIndex((prev) => (prev > 0 ? prev - 1 : memeList.length - 1)); }} style={navButtonStyle}>◀</button>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <Image
                src={`/img/memes/${encodeURIComponent(memeList[selectedMemeIndex])}`}
                alt="Full meme"
                width={600}
                height={450}
                style={{
                  maxHeight: "70vh", // Limite à 70% de la hauteur de l'écran
                  maxWidth: "70vw",   // Limite à 80% de la largeur de l'écran
                  borderRadius: "10px",
                  boxShadow: "0 0 20px black",
                  objectFit: "contain"
                }}
              />
              <a
                href={`img/memes/${encodeURIComponent(memeList[selectedMemeIndex])}`}
                download
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#fff",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  color: "#000",
                  fontWeight: "bold",
                  boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                  position: "absolute",
                  bottom: "8%",
                }}
              >
                Download
              </a>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setSelectedMemeIndex((prev) => (prev + 1) % memeList.length); }} style={navButtonStyle}>▶</button>
          </div>
        )
      }

      {/* Background dans le cas où on est sur mobile */}
      <MobileBackground restoreApp={restoreApp} themeMode={themeMode} showRabbit={false} />

      {/* Affichage des assets plein écran*/}
      {
        selectedAssetsIndex !== null && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setSelectedAssetsIndex(null)}
          >
            <button onClick={(e) => { e.stopPropagation(); setSelectedAssetsIndex((prev) => (prev > 0 ? prev - 1 : assetsList.length - 1)); }} style={navButtonStyle}>◀</button>
            <img src={`img/assets/${encodeURIComponent(assetsList[selectedAssetsIndex])}`} alt="Full asset" style={{ maxHeight: "70%", maxWidth: "70%", borderRadius: "10px", boxShadow: "0 0 20px black" }} />
            <a
              href={`img/assets/${encodeURIComponent(assetsList[selectedAssetsIndex])}`}
              download
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff",
                padding: "10px 20px",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#000",
                fontWeight: "bold",
                boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                position: "absolute",
                bottom: "60px",
              }}
            >
              Download
            </a>
            <button onClick={(e) => { e.stopPropagation(); setSelectedAssetsIndex((prev) => (prev + 1) % assetsList.length); }} style={navButtonStyle}>▶</button>
          </div>
        )
      }


      {
        visibleApps.map((appName, index) => (
          <DraggableWindow
            key={appName}
            title={appName}
            onClose={() => handleClose(appName)}
            zIndex={appZIndices[appName] || 1}  // <-- ici !
            onFocus={() => bringToFront(appName)}
            theme={themeMode}
            visibleApps={visibleApps}
            windowIndex={index}
            totalWindows={visibleApps.length}
            littleWindow={appName === 'Chill' ? true : false}
            onMinimize={() => setMinimizedApps(prev => [...prev, appName])}
            isMinimized={Array.isArray(minimizedApps) && minimizedApps.includes(appName)}
          >
            {renderAppContent(appName)}
          </DraggableWindow>
        ))
      }

      {/* 
        show3DEffects && !isMobile && (
          <Suspense fallback={null}>
            {themeMode === 'light' ? <BackgroundEffect /> : <BackgroundEffect mode="moon" />}
          </Suspense>
        )
      */}

      <Footer visibleApps={visibleApps}
        setVisibleApps={setVisibleApps}
        appZIndices={appZIndices}
        setAppZIndices={setAppZIndices}
        openApp={restoreApp}
        volumePlayer={volumePlayer} />
    </div >
  );
}
