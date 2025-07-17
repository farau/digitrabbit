'use client';

import Draggable from 'react-draggable';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import styles from './DraggableWindow.module.css';

export default function DraggableWindow({
  title,
  onClose,
  children,
  theme,
  zIndex,
  onFocus,
  visibleApps = [],
  littleWindow = false,
  onMinimize,
  isMinimized = false
}) {
  const nodeRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationState, setAnimationState] = useState('normal'); // 'normal', 'minimizing', 'minimized'

  // Calculs mémorisés
  const windowDimensions = useMemo(() => {
    const width = littleWindow ? 300 : Math.min(screenSize.width * 0.9, 600);
    const height = 300;
    return { width, height };
  }, [littleWindow, screenSize.width]);

  const isMobile = useMemo(() => {
    // Détection combinée : taille d'écran ET capacité tactile
    const isSmallScreen = screenSize.width < 480;
    const hasTouchCapability = typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    // On considère comme mobile seulement si c'est un petit écran ET qu'il y a du tactile
    return isSmallScreen && hasTouchCapability;
  }, [screenSize.width]);

  // Position centrée calculée
  const getCenteredPosition = useCallback(() => {
    const { width, height } = windowDimensions;
    const index = visibleApps.length;
    const spacing = 30;

    const baseX = (screenSize.width - width) / 2;
    const baseY = (screenSize.height - height) * 0.1;

    if (isMobile) {
      return { x: 0, y: Math.max(0, baseY) };
    }

    if (index > 0) {
      // Calculer un offset équilibré autour du centre
      const offsetIndex = index - 1; // ex : pour 3 apps → 0,1,2
      const middleIndex = (visibleApps.length - 1) / 2; // ex : 1 si 3 apps
      const offsetX = (offsetIndex - middleIndex) * spacing;
      const offsetY = (offsetIndex - middleIndex) * spacing;

      const newX = baseX + offsetX;
      const newY = baseY + offsetY;

      return {
        x: Math.max(0, Math.min(newX, screenSize.width - width)),
        y: Math.max(0, Math.min(newY, screenSize.height - height)),
      };
    }

    return { x: Math.max(0, baseX), y: Math.max(0, baseY) };
  }, [windowDimensions, screenSize, isMobile, visibleApps.length]);

  // Contraindre la position dans les limites de l'écran
  const constrainPosition = useCallback((pos) => {
    const { width, height } = windowDimensions;
    return {
      x: Math.max(0, Math.min(pos.x, screenSize.width - width)),
      y: Math.max(0, Math.min(pos.y, screenSize.height - height))
    };
  }, [windowDimensions, screenSize]);

  // Initialisation de la taille d'écran
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  // Gestion du redimensionnement
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const newSize = { width: window.innerWidth, height: window.innerHeight };
      setScreenSize(newSize);
      setPosition(prev => constrainPosition(prev));
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [screenSize]);

  // Positionnement initial
  useEffect(() => {
    if (screenSize.width > 0) {
      const newPosition = getCenteredPosition();
      setPosition(constrainPosition(newPosition));
    }
  }, [screenSize.width]);

  // Gestion des états de minimisation
  useEffect(() => {
    if (isMinimized) {
      setAnimationState('minimized');
    } else if (animationState === 'minimized') {
      setAnimationState('normal');
    }
  }, [isMinimized, animationState]);

  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e, data) => {
    if (!isMinimized && animationState === 'normal') {
      setPosition({ x: data.x, y: data.y });
    }
  }, [isMinimized, animationState]);

  const handleStart = useCallback(() => {
    if (animationState === 'normal') {
      setIsDragging(true);
      if (onFocus) onFocus();
    }
  }, [onFocus, animationState]);

  const handleStop = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMinimize = useCallback(() => {
    if (onMinimize && animationState === 'normal') {
      setIsAnimating(true);
      setAnimationState('minimizing');

      setTimeout(() => {
        onMinimize();
        setIsAnimating(false);
      }, 300);
    }
  }, [onMinimize, animationState]);

  // Calcul des styles d'animation avec effet fade
  const getAnimationStyles = useCallback(() => {
    const baseStyles = {
      zIndex: zIndex,
      width: littleWindow ? '300px' : undefined,
      pointerEvents: (isMinimized || animationState === 'minimizing') ? 'none' : 'auto',
      transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    };

    // Effet fade avec légère réduction et flou
    if (animationState === 'minimizing' || isMinimized) {
      return {
        ...baseStyles,
        transform: 'scale(0.8) translateY(20px)',
        opacity: 0,
        filter: 'blur(2px)'
      };
    }

    // État normal
    return {
      ...baseStyles,
      transform: 'scale(1)',
      opacity: 1,
      filter: 'none'
    };
  }, [
    zIndex,
    littleWindow,
    isMinimized,
    animationState,
    isDragging
  ]);

  // Styles des boutons adaptés au mobile
  const getButtonStyles = useCallback((isCloseButton = false) => {
    const baseStyles = {
      padding: '2px 6px',
      fontSize: '12px',
      fontWeight: 'bold',
      border: '1px outset #c0c0c0',
      background: animationState === 'minimizing' ? '#a0a0a0' : '#c0c0c0',
      cursor: animationState === 'minimizing' ? 'default' : 'pointer',
      fontFamily: 'Pixelated MS Sans Serif, sans-serif',
      lineHeight: '1',
      minWidth: '16px',
      height: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: animationState === 'minimizing' ? '#666' : 'black',
      opacity: animationState === 'minimizing' ? 0.6 : 1,
      // Styles spécifiques mobile
      ...(isMobile && {
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent'
      })
    };

    // Ajustement spécifique pour le bouton de fermeture
    if (isCloseButton) {
      return {
        ...baseStyles,
        background: animationState === 'minimizing' ? '#a0a0a0' : '#c0c0c0'
      };
    }

    return {
      ...baseStyles,
      background: animationState !== 'normal' ? '#a0a0a0' : '#c0c0c0',
      cursor: animationState !== 'normal' ? 'default' : 'pointer',
      color: animationState !== 'normal' ? '#666' : 'black',
      opacity: animationState !== 'normal' ? 0.6 : 1
    };
  }, [isMobile, animationState]);

  // Gestionnaires d'événements améliorés pour mobile
  const handleButtonPress = useCallback((e, isActive) => {
    if (isActive) {
      e.target.style.border = '1px inset #c0c0c0';
    }
  }, []);

  const handleButtonRelease = useCallback((e, isActive) => {
    if (isActive) {
      e.target.style.border = '1px outset #c0c0c0';
    }
  }, []);

  // Gestionnaires tactiles pour mobile
  const handleTouchMinimize = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (animationState === 'normal') {
      handleMinimize();
    }
  }, [animationState, handleMinimize]);

  const handleTouchClose = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (animationState !== 'minimizing') {
      onClose();
    }
  }, [animationState, onClose]);

  // Détection si l'événement vient d'un touch ou d'une souris
  const isTouchEvent = useCallback((e) => {
    return e.type.startsWith('touch') || (e.nativeEvent && e.nativeEvent.sourceCapabilities && e.nativeEvent.sourceCapabilities.firesTouchEvents);
  }, []);

  // État pour éviter les doubles actions (touch + click)
  const [touchHandled, setTouchHandled] = useState(false);

  // Éviter le rendu si pas encore initialisé
  if (screenSize.width === 0) {
    return null;
  }

  return (
    <Draggable
      bounds="parent"
      handle=".titleBar"
      nodeRef={nodeRef}
      position={position}
      onDrag={handleDrag}
      onStart={handleStart}
      onStop={handleStop}
      disabled={isMinimized || animationState !== 'normal'}
    >
      <div
        ref={nodeRef}
        style={getAnimationStyles()}
        className={`${theme === 'dark' ? styles.darkMode : styles.lightMode}`}
      >
        <div className={`titleBar ${styles.titleBar} ${styles.stickyTop}`}>
          <span>{title}</span>
          <div className={styles.titleBarControls} style={{ gap: isMobile ? '8px' : '2px' }}>
            {onMinimize && (
              <button
                onClick={(e) => {
                  // Éviter l'action si déjà gérée par touch
                  if (!touchHandled) {
                    handleMinimize();
                  }
                  setTouchHandled(false);
                }}
                aria-label="Minimize the window"
                disabled={animationState !== 'normal'}
                style={getButtonStyles()}
                onMouseDown={(e) => handleButtonPress(e, animationState === 'normal')}
                onMouseUp={(e) => handleButtonRelease(e, animationState === 'normal')}
                onMouseLeave={(e) => handleButtonRelease(e, animationState === 'normal')}
                onTouchStart={(e) => {
                  handleButtonPress(e, animationState === 'normal');
                }}
                onTouchEnd={(e) => {
                  handleButtonRelease(e, animationState === 'normal');
                  // Toujours gérer le touch, marquer comme traité
                  setTouchHandled(true);
                  handleTouchMinimize(e);
                }}
              >
                −
              </button>
            )}
            <button
              onClick={(e) => {
                // Éviter l'action si déjà gérée par touch
                if (!touchHandled) {
                  onClose();
                }
                setTouchHandled(false);
              }}
              aria-label="Close the window"
              disabled={animationState === 'minimizing'}
              style={getButtonStyles(true)}
              onMouseDown={(e) => handleButtonPress(e, animationState !== 'minimizing')}
              onMouseUp={(e) => handleButtonRelease(e, animationState !== 'minimizing')}
              onMouseLeave={(e) => handleButtonRelease(e, animationState !== 'minimizing')}
              onTouchStart={(e) => {
                handleButtonPress(e, animationState !== 'minimizing');
              }}
              onTouchEnd={(e) => {
                handleButtonRelease(e, animationState !== 'minimizing');
                // Toujours gérer le touch, marquer comme traité
                setTouchHandled(true);
                handleTouchClose(e);
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div className="window-body" style={{ fontSize: '14px' }}>
          {children}
        </div>
      </div>
    </Draggable>
  );
}