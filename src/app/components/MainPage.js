"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./MainPage.module.css";
import Image from "next/image";
import Icon from "./Icon";
import Footer from "./Footer";
import MemeGallery from "./MemeGallery";
import BackgroundEffect from "./BackgroundEffect";
import Profile from "./Profile";
import Settings from "./Settings";
import { useWindowSize } from "../hooks/useWindowSize"; // Assurez-vous d'importer le bon hook
import Leaderboard from "./Leaderboard";
import About from "./About";
import { useTheme } from "@/context";
import DraggableWindow from "./DraggableWindow";
import Game from "./Game";
import Chill from "./Chill";
import Shop from "./Shop";
import Assets from "./Assets";
import FAQ from "./FAQ";
import { useWallets, getEmbeddedConnectedWallet } from '@privy-io/react-auth'
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, publicClient, NUM_SLOTS } from '@/constants'
import { usePrivy } from "@privy-io/react-auth";
import { usePreSignedPool } from "../hooks/usePreSignedPool";
import { useWalletClient } from '../hooks/useWalletClient'

export default function MainPage() {

  const [visibleApps, setVisibleApps] = useState([]);
  const [minimizedApps, setMinimizedApps] = useState([]);
  const [appZIndices, setAppZIndices] = useState({});
  const [focusedApp, setFocusedApp] = useState(null);
  const [zCounter, setZCounter] = useState(1); // zIndex de départ

  const [sound, setSound] = useState("crying");
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
    playerItems: Array(NUM_SLOTS).fill(0),
    totalClicks: 0,
    sessionEndsAt: null,
    boost: 0,
    streak: 0,
    hasClaimedPoints: false
  })

  // On récupère l'embedded wallet ici puis on propage ensuite
  const [embeddedWallet, setEmbeddedWallet] = useState(null);
  const { wallets } = useWallets();
  const { logout, user, ready, authenticated } = usePrivy();

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


  useEffect(() => {
    const wasTempDisabled = sessionStorage.getItem('3d_temp_disabled') === 'true';
    if (wasTempDisabled) {
      toggle3DEffects(); // Réactive l'effet 3D
      sessionStorage.removeItem('3d_temp_disabled'); // Nettoie le flag
    }
  }, []);

  // Initialisation de embeddedWallet (This part is correct and can stay)
  useEffect(() => {
    // The getEmbeddedConnectedWallet function should handle the case where wallets is empty
    const wallet = getEmbeddedConnectedWallet(wallets);
    setEmbeddedWallet(wallet);
  }, [wallets]);

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


  // On charge playerData au démarrage et à chaque refresh
  useEffect(() => {
    if (!embeddedWallet?.address || seasonId === null) {
      return
    }

    async function fetchPlayerData() {
      console.log("📥 Fetching player data for", embeddedWallet.address, "Season:", seasonId)
      const result = await publicClient.readContract({
        address: DIGIT_RABBITS_ADDRESS,
        abi: DIGIT_RABBITS_ABI,
        functionName: 'getPlayerData',
        args: [embeddedWallet.address, seasonId],
      })

      const rabbitPoints = result[0] !== undefined ? Number(result[0]) / 1_000_000 : -1
      const [totalClicks, playerItems, sessionEndsAt, boost, streak, hasClaimedPoints] = result.slice(1)

      const data = {
        rabbitPoints,
        totalClicks,
        playerItems,
        sessionEndsAt,
        boost,
        streak,
        hasClaimedPoints
      }
      setPlayerData(data)
    }

    fetchPlayerData()
  }, [embeddedWallet?.address, seasonId, refreshCounter])


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

  const renderAppContent = (appName) => {
    switch (appName) {
      case "About":
        return <About />;
      case "Memes":
        return <MemeGallery memeList={memeList} setMemeList={setMemeList} setSelectedMemeIndex={setSelectedMemeIndex} />;
      case "Assets":
        return <Assets assetsList={assetsList} setAssetsList={setAssetsList} setSelectedAssetsIndex={setSelectedAssetsIndex} />;
      case "Profile":
        return <Profile embeddedWallet={embeddedWallet} playerData={playerData} setRefreshCounter={setRefreshCounter} />;
      case "Game":
        return <Game refreshCounter={refreshCounter} setRefreshCounter={setRefreshCounter} playerData={playerData} embeddedWallet={embeddedWallet} preSignedPool={preSignedPool} isInitializing={isInitializing} error={error} initializePool={initializePool} executeTransaction={executeTransaction} isGameStarted={isGameStarted} setIsGameStarted={setIsGameStarted} onGameEnd={() => setIsGameStarted(false)} getAvailableTransactions={getAvailableTransactions} />;
      case "Shop":
        return <Shop refreshCounter={refreshCounter} setRefreshCounter={setRefreshCounter} playerData={playerData} embeddedWallet={embeddedWallet} />;
      case "Leaderboard":
        return <Leaderboard embeddedWallet={embeddedWallet} />;
      case "Settings":
        return <Settings setSound={setSound} embeddedWallet={embeddedWallet} />;
      case "Chill":
        return <Chill />;
      case "FAQ":
        return <FAQ />;
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
      <Image src="/img/bg-img-mobile.png" alt="Mobile image" fill className={styles.mobileImage} />
      {/* Icônes interactives */}
      <Icon
        name="About"
        src="/img/icons/about.png"
        label="About"
        onClick={() => restoreApp("About")}
        position={{ x: "1%", y: "1%" }} // Spécifie la position de l'icône
      />
      <Icon
        name="Memes"
        src="/img/icons/memes.png"
        label="Memes"
        onClick={() => restoreApp("Memes")}
        position={{ x: "1%", y: "2%" }} // Spécifie la position de l'icône
      />
      <Icon
        name="Profile"
        src="/img/icons/profile.png"
        label="Profile"
        onClick={() => restoreApp("Profile")}
        position={{ x: -140, y: "40%" }} // Spécifie la position de l'icône
      />
      <Icon
        name="Leaderboard"
        src="/img/icons/leaderboard.png"
        label="Leaderboard"
        onClick={() => restoreApp("Leaderboard")}
        position={{ x: 250, y: "70%" }} // Spécifie la position de l'icône
      />
      <Icon
        name="Game"
        src="/img/icons/game.png"
        label="Game.exe"
        onClick={() => restoreApp("Game")}
        position={{ x: -100, y: "35%" }} // Spécifie la position de l'icône
      />

      <Icon
        name="Chill"
        src="/img/icons/chill.png"
        label="Chill.mp4"
        onClick={() => restoreApp("Chill")}
        position={{ x: -40, y: "75%" }} // Spécifie la position de l'icône
      />

      <Icon
        name="Shop"
        src="/img/icons/shop.png"
        label="Shop"
        onClick={() => restoreApp("Shop")}
        position={{ x: -100, y: "50%" }} // Spécifie la position de l'icône
      />

      <Icon
        name="digit-head"
        src="/3d/head" // déclenche l'affichage 3D
        sound={sound}
        themeMode={themeMode}
        position={{ x: `${width - 690}px`, y: "1%" }}
        show3DEffects={show3DEffects}
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
        label={"Assets.png"}
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
          <img src={`img/memes/${encodeURIComponent(memeList[selectedMemeIndex])}`} alt="Full meme" style={{ maxHeight: "70%", maxWidth: "70%", borderRadius: "10px", boxShadow: "0 0 20px black" }} />
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
              bottom: "50px",
            }}
          >
            Download
          </a>
          <button onClick={(e) => { e.stopPropagation(); setSelectedMemeIndex((prev) => (prev + 1) % memeList.length); }} style={navButtonStyle}>▶</button>
        </div>
      )}

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
      <Footer visibleApps={visibleApps} setVisibleApps={setVisibleApps} appZIndices={appZIndices} setAppZIndices={setAppZIndices} openApp={restoreApp} />
    </div>
  );
}
