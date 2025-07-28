import { useRef, useState, useEffect } from "react";
import Image from "next/image";

export default function RabbitImage({ isClicked }) {
    const [click, setClick] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [ripples, setRipples] = useState([]);
    const [isClickDisabled, setIsClickDisabled] = useState(false);
    const [imageSrc, setImageSrc] = useState('');
    const soundRef = useRef(null);
    const containerRef = useRef(null);

    const handleClick = (e) => {
        // Vérifier si les clics sont temporairement désactivés
        if (isClickDisabled) return;

        setClick(true);
        isClicked();

        // Désactiver les clics pendant 100ms pour éviter le spam
        setIsClickDisabled(true);
        setTimeout(() => {
            setIsClickDisabled(false);
        }, 100);

        // Jouer le son
        if (soundRef.current) {
            soundRef.current.currentTime = 0;
            soundRef.current.play().catch(() => { });
        }

        // Créer un effet de ripple à la position du clic
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newRipple = {
            id: Date.now(),
            x,
            y
        };

        setRipples(prev => [...prev, newRipple]);

        // Réinitialise après l'animation
        setTimeout(() => setClick(false), 300);

        // Supprimer le ripple après l'animation
        setTimeout(() => {
            setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
        }, 800);
    };

    useEffect(() => {
        // Initialize sound
        soundRef.current = new Audio(`/sounds/hit.mp3`);
        soundRef.current.volume = 0.4;
        soundRef.current.preload = 'auto';

        // Initialize image source once
        const index = Math.round(Math.random() * 10) % 4 + 1;
        setImageSrc(`/img/game/head${index}_.webp`);
    }, []);

    return (
        <>
            {/* Styles CSS globaux - déplacés en dehors du JSX */}
            <style jsx global>{`
                @keyframes ripple {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(8);
                        opacity: 0;
                    }
                }

                @keyframes sparkle {
                    0% {
                        transform: translate(-50%, -50%) rotate(0deg) translateY(-20px) scale(0);
                        opacity: 0;
                    }
                    20% {
                        opacity: 1;
                        transform: translate(-50%, -50%) rotate(0deg) translateY(-40px) scale(1);
                    }
                    100% {
                        transform: translate(-50%, -50%) rotate(0deg) translateY(-100px) scale(0);
                        opacity: 0;
                    }
                }

                @keyframes dotSparkle {
                    0% {
                        transform: translate(-50%, -50%) rotate(0deg) translateY(-15px) scale(0);
                        opacity: 0;
                    }
                    30% {
                        opacity: 1;
                        transform: translate(-50%, -50%) rotate(0deg) translateY(-30px) scale(1);
                    }
                    100% {
                        transform: translate(-50%, -50%) rotate(0deg) translateY(-70px) scale(0);
                        opacity: 0;
                    }
                }

                @keyframes starRotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes flashBurst {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0.8;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 0.4;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1.5);
                        opacity: 0;
                    }
                }

                @keyframes glow {
                    0% {
                        opacity: 0.3;
                        transform: scale(1);
                    }
                    100% {
                        opacity: 0.6;
                        transform: scale(1.05);
                    }
                }

                @keyframes bounce {
                    0%, 100% {
                        transform: translateY(0) scale(1) rotate(0deg);
                    }
                    25% {
                        transform: translateY(-12px) scale(1.05) rotate(1deg);
                    }
                    50% {
                        transform: translateY(-6px) scale(1.08) rotate(2deg);
                    }
                    75% {
                        transform: translateY(-3px) scale(1.06) rotate(1deg);
                    }
                }
            `}</style>

            <div
                ref={containerRef}
                className={`
                    w-64 h-64 relative z-10 select-none overflow-hidden
                    transition-all duration-300 ease-out
                    ${click
                        ? "-translate-y-3 scale-110 drop-shadow-2xl rotate-2"
                        : isHovered
                            ? "-translate-y-1 scale-105 drop-shadow-lg rotate-1"
                            : "drop-shadow-md"
                    }
                    hover:brightness-110
                    ${isClickDisabled ? 'cursor-wait' : 'cursor-pointer'}
                `}
                onPointerDown={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    filter: click ? 'brightness(1.2) contrast(1.1)' : 'none',
                    animation: click ? 'bounce 0.3s ease-out' : 'none'
                }}
            >
                {/* Image principale */}
                {imageSrc && (
                    <Image
                        src={imageSrc}
                        alt="Rabbit"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={`
        object-contain pointer-events-none
        transition-all duration-300 ease-out
        ${click ? 'animate-pulse' : ''}
    `}
                        draggable={false}
                        priority={true} // Image principale du jeu, importante à charger rapidement
                    />
                )}

                {/* Effets de ripple */}
                {ripples.map(ripple => (
                    <div
                        key={ripple.id}
                        className="absolute pointer-events-none"
                        style={{
                            left: ripple.x,
                            top: ripple.y,
                            transform: 'translate(-50%, -50%)',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                            animation: 'ripple 0.8s ease-out forwards'
                        }}
                    />
                ))}

                {/* Particules améliorées lors du clic */}
                {click && (
                    <>
                        {/* Étoiles principales */}
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={`star-${i}`}
                                className="absolute pointer-events-none"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                    width: '12px',
                                    height: '12px',
                                    transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-60px)`,
                                    animation: `sparkle 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards ${i * 0.05}s`
                                }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
                                        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                                        filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))',
                                        animation: 'starRotate 0.8s linear infinite'
                                    }}
                                />
                            </div>
                        ))}

                        {/* Particules secondaires (plus petites) */}
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={`dot-${i}`}
                                className="absolute pointer-events-none"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                    width: '6px',
                                    height: '6px',
                                    background: 'radial-gradient(circle, #ffffff, #ffd700)',
                                    borderRadius: '50%',
                                    transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-40px)`,
                                    animation: `dotSparkle 0.6s ease-out forwards ${i * 0.03}s`,
                                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.8), inset 0 0 4px rgba(255, 215, 0, 0.6)'
                                }}
                            />
                        ))}

                        {/* Effet de flash central */}
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                left: '50%',
                                top: '50%',
                                width: '100px',
                                height: '100px',
                                transform: 'translate(-50%, -50%)',
                                background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,215,0,0.4) 30%, transparent 70%)',
                                borderRadius: '50%',
                                animation: 'flashBurst 0.4s ease-out forwards'
                            }}
                        />
                    </>
                )}

                {/* Lueur de survol */}
                {isHovered && (
                    <div
                        className="absolute inset-0 pointer-events-none rounded-full"
                        style={{
                            background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
                            animation: 'glow 2s ease-in-out infinite alternate'
                        }}
                    />
                )}
            </div>
        </>
    );
}