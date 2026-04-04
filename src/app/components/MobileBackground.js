"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './MobileBackground.module.css';

export default function MobileBackground({ restoreApp, themeMode, showRabbit = true }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isWiggling, setIsWiggling] = useState(false);
    const [showMusicNote, setShowMusicNote] = useState(false);
    const [iconPositions, setIconPositions] = useState({});
    const [draggedIcon, setDraggedIcon] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [touchStartTime, setTouchStartTime] = useState(0);
    const [mouseStartPos, setMouseStartPos] = useState({ x: 0, y: 0 });
    const [mouseStartTime, setMouseStartTime] = useState(0);
    const musicRef = useRef(null);
    const touchStartTimeRef = useRef(0);
    const mouseStartTimeRef = useRef(0);


    useEffect(() => {
        // Animation d'entrée décalée
        const timer = setTimeout(() => setIsVisible(true), 500);

        // Initialiser les positions des icônes
        const initialPositions = {};
        socialLinks.forEach(link => {
            initialPositions[link.name] = { ...link.position };
        });
        setIconPositions(initialPositions);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const path =
            themeMode === 'light'
                ? '/sounds/harp_song.mp3'
                : '/sounds/mandolin_song.mp3';

        const preloadAudio = new Audio(path);
        preloadAudio.volume = 1;
        preloadAudio.load(); // Force le chargement
        musicRef.current = preloadAudio;
    }, [themeMode]);


    const socialLinks = [
        {
            name: "Quests",
            app: "Quests",
            src: "/img/icons/quests.png",
            color: "#5865f2",
            position: { top: "10%", left: "60%" }
        },
        {
            name: "Profile",
            app: "Profile",
            src: "/img/icons/profile.png",
            color: "#1da1f2",
            position: { top: "35%", right: "30%" }
        },
        {
            name: "Game",
            app: "Game",
            src: "/img/icons/game.png",
            color: "#ff6b6b",
            position: { top: "35%", left: "25%" }
        },
        {
            name: "Leaderboard",
            app: "Leaderboard",
            src: "/img/icons/leaderboard.png",
            color: "#ffe66d",
            position: { bottom: "40%", left: "10%" }
        },
        {
            name: "Settings",
            app: "Settings",
            src: "/img/icons/settings.png",
            color: "#a8e6cf",
            position: { bottom: "40%", right: "5%" }
        },
        {
            name: "Chat",
            app: "RabbitChat",
            src: "/img/icons/rabbitchat.png",
            color: "#ff9f43",
            label: "t",
            position: { bottom: "35%", left: "50%" }
        },
        {
            name: "FAQ",
            app: "FAQ",
            src: "/img/icons/faq.png",
            color: "#00b894",
            position: { bottom: "20%", right: "20%" }
        },
        {
            name: "Links",
            app: "Linktree",
            src: "/img/icons/link.png",
            color: "#8b5cf6",
            position: { top: "20%", left: "15%" }
        },
    ];

    // Fonction unifiée pour jouer le son
    const playSound = async () => {
        setIsWiggling(true);
        setShowMusicNote(true);

        setTimeout(() => {
            setIsWiggling(false);
            setShowMusicNote(false);
        }, 500);

        const audio = musicRef.current;
        if (!audio) return;

        try {
            audio.currentTime = 0;
            await audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    };


    // Gestion du lapin - Touch
    const handleRabbitTouchStart = (e) => {
        //e.preventDefault();
        //e.stopPropagation();
        // eslint-disable-next-line react-hooks/rules-of-hooks
        touchStartTimeRef.current = Date.now();
    };

    const handleRabbitTouchEnd = (e) => {
        //e.preventDefault();
        //e.stopPropagation();

        const touchDuration = Date.now() - touchStartTimeRef.current;
        // Seulement si c'est un tap rapide (moins de 300ms)
        if (touchDuration < 300) {
            playSound();
        }
    };

    // Gestion du lapin - Click (desktop uniquement)
    const handleRabbitClick = (e) => {
        // Empêcher le clic si c'est un événement tactile ou si on vient de faire un touch
        if (e.detail === 0 || Date.now() - touchStartTimeRef.current < 500) return;

        playSound();
    };

    // === GESTION DES ICÔNES ===

    // Touch events pour mobile
    const handleIconTouchStart = (e, iconName) => {
        //e.preventDefault();
        //e.stopPropagation();
        setDraggedIcon(iconName);
        setIsDragging(false);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        touchStartTimeRef.current = Date.now();

        const rect = e.currentTarget.getBoundingClientRect();
        const touch = e.touches[0];
        setDragOffset({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        });

        const target = e.currentTarget;
        target.classList.add(styles.dragging);
    };

    const handleIconTouchMove = (e) => {
        if (!draggedIcon) return;

        //e.preventDefault();
        setIsDragging(true);

        const touch = e.touches[0];
        const container = e.currentTarget.parentElement;
        const rect = container.getBoundingClientRect();

        const x = touch.clientX - rect.left - dragOffset.x;
        const y = touch.clientY - rect.top - dragOffset.y;

        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        const boundedX = Math.max(8, Math.min(92, xPercent));
        const boundedY = Math.max(8, Math.min(92, yPercent));

        setIconPositions(prev => ({
            ...prev,
            [draggedIcon]: {
                left: `${boundedX}%`,
                top: `${boundedY}%`
            }
        }));
    };

    const handleIconTouchEnd = (e) => {
        if (draggedIcon) {
            const target = e.currentTarget;
            target.classList.remove(styles.dragging);

            // Si pas de drag et tap rapide, ouvrir l'app
            if (!isDragging && Date.now() - touchStartTimeRef.current < 300) {
                setTimeout(() => {
                    handleLinkClick(socialLinks.find(link => link.name === draggedIcon)?.app);
                }, 50);
            }

            setDraggedIcon(null);
            setDragOffset({ x: 0, y: 0 });
            setIsDragging(false);
        }
    };

    // Mouse events pour desktop - VERSION CORRIGÉE
    const handleIconMouseDown = (e, iconName) => {
        //e.preventDefault();
        //e.stopPropagation();

        setDraggedIcon(iconName);
        setIsDragging(false);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        mouseStartTimeRef.current = Date.now();

        const rect = e.currentTarget.getBoundingClientRect();
        setMouseStartPos({ x: e.clientX, y: e.clientY });
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });

        // NE PAS ajouter la classe dragging ici - on attend de voir si c'est un vrai drag
    };

    const handleIconMouseMove = (e) => {
        if (!draggedIcon) return;

        //e.preventDefault();

        // Calculer la distance depuis le point de départ
        const distance = Math.sqrt(
            Math.pow(e.clientX - mouseStartPos.x, 2) +
            Math.pow(e.clientY - mouseStartPos.y, 2)
        );

        // Commencer le drag seulement si on a bougé de plus de 5 pixels
        if (distance > 5) {
            if (!isDragging) {
                setIsDragging(true);
                // Ajouter la classe dragging seulement maintenant
                const target = document.querySelector(`[data-icon="${draggedIcon}"]`);
                if (target) {
                    target.classList.add(styles.dragging);
                }
            }

            // Utiliser le container principal
            const container = document.querySelector(`.${styles.container}`);
            if (!container) return;

            const rect = container.getBoundingClientRect();

            const x = e.clientX - rect.left - dragOffset.x;
            const y = e.clientY - rect.top - dragOffset.y;

            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;

            const boundedX = Math.max(8, Math.min(92, xPercent));
            const boundedY = Math.max(8, Math.min(92, yPercent));

            setIconPositions(prev => ({
                ...prev,
                [draggedIcon]: {
                    left: `${boundedX}%`,
                    top: `${boundedY}%`
                }
            }));
        }
    };

    const handleIconMouseUp = (e) => {
        if (draggedIcon) {
            const target = e.currentTarget;
            target.classList.remove(styles.dragging);

            // Si pas de drag et clic rapide, ouvrir l'app
            if (!isDragging && Date.now() - mouseStartTimeRef.current < 300) {
                const app = socialLinks.find(link => link.name === draggedIcon)?.app;
                if (app) {
                    handleLinkClick(app);
                }
            }

            setDraggedIcon(null);
            setDragOffset({ x: 0, y: 0 });
            setMouseStartPos({ x: 0, y: 0 });
            setIsDragging(false);
        }
    };

    // Supprimer la fonction handleIconClick car elle n'est plus nécessaire

    // Fonction pour ouvrir l'application
    const handleLinkClick = (app) => {
        if (restoreApp) {
            restoreApp(app);
        }
    };

    // Événements globaux pour le drag desktop
    useEffect(() => {
        const handleGlobalMouseMove = (e) => {
            if (draggedIcon) {
                // Calculer la distance depuis le point de départ pour détecter un vrai drag
                const distance = Math.sqrt(
                    Math.pow(e.clientX - mouseStartPos.x, 2) +
                    Math.pow(e.clientY - mouseStartPos.y, 2)
                );

                // Commencer le drag seulement si on a bougé de plus de 5 pixels
                if (distance > 5) {
                    if (!isDragging) {
                        setIsDragging(true);
                        // Ajouter la classe dragging seulement maintenant
                        const target = document.querySelector(`[data-icon="${draggedIcon}"]`);
                        if (target) {
                            target.classList.add(styles.dragging);
                        }
                    }

                    // Utiliser directement la fonction avec l'événement global
                    const container = document.querySelector(`.${styles.container}`);
                    if (!container) return;

                    const rect = container.getBoundingClientRect();

                    const x = e.clientX - rect.left - dragOffset.x;
                    const y = e.clientY - rect.top - dragOffset.y;

                    const xPercent = (x / rect.width) * 100;
                    const yPercent = (y / rect.height) * 100;

                    const boundedX = Math.max(8, Math.min(92, xPercent));
                    const boundedY = Math.max(8, Math.min(92, yPercent));

                    setIconPositions(prev => ({
                        ...prev,
                        [draggedIcon]: {
                            left: `${boundedX}%`,
                            top: `${boundedY}%`
                        }
                    }));
                }
            }
        };

        const handleGlobalMouseUp = (e) => {
            if (draggedIcon) {
                const target = document.querySelector(`[data-icon="${draggedIcon}"]`);
                if (target) {
                    target.classList.remove(styles.dragging);
                }

                // Si pas de drag et clic dans les temps, ouvrir l'app
                if (!isDragging && Date.now() - mouseStartTimeRef.current < 300) {
                    const app = socialLinks.find(link => link.name === draggedIcon)?.app;
                    if (app) {
                        handleLinkClick(app);
                    }
                }

                setDraggedIcon(null);
                setDragOffset({ x: 0, y: 0 });
                setMouseStartPos({ x: 0, y: 0 });
                setIsDragging(false);
            }
        };

        if (draggedIcon) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [draggedIcon, dragOffset, mouseStartPos, mouseStartTime, isDragging]); // Ajout des dépendances manquantes

    // Nettoyage à la destruction du composant
    useEffect(() => {
        return () => {
            if (musicRef.current) {
                musicRef.current.pause();
                musicRef.current = null;
            }
        };
    }, []);

    return (
        <div
            className={`${styles.container} ${isVisible ? styles.visible : ''}`}
            onTouchStart={(e) => e}
        >
            {socialLinks.map((link, index) => (
                <button
                    key={link.name}
                    data-icon={link.name}
                    data-app={link.app}
                    className={`${styles.floatingLink} ${styles[themeMode]}`}
                    style={{
                        ...iconPositions[link.name] || link.position,
                        backgroundColor: link.color,
                        animationDelay: `${index * 0.2}s`,
                        position: 'fixed',
                        transform: 'translate(-50%, -50%)'
                    }}
                    // Events tactiles
                    onTouchStart={(e) => handleIconTouchStart(e, link.name)}
                    onTouchMove={handleIconTouchMove}
                    onTouchEnd={handleIconTouchEnd}
                    // Events souris - VERSION SIMPLIFIÉE
                    onMouseDown={(e) => handleIconMouseDown(e, link.name)}
                    onMouseMove={handleIconMouseMove}
                    onMouseUp={handleIconMouseUp}
                    title={link.name}
                >
                    <Image
                        src={link.src}
                        alt={link.name}
                        width={40}
                        height={40}
                        style={{ objectFit: 'contain', pointerEvents: 'none' }}
                    />
                </button>
            ))}

            {/* Lapin flottant au centre */}
            {showRabbit && (
                <div
                    className={`${styles.floatingRabbit} ${styles[themeMode]} ${isWiggling ? styles.wiggling : ''} noSelect`}
                    onClick={handleRabbitClick}
                    onTouchStart={handleRabbitTouchStart}
                    onTouchEnd={handleRabbitTouchEnd}
                    style={{ cursor: 'pointer' }}
                >
                    <Image
                        src={themeMode === 'light' ? "/img/rabbit_angel.webp" : "/img/rabbit_angel_sleeping.webp"}
                        alt="Rabbit angel"
                        width={themeMode === 'light' ? 300 : 250}
                        height={themeMode === 'light' ? 300 : 250}
                        draggable={false}
                    />

                    {/* Note de musique */}
                    {showMusicNote && (
                        <div className={`${styles.musicNote} ${styles[themeMode]}`}>
                            ♫
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
