'use client';

import Draggable from 'react-draggable';
import { useRef, useState, useEffect } from 'react';
import styles from './DraggableWindow.module.css';

export default function DraggableWindow({ title, onClose, children, theme }) {
  const nodeRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Fonction pour centrer la fenêtre
  const centerWindow = () => {
    const modalWidth = Math.min(window.innerWidth * 0.9, 600);
    const modalHeight = 300; // <- Si tu connais approximativement la hauteur (sinon il faudra la mesurer dynamiquement)
    const x = (window.innerWidth - modalWidth) / 2;
    const y = (window.innerHeight - modalHeight) * 0.1; // 10% du haut
    setPosition({ x, y });
  };

  // Centre la fenêtre au chargement et au redimensionnement
  useEffect(() => {
    centerWindow();
    window.addEventListener('resize', centerWindow);
    return () => window.removeEventListener('resize', centerWindow);
  }, []);

  const handleDrag = (e, data) => {
    setPosition({ x: data.x, y: data.y });
  };

  return (
    <Draggable bounds="parent" handle=".title-bar" nodeRef={nodeRef} position={position} onDrag={handleDrag}>
    <div
        ref={nodeRef}
        className={`${theme === 'dark' ? styles.darkMode : styles.lightMode}`}
    >
        <div className={`title-bar ${styles.stickyTop}`}>
        <span style={{ color: 'white' }}>{title}</span>
        <div className="title-bar-controls">
            <button onClick={onClose} aria-label="Close" />
        </div>
        </div>
        <div className="window-body">{children}</div>
    </div>
    </Draggable>
  );
}
