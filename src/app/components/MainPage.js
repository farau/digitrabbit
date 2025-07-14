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
import { useWindowSize } from "../hooks/useWindowSize";
import Leaderboard from "./Leaderboard";
import About from "./About";
import { useTheme } from "@/context";
import DraggableWindow from "./DraggableWindow";
import Game from "./Game";
import Chill from "./Chill";
import Shop from "./Shop";
import Assets from "./Assets";
import FAQ from "./FAQ";
import DREAM from "./DREAM";
import { useGame } from '@/context/'; // Contexte pour le jeu

export default function MainPage() {
  const [visibleApps, setVisibleApps] = useState([]);
  const [minimizedApps, setMinimizedApps] = useState([]);
  const [appZIndices, setAppZIndices] = useState({});

  const [sound, setSound] = useState("crying");
  const { themeMode, show3DEffects, toggle3DEffects } = useTheme();
  const { width } = useWindowSize();

  // Setters pour memes
  const [selectedMemeIndex, setSelectedMemeIndex] = useState(null);
  const [memeList, setMemeList] = useState([]);

  // Setters pour assets
  const [selectedAssetsIndex, setSelectedAssetsIndex] = useState(null);
  const [assetsList, setAssetsList] = useState([]);

  // Setter pour increment des transactions sur les composants
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Appel du contexte pour le jeu - TOUTES les fonctions sont disponibles
  const {
    // États du jeu
    isGameStarted,
    // États du pool
    preSignedPool,
    syncPoolWithBlockchain,
    //Embedded wallet
    embeddedWallet,
    isWalletReady
  } = useGame();

  // Récupération de la liste des assets et des memes
  useEffect(() => {
    fetch("/api/assets")
      .then((res) => res.json())
      .then((data) => setAssetsList(data))
      .catch((err) => console.error("Erreur de chargement des assets.", err));
  }, []);

  useEffect(() => {
    fetch("/api/memes")
      .then((res) => res.json())
      .then((data) => setMemeList(data))
      .catch((err) => console.error("Erreur de chargement des memes", err));
  }, []);

  useEffect(() => {
    const currentToggle3DEffects = toggle3DEffects;

    const wasTempDisabled = sessionStorage.getItem('3d_temp_disabled') === 'true';
    if (wasTempDisabled) {
      currentToggle3DEffects();
      sessionStorage.removeItem('3d_temp_disabled');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // MAJ du currentIndex de pool si refreshCounter est appelé en dehors du composant Game
  useEffect(() => {
    if (!isGameStarted && preSignedPool && isWalletReady) {
      //syncPoolWithBlockchain();
    }
  }, [refreshCounter, preSignedPool, syncPoolWithBlockchain, isGameStarted, isWalletReady]);


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
        bringToFront(appName, apps);
        return apps;
      } else {
        const newApps = [...apps, appName];
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

    setMinimizedApps((prev) => {
      if (prev.includes(appName)) {
        return prev.filter((app) => app !== appName);
      }
      return prev;
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
        return <MemeGallery
          memeList={memeList}
          setSelectedMemeIndex={setSelectedMemeIndex}
        />;
      case "Assets":
        return <Assets
          assetsList={assetsList}
          setSelectedAssetsIndex={setSelectedAssetsIndex}
        />;
      case "Profile":
        return <Profile
          refreshCounter={refreshCounter}
          setRefreshCounter={setRefreshCounter}
        />;
      case "Game":
        // Plus besoin de passer toutes les props, le contexte s'en charge
        return <Game
          refreshCounter={refreshCounter}
          setRefreshCounter={setRefreshCounter}
        />;
      case "Shop":
        return <Shop
          refreshCounter={refreshCounter}
          setRefreshCounter={setRefreshCounter}
        />;
      case "Leaderboard":
        return <Leaderboard />;
      case "Settings":
        return <Settings
          setSound={setSound}
        />;
      case "Chill":
        return <Chill />;
      case "FAQ":
        return <FAQ />;
      case "DREAM":
        return <DREAM
          embeddedWallet={embeddedWallet}
          refreshCounter={refreshCounter} />;

      default:
        return null;
    }
  };

  const navButtonStyle = {
    background: "none",
    color: "white",
    fontSize: "clamp(1rem, 2vw, 2rem)",
    border: "none",
    cursor: "pointer",
    margin: "0 clamp(10px, 2vw, 20px)",
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

      <Icon
        name="dream"
        label={"DREAM"}
        src="/img/icons/dream.png"
        onClick={() => restoreApp("DREAM")}
        position={{ x: "12%", y: "26%" }}
      />

      {/* Affichage des memes plein écran */}
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
          <Image
            src={`/img/memes/${encodeURIComponent(memeList[selectedMemeIndex])}`}
            alt="Full meme"
            width={500}
            height={400}
            style={{
              maxHeight: "70%",
              maxWidth: "70%",
              borderRadius: "10px",
              boxShadow: "0 0 20px black",
              objectFit: "contain"
            }}
            priority={true} // Si c'est une image importante à charger rapidement
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
              bottom: "50px",
            }}
          >
            Download
          </a>
          <button onClick={(e) => { e.stopPropagation(); setSelectedMemeIndex((prev) => (prev + 1) % memeList.length); }} style={navButtonStyle}>▶</button>
        </div>
      )}

      {/* Affichage des assets plein écran */}
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
          <Image
            src={`/img/assets/${encodeURIComponent(assetsList[selectedAssetsIndex])}`}
            alt="Full asset"
            width={500}
            height={400}
            style={{
              maxHeight: "70%",
              maxWidth: "70%",
              borderRadius: "10px",
              boxShadow: "0 0 20px black",
              objectFit: "contain"
            }}
            priority={true} // Si c'est une image importante à charger rapidement
          />
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
          zIndex={appZIndices[appName] || 1}
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