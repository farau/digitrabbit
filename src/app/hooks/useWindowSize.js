'use client'

import { useState, useEffect } from 'react'

export function useWindowSize() {
  const [size, setSize] = useState({ width: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

    const handleResize = () => {
      const width = window.innerWidth
      setSize((previous) => (previous.width === width ? previous : { width }))

      const nextIsMobile = width < 768 || mobileRegex.test(navigator.userAgent)
      setIsMobile((previous) => (previous === nextIsMobile ? previous : nextIsMobile))
    };

    handleResize();

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { ...size, isMobile };
}
