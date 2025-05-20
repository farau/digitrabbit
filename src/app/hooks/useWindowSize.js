'use client'

import { useState, useEffect } from 'react'

export function useWindowSize() {
    const [size, setSize] = useState({ width: 0 });
  
    useEffect(() => {
      // Ne s'exécute que côté client
      const handleResize = () => {
        setSize({ width: window.innerWidth });
      };
  
      handleResize(); // initialise la taille
  
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);
  
    return size;
}