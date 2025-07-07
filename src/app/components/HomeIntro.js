"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./HomeIntro.module.css";
import Image from "next/image";

export default function HomeIntro({ onEnter }) {
  const [fadingOut, setFadingOut] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Cette ligne est exécutée uniquement côté client
    audioRef.current = new Audio("/sounds/enter.mp3");
    audioRef.current.volume = 0.2; // facultatif : volume réduit
  }, []);

  const handleClick = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
    setFadingOut(true);
    setTimeout(() => {
      onEnter();
    }, 1000); // Durée de la transition
  };

  return (
    <div className={`${styles.intro} ${fadingOut ? styles.fadeOut : ""}`}>
      <div className={styles.logoContainer}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              transform: `translateZ(${i}px)`,
              opacity: i === 0 ? 1 : 1,
            }}
          >
            <Image
              src="/img/logo_grey.png"
              alt="Animated DigitRabbit"
              fill
              style={{ objectFit: "contain" }}
              sizes={styles.logoContainer}
              priority
            />
          </div>
        ))}
      </div>
      <button className={styles.enterButton} onClick={handleClick}>
        Enter to the DigitRabbit universe
      </button>
    </div>

  );
}
