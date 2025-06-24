'use client';

import Draggable from 'react-draggable';
import { useRef, useState, useEffect } from 'react';
import styles from './DraggableWindow.module.css';

export default function DraggableWindow({
  title,
  onClose,
  children,
  theme,
  zIndex,
  onFocus,
  visibleApps,
}) {
  const nodeRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Pour suivre la taille actuelle de l'écran
  const screenSize = useRef({ width: window.innerWidth, height: window.innerHeight });

  const centerWindow = (isMobileResize = false) => {
    const modalWidth = Math.min(window.innerWidth * 0.9, 600);
    const modalHeight = 300;
    const baseX = (window.innerWidth - modalWidth) / 2;
    const baseY = (window.innerHeight - modalHeight) * 0.1;

    if (!isMobileResize && visibleApps.length > 0) {
      // Décalage progressif sans superposition
      const spacing = 30;
      const maxOffsetX = window.innerWidth - modalWidth;
      const maxOffsetY = window.innerHeight - modalHeight - 100;

      const offsetX = spacing % maxOffsetX;
      const offsetY = spacing % maxOffsetY;

      setPosition({ x: baseX + offsetX * visibleApps.length, y: baseY + offsetY * visibleApps.length });
    } else if (!isMobileResize && visibleApps.length == 0) {
      setPosition({ x: baseX, y: baseY });
    }else {
      // Pour mobile ou redimensionnement forcé
      setPosition({ x: baseX, y: baseY });
    }
  };

  useEffect(() => {
    centerWindow();

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Si le resize modifie significativement la taille, reset le compteur
      const significantChange = Math.abs(screenSize.current.width - w) > 100 || Math.abs(screenSize.current.height - h) > 100;

      if (significantChange) {
        screenSize.current = { width: w, height: h };
      }

      if (w < 768) {
        centerWindow(true);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDrag = (e, data) => {
    setPosition({ x: data.x, y: data.y });
  };

  return (
    <Draggable
      bounds="parent"
      handle=".titleBar"
      nodeRef={nodeRef}
      position={position}
      onDrag={handleDrag}
      onMouseDown={onFocus}
    >
      <div
        ref={nodeRef}
        style={{ zIndex }}
        className={`${theme === 'dark' ? styles.darkMode : styles.lightMode}`}
      >
        <div className={`titleBar ${styles.titleBar} ${styles.stickyTop}`}>
          <span>{title}</span>
          <div className="title-bar-controls">
            <button onClick={onClose} className="close-button">X</button>
          </div>
        </div>

        <div className="window-body"   style={{ fontSize: '14px' }}>
          {children}
        </div>
      </div>
    </Draggable>
  );
}
