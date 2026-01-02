'use client'

import { useState, useEffect } from 'react'

export function useWindowSize() {
  const [size, setSize] = useState({ width: 0 });

  const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    // Ne s'exécute que côté client
    const handleResize = () => {
      setSize({ width: window.innerWidth });
    };

    handleResize(); // initialise la taille

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { ...size, isMobile };
}