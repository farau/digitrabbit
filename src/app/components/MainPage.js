"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import styles from "./MainPage.module.css";
import Icon from "./Icon";
import Footer from "./Footer";
import MemeGallery from "./MemeGallery";
import BackgroundEffect from "./BackgroundEffect";
import Profile from "./Profile";
import Settings from "./Settings";
import { useWindowSize } from "../hooks/useWindowSize"; // Assurez-vous d'importer le bon hook
import Leaderboard from "./Leaderboard";
import About from "./About";
import { useTheme, useGame } from "@/context";
import DraggableWindow from "./DraggableWindow";
import Game from "./Game";
import Chill from "./Chill";
import Shop from "./Shop";
import Assets from "./Assets";
import FAQ from "./FAQ";
import Roadmap from "./Roadmap";
import MobileBackground from "./MobileBackground";

import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, publicClient, NUM_SLOTS } from '@/utils/constants'
import { usePreSignedPool } from "../hooks/usePreSignedPool";


export default function MainPage() {

  const [visibleApps, setVisibleApps] = useState([]);
  const [minimizedApps, setMinimizedApps] = useState([]);
  const [appZIndices, setAppZIndices] = useState({});

  const [sound, setSound] = useState("crying");
  const [volume, setVolume] = useState(0.5);

  const [volumePlayer, setVolumePlayer] = useState(0.2); // Volume musique principale

  const { themeMode, toggleTheme, show3DEffects, toggle3DEffects } = useTheme();
  const { width } = useWindowSize();
  // Setters pour memes
  const [selectedMemeIndex, setSelectedMemeIndex] = useState(null);
  const [memeList, setMemeList] = useState([]);

  // Setters pour assets
  const [selectedAssetsIndex, setSelectedAssetsIndex] = useState(null);
  const [assetsList, setAssetsList] = useState([]);

  // Refresher compteur pour réactualiser les valeurs du player
  const [refreshCounter, setRefreshCounter] = useState(0)
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
    totalClicksGame: 0
  })

  // On récupère l'embedded wallet ici puis on propage ensuite
  const { embeddedWallet, validationError, isValidating } = useGame()

  // Setter game
  const [isGameStarted, setIsGameStarted] = useState(false)

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
      toggle3DEffects(); // Réactive l'effet 3D
      sessionStorage.removeItem('3d_temp_disabled'); // Nettoie le flag
    }
  }, []);

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
        totalClicksGame: totalClicksGame
      }
      setPlayerData(data)
    } catch (error) {
      console.error("Error fetching total clicks:", error)
    }
  }

  // Fonction séparée pour récupérer toutes les données du joueur
  const fetchPlayerData = async () => {
    if (!embeddedWallet?.address || seasonId === null) return

    console.log("📥 Fetching player data for", embeddedWallet.address, "Season:", seasonId)
    try {
      const result = await publicClient.readContract({
        address: DIGIT_RABBITS_ADDRESS,
        abi: DIGIT_RABBITS_ABI,
        functionName: 'getPlayerData',
        args: [embeddedWallet.address, seasonId],
      })

      // On récupère aussi le nombre total de clics
      const totalClicksGame = await publicClient.readContract({
        address: DIGIT_RABBITS_ADDRESS,
        abi: DIGIT_RABBITS_ABI,
        functionName: 'totalClicksGame',
        args: [],
      })

      const rabbitPoints = result[0] !== undefined ? Number(result[0]) / 1_000_000 : -1
      const [totalClicks, gameClicks, playerItems, sessionEndsAt, boost, streak, hasClaimedPoints, maxClicks] = result.slice(1)

      const data = {
        rabbitPoints,
        totalClicks,
        gameClicks,
        playerItems,
        sessionEndsAt,
        boost,
        streak,
        hasClaimedPoints,
        maxClicks,
        totalClicksGame
      }
      setPlayerData(data)
    } catch (error) {
      console.error("Error fetching player data:", error)
    }
  }

  // useEffect simplifié
  useEffect(() => {
    if (!embeddedWallet?.address || seasonId === null) {
      fetchTotalClicks()
      return
    }

    fetchPlayerData()
  }, [embeddedWallet?.address, seasonId, refreshCounter])

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

  // MAJ du currentIndex de pool si refreshCounter est appelé en dehors du composant Game
  useEffect(() => {
    if (isGameStarted || !preSignedPool) return

    incrementIndex()
    console.log("On incrémente l'index de la pool initialisée car une tx a été effectuée ailleurs")
  }, [refreshCounter])


  function BackgroundSwitcher() {

    return (
      <>
        {themeMode === 'light' ? <BackgroundEffect /> : <BackgroundEffect mode="moon" />}
      </>
    );
  }

  const restoreApp = (appName) => {
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
        return <Profile playerData={playerData} setRefreshCounter={setRefreshCounter} />;
      case "Game":
        return <Game
          refreshCounter={refreshCounter}
          setRefreshCounter={setRefreshCounter}
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
      case "Shop":
        return <Shop refreshCounter={refreshCounter} setRefreshCounter={setRefreshCounter} playerData={playerData} />;
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
          refreshCounter={refreshCounter}
          playerData={playerData}
          onReloadClicks={reloadTotalClicks}
        />
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


  return (
    <div className={`${themeMode === 'light' ? styles.bgDay : styles.bgNight}`}>
      {/* Icônes interactives */}
      <Icon
        name="About"
        src="/img/icons/about.png"
        label="About"
        onClick={() => restoreApp("About")}
        position={{ x: "1%", y: "1%" }}
      />
      <Icon
        name="Memes"
        src="/img/icons/memes.png"
        label="Memes"
        onClick={() => restoreApp("Memes")}
        position={{ x: "1%", y: "2%" }}
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
        position={{ x: 280, y: "60%" }}
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
        name="Shop"
        src="/img/icons/shop.png"
        label="Shop"
        onClick={() => restoreApp("Shop")}
        position={{ x: -100, y: "50%" }}
      />
      <Icon
        name="digit-head"
        src="/3d/head"
        sound={sound}
        themeMode={themeMode}
        position={{ x: `${width - 690}px`, y: "1%" }}
        show3DEffects={show3DEffects}
        volume={volume}
      />
      <Icon
        name="settings"
        label={"Settings"}
        src="/img/icons/settings.png"
        onClick={() => restoreApp("Settings")}
        position={{ x: "1%", y: "26%" }}
      />
      <Icon
        name="assets"
        label={"Assets"}
        src="/img/icons/assets.png"
        onClick={() => restoreApp("Assets")}
        position={{ x: "10%", y: "6%" }}
      />
      <Icon
        name="faq"
        label={"FAQ"}
        src="/img/icons/faq.png"
        onClick={() => restoreApp("FAQ")}
        position={{ x: "12%", y: "26%" }}
      />

      <Icon
        name="Roadmap"
        label={"Roadmap"}
        src="/img/icons/roadmap.png"
        onClick={() => restoreApp("Roadmap")}
        position={{ x: "12%", y: "26%" }}
      />

      {/* Affichage des memes plein écran*/}
      {selectedMemeIndex !== null && (
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
      )}

      {/* Background dans le cas où on est sur mobile */}
      <MobileBackground
        restoreApp={restoreApp}
        themeMode={themeMode}
      />

      {/* Affichage des assets plein écran*/}
      {selectedAssetsIndex !== null && (
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
      )}


      {visibleApps.map((appName) => (
        <DraggableWindow
          key={appName}
          title={appName}
          onClose={() => handleClose(appName)}
          zIndex={appZIndices[appName] || 1}  // <-- ici !
          onFocus={() => bringToFront(appName)}
          theme={themeMode}
          visibleApps={visibleApps}
          littleWindow={appName === 'Chill' ? true : false}
          onMinimize={() => setMinimizedApps(prev => [...prev, appName])}
          isMinimized={Array.isArray(minimizedApps) && minimizedApps.includes(appName)}
        >
          {renderAppContent(appName)}
        </DraggableWindow>
      ))}

      {show3DEffects && <BackgroundSwitcher />}
      <Footer visibleApps={visibleApps}
        setVisibleApps={setVisibleApps}
        appZIndices={appZIndices}
        setAppZIndices={setAppZIndices}
        openApp={restoreApp}
        volumePlayer={volumePlayer} />
    </div>
  );
}
