"use client";

import { useState, useEffect } from "react";
import styles from "./MainPage.module.css";
import Icon from "./Icon";
import Footer from "./Footer";
import MemeGallery from "./MemeGallery";
import AudioPlayer from "./AudioPlayer";
import SunlightEffect from "./SunlightEffect";
import Profile from "./Profile"; 

export default function MainPage() {

  const [visibleApps, setVisibleApps] = useState([""]);

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
  

  function useWindowSize() {
    const [size, setSize] = useState({ width: 0 });
  
    useEffect(() => {
      // Ne s'exécute que côté client
      const handleResize = () => {
        setSize({ width: window.innerWidth });
      };
  
      handleResize(); // initialise la taille
  
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);
  
    return size;
  }

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
    <div className={styles.background}>
      <img src="/img/bg-img-mobile.png" alt="Mobile image" className={styles.mobileImage} />
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
        position={{ x: -140, y: "250px" }} // Spécifie la position de l'icône
      />
      <Icon
        name="Leaderboard"
        src="/img/icons/leaderboard.png"
        label="Leaderboard"
        onClick={() => restoreApp("Music")}
        position={{ x: -140, y: "75%" }} // Spécifie la position de l'icône
      />
      <Icon
        name="Game"
        src="/img/icons/game.png"
        label="Game"
        onClick={() => restoreApp("Music")}
        position={{ x: -100, y: 180 }} // Spécifie la position de l'icône
      />

      {/*<Icon
        name="Nothing"
        src="/img/settings-icon.png"
        label="Nothing"
        onClick={() => restoreApp("")}
        position={{ x: 0, y: 0 }} // Spécifie la position de l'icône
      />*/}

      <Icon
        name="digit-head"
        src="/3d/head" // déclenche l'affichage 3D
        position={{ x: `${width - 650}px`, y: "1%" }}
        onClick={() => console.log("Clicked 3D icon")}
      />


      {/* Fenêtre Home */}
      {visibleApps.includes("Home") && (
        <div
          className={styles.window}
          width="400"
          height="300"
        >
        <div className="title-bar">
          <span>Welcome to Digit Rabbits</span>
          <div className="title-bar-controls">
            <button
              onClick={() =>
                setVisibleApps((apps) => apps.filter((app) => app !== "Home"))
              }
              aria-label="Close"
            ></button>
          </div>
        </div>
        <div className="window-body">
          <p style={{ margin: 0, padding: 10, color: "black" }}>
            <span style={{ fontWeight: "bold" }}>Digit Rabbit</span> aims to provide a Rabbitio experience through <span style={{ fontWeight: "bold" }}>MegaETH</span>. 
              Choose from which side you want to be, help your <span style={{ fontWeight: "bold" }}>digital rabbit</span> to win the game and receive a famous WL!
          </p>
          <h5 style={{ margin: 0, padding: 10, color: "black", textAlign: "center", fontWeight: "bold" }}>What is a &quot;digital rabbit&quot; ?</h5>
          <p style={{ margin: 0, padding: 10, color: "black" }}>
            This is your avatar in the game, which will evolve depending on your actions.
            <br />
            The more you play and interact with the Rabbitio community, the more your RabbitScore will be better and bring you rewards 👀
          </p>
          <h5 style={{ margin: 0, padding: 10, color: "black", textAlign: "center", fontWeight: "bold" }}>Get ready to play our game which shows the MegaETH capabilities</h5>
          <p style={{ margin: 0, padding: 10, color: "black" }}>We want to create a strong community dedicated to Rabbitio, which can land and evolve on MegaETH by showing to the entire world how we can combine NFT, gaming and community!</p>
          <p style={{ margin: 0, padding: 10, color: "black" }}>Be ready to CLICK very very rabbitio much on the nice and beautiful Rabbihead surrounding the Rabbitio World, each day there will be opportunities to make the MOST transactions you can to FEED your &quot;digital rabbit&quot;.</p>
          <p style={{ margin: 0, padding: 10, color: "black" }}>Be ready, we say it again, be ready, our rabbitio AI model will track your activity daily and update your Rabbitscore.</p>
          
          <h5 style={{ margin: 0, padding: 10, color: "black", textAlign: "center", fontWeight: "bold" }}>Don&apos;t understand ?</h5>
          <p style={{ margin: 0, padding: 10, color: "black" }}>No one cares. Just be ready to click and enjoy the game.</p>
          <p style={{ margin: 0, padding: 10, color: "black" }}>A leaderboard will shows the best players for sure, but stay focus on yourself degen buddy because WL are limited and only the best one will get it.</p>
          <p style={{ margin: 0, padding: 10, color: "black", textAlign: "center", fontStyle: "italic" }}>RABBITIOOOO</p>
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

      <SunlightEffect />
      <Footer visibleApps={visibleApps} setVisibleApps={setVisibleApps} />
    </div>
  );
}
