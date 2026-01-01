// src/hooks/useBlockchainHealth.js
'use client';

import { useState, useEffect, useRef } from 'react';
import * as Sentry from '@sentry/nextjs';
import { BLOCKCHAIN_HEALTH_CONFIG, canPlayWithStatus, getStatusDisplayInfo } from '@/lib/blockchainHealthConfig';

export function useBlockchainHealth() {
    const [healthStatus, setHealthStatus] = useState(null);
    const [isCheckingHealth, setIsCheckingHealth] = useState(false);
    const [healthError, setHealthError] = useState(null);
    const hasChecked = useRef(false);


    // Fonction pour vérifier l'état de la blockchain
    const checkBlockchainHealth = async (force = false) => {
        // Éviter les appels multiples
        if (isCheckingHealth && !force) {
            return;
        }

        setIsCheckingHealth(true);
        setHealthError(null);

        try {
            console.log('🔍 Checking blockchain health...');

            const response = await fetch('/api/rpc', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            console.log('✅ Blockchain health check completed:', {
                status: data.status,
                value: data.value,
                successRate: data.details?.successRate,
                responseTime: data.details?.averageResponseTime
            });

            // Mettre à jour l'état
            setHealthStatus(data);

            // Log dans Sentry pour monitoring
            Sentry.addBreadcrumb({
                category: 'blockchain',
                message: 'Blockchain health check completed',
                level: data.status === 'down' ? 'warning' : 'info',
                data: {
                    status: data.status,
                    value: data.value,
                    responseTime: data.details?.averageResponseTime,
                    successful: data.details?.successful,
                    failed: data.details?.failed,
                    successRate: data.details?.successRate,
                    timestamp: new Date().toISOString()
                }
            });

            return data;

        } catch (error) {
            console.error('❌ Blockchain health check failed:', error);

            const errorData = {
                status: 'down',
                value: 0,
                error: error.message,
                timestamp: new Date().toISOString()
            };

            setHealthStatus(errorData);
            setHealthError(error.message);

            // Log l'erreur dans Sentry
            Sentry.captureException(error, {
                tags: {
                    action: 'blockchain_health_check',
                    component: 'useBlockchainHealth'
                },
                extra: {
                    errorMessage: error.message,
                    timestamp: new Date().toISOString()
                }
            });

            return errorData;

        } finally {
            setIsCheckingHealth(false);
        }
    };

    // Vérification automatique au montage du hook
    useEffect(() => {
        if (!hasChecked.current) {
            hasChecked.current = true;
            checkBlockchainHealth();
        }
    }, []);

    // Fonction utilitaire pour interpréter le statut
    const getStatusInfo = () => {
        return getStatusDisplayInfo(
            healthStatus?.status,
            healthStatus?.value,
            healthStatus?.error
        );
    };

    return {
        healthStatus,
        isCheckingHealth,
        healthError,
        checkBlockchainHealth,
        getStatusInfo,
        // Fonction utilitaire pour vérifier si on peut jouer
        canPlay: healthStatus ? canPlayWithStatus(healthStatus.status) : null
    };
}