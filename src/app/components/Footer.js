"use client";
import Image from "next/image";
import styles from "./Footer.module.css";
import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import WalletButton from "./WalletButton";
import AudioPlayer from "./AudioPlayer";
import { useTheme } from "@/context"; // Ajout de l'import pour le thème

export default function Footer({ visibleApps, setVisibleApps, appZIndices, setAppZIndices, openApp, volumePlayer }) {

  const [startOpen, setStartOpen] = useState(false);
  const menuRef = useRef(null);
  const { themeMode } = useTheme(); // Récupération du thème

  // Met à jour l'heure toutes les secondes
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };

    updateClock(); // initialise immédiatement
    const interval = setInterval(updateClock, 60000); // met à jour chaque minute

    return () => clearInterval(interval); // Nettoyage de l'interval

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
      document.addEventListener("mousedown", handleClickOutside, { passive: true });
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [startOpen]);

  return (
    <div className={styles.Footer} data-theme={themeMode}>
      <div className={styles.taskbarLeft}>
        {/* Logo sur la gauche */}
        <button className={styles.startButton} onClick={() => setStartOpen(!startOpen)}>
          <Image
            src={themeMode === 'light' ? "/img/logo.png" : "/img/logo_grey.png"}
            alt="Nav Logo"
            width={70}
            height={50}
            style={{ height: 'auto' }}
          />
        </button>

        {/* Menu de navigation */}
        {startOpen && (
          <div className={styles.startMenu} ref={menuRef}>
            <div className={styles.menuItem} onClick={() => { openApp("Game"); setStartOpen(false); }}>
              <Image src="/img/icons/game.png" alt="Game icon" width={30} height={30} className={styles.menuIcon} />
              Game
            </div>
            <div className={styles.menuItem} onClick={() => { openApp("RabbitChat"); setStartOpen(false); }}>
              <Image src="/img/icons/rabbitchat.png" alt="RabbitChat icon" width={30} height={30} className={styles.menuIcon} />
              RabbitChat
            </div>
            <div className={styles.menuItem} onClick={() => { openApp("Quests"); setStartOpen(false); }}>
              <Image
                src="/img/icons/quests.png"
                alt="Quests icon"
                width={30}
                height={30}
                className={styles.menuIcon}
                style={{ height: 'auto' }}
              />
              Quests
            </div>
            <hr className={styles.menuDivider} />
            <div className={styles.menuItem} onClick={() => { openApp("Profile"); setStartOpen(false); }}>
              <Image src="/img/icons/profile.png" alt="Profile icon" width={30} height={30} className={styles.menuIcon} />
              Profile
            </div>
            <div className={styles.menuItem} onClick={() => { openApp("Leaderboard"); setStartOpen(false); }}>
              <Image src="/img/icons/leaderboard.png" alt="Leaderboard icon" width={30} height={30} className={styles.menuIcon} />
              Leaderboard
            </div>
            <div className={styles.menuItem} onClick={() => { openApp("Settings"); setStartOpen(false); }}>
              <Image src="/img/icons/settings.png" alt="Settings icon" width={30} height={30} className={styles.menuIcon} />
              Settings
            </div>
            <hr className={styles.menuDivider} />
            <div className={styles.menuItem} onClick={() => { openApp("About"); setStartOpen(false); }}>
              <Image src="/img/icons/about.png" alt="About icon" width={30} height={30} className={styles.menuIcon} />
              About
            </div>
            <div className={styles.menuItem} onClick={() => { openApp("Roadmap"); setStartOpen(false); }}>
              <Image src="/img/icons/roadmap.png" alt="Roadmap icon" width={30} height={30} className={styles.menuIcon} />
              Roadmap
            </div>
            <div className={styles.menuItem} onClick={() => { openApp("Memes"); setStartOpen(false); }}>
              <Image src="/img/icons/memes.png" alt="Meme icon" width={30} height={30} className={styles.menuIcon} />
              Memes
            </div>
            <div className={styles.menuItem} onClick={() => { openApp("Assets"); setStartOpen(false); }}>
              <Image src="/img/icons/assets.png" alt="Assets icon" width={30} height={30} className={styles.menuIcon} />
              Assets
            </div>
            <div className={styles.menuItem} onClick={() => { openApp("Linktree"); setStartOpen(false); }}>
              <Image src="/img/icons/link.png" alt="Linktree icon" width={30} height={30} className={styles.menuIcon} />
              Linktree
            </div>
            <div className={styles.menuItem} onClick={() => { openApp("Chill"); setStartOpen(false); }}>
              <Image src="/img/icons/chill.png" alt="Nothing icon" width={30} height={30} className={styles.menuIcon} />
              Chill
            </div>
            <hr className={styles.menuDivider} />
          </div>
        )}

        {/* Barre indiquant qu'une fenêtre est ouverte */}
        {visibleApps.length > 0 && (
          <div className={styles.taskbarApps}>
            {visibleApps.map((appName) => (
              <div
                key={appName}
                className={styles.taskbarAppButton}
                onClick={() => openApp(appName)}
              >
                {appName}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Icônes de réseaux sociaux sur la droite */}
      <div className={styles.taskbarRight}>
        <div className={styles.socialIcons}>
          <a href="https://x.com/digitrabbits" target="_blank" rel="noopener noreferrer">
            <Image src="/img/icons/x-icon.png" alt="Twitter" width={20} height={20} />
          </a>
          <a href="https://t.me/digitrabbitsHQ" target="_blank" rel="noopener noreferrer">
            <Image src="/img/icons/telegram-icon.png" alt="Telegram" width={20} height={20} />
          </a>
          <a href="https://www.megaeth.com/" target="_blank" rel="noopener noreferrer">
            <Image src="/img/icons/megaeth.ico" alt="MegaETH" width={21} height={21} />
          </a>
        </div>
        <AudioPlayer src="/sounds/soundtrack.mp3" volumePlayer={volumePlayer} />
        <WalletButton />
        <span className={styles.clock}>{time}</span>
      </div>
    </div>
  );
}
