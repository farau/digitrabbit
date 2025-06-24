'use client';

import { useEffect, useState } from 'react';
import { parseAbiItem } from 'viem';
import { publicClient } from '@/constants';
import styles from './EventToast.module.css';

export default function EventToast({ isTimeExpired, setIsTimeExpired, setIsGameStarted }) {
  const [visible, setVisible] = useState(false);
  const [log, setLog] = useState(null);
  const [remaining, setRemaining] = useState(60);

  useEffect(() => {
    const unwatch = publicClient.watchEvent({
      event: parseAbiItem([ 
            'event GameStarted(address indexed player, uint256 seasonId, uint256 sessionEndsAt)',
        ]),
      onLogs: (logs) => {
        const l = logs[0];
        setLog({
          player: l.args.player,
          seasonId: l.args.seasonId.toString(),
        });
        setRemaining(57); // reset timer à 55 secondes car 3 secondes nécessaires pour affiches l'event
        setVisible(true);

      },
    });

    return () => unwatch?.();
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (!log || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [log]);

    // Détecte quand le temps est écoulé
    useEffect(() => {
    if (remaining === 0 && !isTimeExpired) {
        setIsTimeExpired(true);
        setIsGameStarted(false);
        setVisible(false)
    }
    }, [remaining]);
    
  if (!log) return null;

  return visible && (
    <div className={`fixed top-4 right-4 z-50 bg-white dark:bg-zinc-900 text-black dark:text-white border border-gray-300 dark:border-zinc-700 rounded-lg shadow-lg px-4 py-3 ${styles.animateToast}`}>
      <div className="font-semibold">🎮 Game started!</div>
      <div className="text-xs">👤 {log.player.slice(0, 6)}...{log.player.slice(-4)}</div>
      <div className="text-xs">🪐 Season : {log.seasonId}</div>
      <div className="text-xs">⏱️ Time left : {remaining}s</div>
    </div>
  );
}
