"use client";

import { useState, useEffect } from "react";
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
import EventToast from './EventToast';


export default function MainPage() {

  const [visibleApps, setVisibleApps] = useState([]);
  const [appZIndices, setAppZIndices] = useState({});
  const [focusedApp, setFocusedApp] = useState(null);
  const [zCounter, setZCounter] = useState(1); // zIndex de départ

  const [sound, setSound] = useState("crying");
  const { themeMode, toggleTheme } = useTheme();
  const { width } = useWindowSize();

  const [selectedMemeIndex, setSelectedMemeIndex] = useState(null);
  const [memeList, setMemeList] = useState([]);
  // Setter timer jeu
  const [isTimeExpired, setIsTimeExpired] = useState(true);
  const [isGameStarted, setIsGameStarted] = useState(false)

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
      case "Home":
        return <About />;
      case "Memes":
        return <MemeGallery memeList={memeList} setMemeList={setMemeList} setSelectedMemeIndex={setSelectedMemeIndex}/>;
      case "Profile":
        return <Profile />;
      case "Game":
        return <Game isTimeExpired={isTimeExpired} setIsTimeExpired={setIsTimeExpired} isGameStarted={isGameStarted} setIsGameStarted={setIsGameStarted} sound={sound} themeMode={themeMode} />;
      case "Shop":
        return <Shop />;
      case "Leaderboard":
        return <Leaderboard />;
      case "Settings":
        return <Settings />;
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
        name="Home"
        src="/img/icons/about.png"
        label="About"
        onClick={() => restoreApp("Home")}
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
        position={{ x: -140, y: "70%" }} // Spécifie la position de l'icône
      />
      <Icon
        name="Game"
        src="/img/icons/game.png"
        label="Game"
        onClick={() => restoreApp("Game")}
        position={{ x: -100, y: "35%" }} // Spécifie la position de l'icône
      />

      {/*<Icon
        name="Nothing"
        src="/img/settings-icon.png"
        label="Nothing"
        onClick={() => restoreApp("")}
        position={{ x: 0, y: 0 }} // Spécifie la position de l'icône
      />*/}


      <Icon
        name="Shop"
        label="Shop"
        src="/img/icons/shop.png" 
        position={{ x: -100, y: "50%" }} // Spécifie la position de l'icône
      />

      <Icon
        name="digit-head"
        src="/3d/head" // déclenche l'affichage 3D
        position={{ x: `${width - 690}px`, y: "1%" }}
        sound={sound}
        themeMode={themeMode}
      />

      <Icon
        name="settings"
        label={"Settings"}
        src="/img/icons/settings.png" 
        onClick={() => restoreApp("Settings")}
        position={{ x: -150, y: "30%" }}
      />


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


      {visibleApps.map((appName) => (
        <DraggableWindow
          key={appName}
          title={appName}
          onClose={() => handleClose(appName)}
          zIndex={appZIndices[appName] || 1}  // <-- ici !
          onFocus={() => bringToFront(appName)}
          theme={themeMode}
          visibleApps={visibleApps}
        >
          {renderAppContent(appName)}
        </DraggableWindow>
      ))}

      <EventToast isTimeExpired={isTimeExpired} setIsTimeExpired={setIsTimeExpired} setIsGameStarted={setIsGameStarted} />
      <BackgroundSwitcher />
      <Footer visibleApps={visibleApps} setVisibleApps={setVisibleApps} appZIndices={appZIndices} setAppZIndices={setAppZIndices} openApp={restoreApp} />
    </div>
  );
}
