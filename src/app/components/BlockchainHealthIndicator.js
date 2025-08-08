// src/components/BlockchainHealthIndicator.js
'use client'

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context';
import { RefreshCw } from 'lucide-react';

export default function BlockchainHealthIndicator({
    healthStatus,
    isCheckingHealth,
    onRefresh,
    getStatusInfo
}) {
    const { themeMode } = useTheme();
    const [countdown, setCountdown] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const isNight = themeMode === 'dark';
    const textColor = isNight ? '#eee' : '#333';
    const cardBg = isNight ? '#222' : '#f3f3f3';
    const borderColor = isNight ? '#444' : '#ddd';
    const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';

    const statusInfo = getStatusInfo();

    // Timer pour le décompte
    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [countdown]);

    // Fonction pour déclencher l'animation
    const triggerAnimation = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setIsAnimating(false);
        }, 1000);
    };

    // Fonction pour gérer le clic sur refresh
    const handleRefresh = async () => {
        // Toujours déclencher l'animation quand on clique
        triggerAnimation();

        // Si on est en countdown ou en train de checker, ne pas faire le refresh réel
        if (countdown > 0 || isCheckingHealth) return;

        // Démarrer le décompte de 30 secondes
        setCountdown(30);

        // Appeler la fonction de refresh
        await onRefresh();
    };

    // Couleurs basées sur le statut
    const getStatusColors = (color) => {
        const colors = {
            green: {
                bg: isNight ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                border: isNight ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.3)',
                text: isNight ? '#22c55e' : '#16a34a'
            },
            yellow: {
                bg: isNight ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                border: isNight ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.3)',
                text: isNight ? '#eab308' : '#ca8a04'
            },
            orange: {
                bg: isNight ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                border: isNight ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.3)',
                text: isNight ? '#f97316' : '#ea580c'
            },
            red: {
                bg: isNight ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: isNight ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                text: isNight ? '#ef4444' : '#dc2626'
            },
            gray: {
                bg: cardBg,
                border: borderColor,
                text: textColor
            }
        };

        return colors[color] || colors.gray;
    };

    const statusColors = getStatusColors(statusInfo.color);

    const cardStyle = {
        background: statusColors.bg,
        padding: '12px 16px',
        borderRadius: '8px',
        border: `1px solid ${statusColors.border}`,
        boxShadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        margin: '8px 0'
    };

    const statusStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: statusColors.text,
        fontSize: '14px',
        fontWeight: '500'
    };

    // Le bouton n'est jamais vraiment désactivé, mais visuellement différent pendant countdown
    const isInCountdown = countdown > 0;

    const refreshButtonStyle = {
        background: 'transparent',
        border: `1px solid ${statusColors.border}`,
        borderRadius: '6px',
        padding: '4px 8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        color: statusColors.text,
        opacity: isInCountdown ? 0.5 : 1,
        minWidth: countdown > 0 ? '35px' : '28px',
        fontSize: '12px',
        fontWeight: '500',
    };

    return (
        <div style={cardStyle}>
            <div style={statusStyle}>
                <span style={{ fontSize: '16px' }}>{statusInfo.icon}</span>
                <span>
                    {isCheckingHealth ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                                style={{
                                    width: '12px',
                                    height: '12px',
                                    border: `2px solid ${statusColors.text}`,
                                    borderTop: '2px solid transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}
                            />
                            Checking...
                        </div>
                    ) : (
                        statusInfo.message
                    )}
                </span>
            </div>

            {/* Bouton de rafraîchissement avec décompte */}
            <button
                onClick={handleRefresh}
                style={refreshButtonStyle}
                onMouseOver={(e) => {
                    if (!isInCountdown) {
                        e.target.style.background = statusColors.border;
                    }
                }}
                onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                }}
                title={
                    countdown > 0 ? `Wait ${countdown}s before next refresh` :
                        isCheckingHealth ? 'Checking...' :
                            'Refresh blockchain status'
                }
            >
                {countdown > 0 ? (
                    // Afficher le countdown
                    <span>Syncs every 5mn</span>
                ) : (
                    // Afficher l'icône avec animation
                    <RefreshCw
                        size={14}
                        style={{
                            transform: (isCheckingHealth || isAnimating) ? 'rotate(360deg)' : 'rotate(0deg)',
                            transition: 'transform 1s linear',
                        }}
                    />
                )}
            </button>

            {/* CSS pour l'animation de spin */}
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}