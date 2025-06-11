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
import Shop from "./Shop";
import Game from "./Game";

export default function MainPage() {

  const [visibleApps, setVisibleApps] = useState([""]);
  const [isDay, setIsDay] = useState(true);
  const [sound, setSound] = useState("crying");

  function BackgroundSwitcher() {
  
    return (
      <>
        {isDay ? <BackgroundEffect /> : <BackgroundEffect mode="moon" />}
      </>
    );
  }

  const restoreApp = (appName) => {
    setVisibleApps(() => [appName]);
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
  

  const { width } = useWindowSize();
  
  // Gestion des memes sélectionnés
  const [memeList, setMemeList] = useState([]);
  const [selectedMemeIndex, setSelectedMemeIndex] = useState(null);

  // Récupération de la liste des memes
  // (en supposant que l'API renvoie un tableau de noms de fichiers)  
  // (ex: ["meme1.jpg", "meme2.jpg", ...])
  useEffect(() => {
    fetch("/api/memes")
      .then((res) => res.json())
      .then((data) => setMemeList(data))
      .catch((err) => console.error("Erreur de chargement des memes", err));
  }, []);

  return (
    <div className={`${isDay ? styles.bgDay : styles.bgNight}`}>
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
        onClick={() => restoreApp("Shop")}
        position={{ x: -100, y: "50%" }} // Spécifie la position de l'icône
      />

      <Icon
        name="digit-head"
        src="/3d/head" // déclenche l'affichage 3D
        position={{ x: `${width - 690}px`, y: "1%" }}
        sound={sound}
      />

      <Icon
        name="settings"
        label={"Settings"}
        src="/img/icons/settings.png" 
        onClick={() => restoreApp("Settings")}
        position={{ x: -150, y: "30%" }}
      />

      {/* Fenêtre Home */}
      {visibleApps.includes("Home") && (
        <div
          className={styles.window}
        >
        <div className="title-bar sticky">
          <span>About our collection</span>
          <div className="title-bar-controls">
            <button
              onClick={() =>
                setVisibleApps((apps) => apps.filter((app) => app !== "Home"))
              }
              aria-label="Close"
            ></button>
          </div>
        </div>
          
        <div className="window-body" style={{ overflowY: "auto", height: "calc(100% - 30px)", padding: "10px" }}>
            <About />
        </div>
      </div> 
      )}

      {/* Fenêtre Memes */}
      {visibleApps.includes("Memes") && (
        <div
          className={styles.window}
        >
        <div className="title-bar sticky">
          <span>Memes collection</span>
          <div className="title-bar-controls">
            <button
              onClick={() =>
                setVisibleApps((apps) => apps.filter((app) => app !== "Memes"))
              }
              aria-label="Close"
            ></button>
          </div>
        </div>
          
        <div className="window-body" style={{ overflowY: "auto", height: "calc(100% - 30px)", padding: "10px" }}>
          <p style={{
            margin: 0,
            padding: 10,
            color: "black",
            textAlign: "center",
            fontStyle: "italic"
          }}>
            &quot;You&apos;re gonna see too much memes, you may even get tired of seeing them and you will say PLEASE PLEASE it&apos;s too much RABBITIOOOO&quot;
          </p>

            <MemeGallery memeList={memeList} setSelectedMemeIndex={setSelectedMemeIndex}/>
        </div>
      </div>    
      )}

      {/*Affichage du meme sélectionné*/}  
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
            zIndex: 9999,
          }}
          onClick={() => setSelectedMemeIndex(null)} // Fermer en cliquant hors navigation
        >
          {/* Navigation gauche */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMemeIndex((prev) => (prev > 0 ? prev - 1 : memeList.length - 1));
            }}
            style={navButtonStyle}
          >
            ◀
          </button>

          {/* Image en grand */}
          <img
            src={`img/memes/${encodeURIComponent(memeList[selectedMemeIndex])}`}
            alt="Full meme"
            style={{
              maxHeight: "70%",
              maxWidth: "70%",
              borderRadius: "10px",
              boxShadow: "0 0 20px black",
            }}
          />

          {/* Navigation droite */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMemeIndex((prev) => (prev + 1) % memeList.length);
            }}
            style={navButtonStyle}
          >
            ▶
          </button>
        </div>
      )}

      {/* Fenêtre Profile */}
      {visibleApps.includes("Profile") && (
        <div
          className={styles.window}

        >
        <div className="title-bar sticky">
          <span>Profile</span>
          <div className="title-bar-controls">
            <button
              onClick={() =>
                setVisibleApps((apps) => apps.filter((app) => app !== "Profile"))
              }
              aria-label="Close"
            ></button>
          </div>
        </div>
          
        <div className="window-body" style={{ overflowY: "auto", height: "calc(100% - 30px)", padding: "10px" }}>
            <Profile />
        </div>
      </div>    
      )}

      {/* Fenêtre Settings */}
      {visibleApps.includes("Settings") && (
        <div
          className={styles.window}

        >
        <div className="title-bar sticky">
          <span>Settings</span>
          <div className="title-bar-controls">
            <button
              onClick={() =>
                setVisibleApps((apps) => apps.filter((app) => app !== "Settings"))
              }
              aria-label="Close"
            ></button>
          </div>
        </div>
          
        <div className="window-body" style={{ overflowY: "auto", height: "calc(100% - 30px)", padding: "10px" }}>
            <Settings dayMode={isDay} setDayMode={setIsDay} sound={sound} setSound={setSound} />
        </div>
      </div>    
      )}  

      {/* Fenêtre Game */}
      {visibleApps.includes("Game") && (
        <div
          className={styles.window}

        >
        <div className="title-bar sticky">
          <span>Game</span>
          <div className="title-bar-controls">
            <button
              onClick={() =>
                setVisibleApps((apps) => apps.filter((app) => app !== "Game"))
              }
              aria-label="Close"
            ></button>
          </div>
        </div>
          
        <div className="window-body" style={{ overflowY: "auto", height: "calc(100% - 30px)", padding: "10px" }}>
            <Game />
        </div>
      </div>    
      )}

      {/* Fenêtre Shop */}
      {visibleApps.includes("Shop") && (
        <div
          className={styles.window}

        >
        <div className="title-bar sticky">
          <span>Shop</span>
          <div className="title-bar-controls">
            <button
              onClick={() =>
                setVisibleApps((apps) => apps.filter((app) => app !== "Shop"))
              }
              aria-label="Close"
            ></button>
          </div>
        </div>
          
        <div className="window-body" style={{ overflowY: "auto", height: "calc(100% - 30px)", padding: "10px" }}>
            <Shop />
        </div>
      </div>    
      )}

      {/* Fenêtre Leaderboard */}
      {visibleApps.includes("Leaderboard") && (
        <div
          className={styles.window}

        >
        <div className="title-bar sticky">
          <span>Leaderboard</span>
          <div className="title-bar-controls">
            <button
              onClick={() =>
                setVisibleApps((apps) => apps.filter((app) => app !== "Leaderboard"))
              }
              aria-label="Close"
            ></button>
          </div>
        </div>
          
        <div className="window-body" style={{ overflowY: "auto", height: "calc(100% - 30px)", padding: "10px" }}>
            <Leaderboard />
        </div>
      </div>    
      )}

      <BackgroundSwitcher />
      <Footer visibleApps={visibleApps} setVisibleApps={setVisibleApps} />
    </div>
  );
}
