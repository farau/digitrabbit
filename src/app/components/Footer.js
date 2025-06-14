"use client";
import Image from "next/image";
import styles from "./Footer.module.css";
import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import WalletButton from "./WalletButton";
import AudioPlayer from "./AudioPlayer";

export default function Footer({ visibleApps, setVisibleApps }) {

  const [startOpen, setStartOpen] = useState(false);
  const menuRef = useRef(null);

  // Met à jour l'heure toutes les secondes
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };

    updateClock(); // initialise immédiatement
    const interval = setInterval(updateClock, 60000); // met à jour chaque minute

  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setStartOpen(false);
      }
    }
    // Ajoute un écouteur d'événement pour détecter les clics en dehors du menu
    // et fermer le menu si c'est le cas
    if (startOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [startOpen]);

  const openApp = (appName) => {
    setVisibleApps((apps) => [...new Set([appName])]);
    setStartOpen(false); // Ferme le menu après avoir ouvert une app
  };
  


  return (
    <div className={styles.Footer}>
      <div className={styles.taskbarLeft}>
        {/* Logo sur la gauche */}
        <button className={styles.startButton} onClick={() => setStartOpen(!startOpen)}>
          <Image src="/img/logo.png" alt="Nav Logo" width={70} height={50} />
        </button>

        {/* Menu de navigation */}
        {startOpen && (
          <div className={styles.startMenu} ref={menuRef}>
            <div className={styles.menuItem} onClick={() => openApp("Home")}><Image src="/img/icons/about.png" alt="About icon" width={30} height={30} /> About</div>
            <div className={styles.menuItem} onClick={() => openApp("Memes")}><Image src="/img/icons/memes.png" alt="Meme icon" width={30} height={30} /> Memes</div>
            <hr className={styles.menuDivider} />
            <div className={styles.menuItem} onClick={() => openApp("Profile")}><Image src="/img/icons/profile.png" alt="Profile icon" width={30} height={30} /> Profile</div>
            <div className={styles.menuItem} onClick={() => openApp("Game")}><Image src="/img/icons/game.png" alt="Game icon" width={30} height={30} /> Game</div>
            <div className={styles.menuItem} onClick={() => openApp("Shop")}><Image src="/img/icons/shop.png" alt="Shop icon" width={30} height={30} /> Shop</div> 
            <hr className={styles.menuDivider} />
            <div className={styles.menuItem} onClick={() => openApp("Leaderboard")}><Image src="/img/icons/leaderboard.png" alt="Leaderboard icon" width={30} height={30} /> Leaderboard</div>   
            {/* Ajoute d'autres apps ici */}
            <hr className={styles.menuDivider} />
            <div className={styles.menuItem} onClick={() => openApp("Settings")}><Image src="/img/icons/settings.png" alt="Settings icon" width={30} height={30} /> Settings</div>   
            
          </div>
        )}
        <div className={styles.socialIcons}>
          <a href="https://x.com/digitrabbits" target="_blank" rel="noopener noreferrer">
            <Image src="/img/icons/x-icon.png" alt="Twitter" width={20} height={20} />
          </a>
          <a href="https://t.me/digitrabbitsHQ" target="_blank" rel="noopener noreferrer">
            <Image src="/img/icons/telegram-icon.png" alt="Telegram" width={20} height={20} />
          </a>
        </div>

      </div>
      {/* Icônes de réseaux sociaux sur la droite */} 
      <div className={styles.taskbarRight}>
        <AudioPlayer src="/sounds/soundtrack.mp3" />
        <WalletButton />
        <span className={styles.clock}>{time}</span>
      </div>
    </div>
  );
}
