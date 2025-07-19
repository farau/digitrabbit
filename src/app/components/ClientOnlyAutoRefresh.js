'use client';

import { useEffect } from 'react';

export default function ClientOnlyAutoRefresh() {
    useEffect(() => {
        const timeout = setTimeout(() => {
            window.location.reload();
        }, 60 * 60 * 1000); // 1 heure

        return () => clearTimeout(timeout);
    }, []);

    return null; // ce composant ne rend rien à l'écran
}
