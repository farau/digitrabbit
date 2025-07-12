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

  const isMobile = useMemo(() => screenSize.width < 768, [screenSize.width]);

  // Position centrée calculée
  const getCenteredPosition = useCallback(() => {
    const { width, height } = windowDimensions;
    const baseX = (screenSize.width - width) / 2;
    const baseY = (screenSize.height - height) * 0.1;

    if (!isMobile && visibleApps.length > 0) {
      const spacing = 30;
      const maxOffsetX = screenSize.width - width;
      const maxOffsetY = screenSize.height - height - 100;

      const offsetX = spacing % maxOffsetX;
      const offsetY = spacing % maxOffsetY;

      return {
        x: baseX + offsetX * visibleApps.length,
        y: baseY + offsetY * visibleApps.length
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
          <div className={styles.titleBarControls}>
            {onMinimize && (
              <button
                onClick={handleMinimize}
                aria-label="Minimize the window"
                disabled={animationState !== 'normal'}
                style={{
                  padding: '2px 6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: '1px outset #c0c0c0',
                  background: animationState !== 'normal' ? '#a0a0a0' : '#c0c0c0',
                  cursor: animationState !== 'normal' ? 'default' : 'pointer',
                  fontFamily: 'Pixelated MS Sans Serif, sans-serif',
                  lineHeight: '1',
                  minWidth: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: animationState !== 'normal' ? '#666' : 'black',
                  opacity: animationState !== 'normal' ? 0.6 : 1
                }}
                onMouseDown={(e) => {
                  if (animationState === 'normal') {
                    e.target.style.border = '1px inset #c0c0c0';
                  }
                }}
                onMouseUp={(e) => {
                  if (animationState === 'normal') {
                    e.target.style.border = '1px outset #c0c0c0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (animationState === 'normal') {
                    e.target.style.border = '1px outset #c0c0c0';
                  }
                }}
              >
                −
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close the window"
              disabled={animationState === 'minimizing'}
              style={{
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
                opacity: animationState === 'minimizing' ? 0.6 : 1
              }}
              onMouseDown={(e) => {
                if (animationState !== 'minimizing') {
                  e.target.style.border = '1px inset #c0c0c0';
                }
              }}
              onMouseUp={(e) => {
                if (animationState !== 'minimizing') {
                  e.target.style.border = '1px outset #c0c0c0';
                }
              }}
              onMouseLeave={(e) => {
                if (animationState !== 'minimizing') {
                  e.target.style.border = '1px outset #c0c0c0';
                }
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