// app/api/rpc/route.js - Code complet avec cache optimisé

import { NextResponse } from 'next/server';
import { getBackendRpcWallet } from '@/lib/walletRpcBackend';

// ===== CONFIGURATION =====
const TEST_CONFIG = {
    POOL_SIZE: 5,
    TIMEOUT_MS: 5000,
    CACHE_DURATION_MS: 60000 * 5, // 5 minutes = 300 secondes
    THRESHOLDS: {
        OK: 300,                // < 300ms
        GOOD: 1000,             // 300ms - 1s
        SLIGHTLY_DEGRADED: 3000,  // 1s - 3s
        DEGRADED: 3000          // > 3s
    }
};

const isDevelopment = process.env.NODE_ENV === 'development';

// ===== CACHE CLASS =====
/**
 * Cache en mémoire pour le développement UNIQUEMENT
 * En production, utilise les headers HTTP (CDN gère tout)
 */
class DevCache {
    constructor(duration = TEST_CONFIG.CACHE_DURATION_MS) {
        this.data = null;
        this.timestamp = null;
        this.isRunning = false;
        this.duration = duration;
    }

    /**
     * Vérifie si le cache est valide
     */
    isValid() {
        if (!this.data || !this.timestamp) return false;
        const age = Date.now() - this.timestamp;
        return age < this.duration;
    }

    /**
     * Récupère les données du cache avec age et TTL
     */
    get() {
        if (!this.isValid()) return null;

        const age = Date.now() - this.timestamp;
        const remaining = this.duration - age;

        return {
            data: this.data,
            age: Math.round(age / 1000),
            ttl: Math.round(remaining / 1000)
        };
    }

    /**
     * Stocke les données en cache
     */
    set(data) {
        this.data = { ...data };
        this.timestamp = Date.now();
    }

    /**
     * Vide le cache
     */
    clear() {
        this.data = null;
        this.timestamp = null;
        this.isRunning = false;
    }
}

const cache = new DevCache();

// ===== CACHE HEADERS MANAGEMENT =====
/**
 * Retourne les headers de cache appropriés
 * - Développement : cache mémoire local (simple debugging)
 * - Production : cache CDN (Vercel Edge) avec stale-while-revalidate
 */
function getCacheHeaders(forceRefresh = false) {
    if (isDevelopment) {
        return {
            'Cache-Control': 'private, no-cache',
            'X-Environment': 'development',
            'X-Cache-Strategy': 'memory'
        };
    }

    // Production : cache public au CDN
    const maxAge = Math.round(TEST_CONFIG.CACHE_DURATION_MS / 1000); // 300 secondes

    if (forceRefresh) {
        return {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Environment': 'production',
            'X-Cache-Strategy': 'no-cache'
        };
    }

    return {
        // ✅ Cache au CDN (Vercel Edge) pendant 5 min
        // ✅ s-maxage = cache au CDN même si max-age au client expire
        // ✅ stale-while-revalidate = sert stale 60s pendant que serveur revalidate
        'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=60`,
        'Vary': 'Accept-Encoding',
        'X-Environment': 'production',
        'X-Cache-Strategy': 'cdn',
        'X-Cache-Max-Age': maxAge.toString()
    };
}

/**
 * Retourne la réponse depuis le cache (dev uniquement)
 */
function getCachedResponse() {
    const cached = cache.get();
    if (!cached) return null;

    return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: cached.age,
        cacheTtl: cached.ttl,
        environment: 'development'
    }, {
        headers: {
            'Cache-Control': `private, max-age=${cached.ttl}`,
            'X-Cache': 'HIT',
            'X-Cache-Age': cached.age.toString(),
            'X-Cache-TTL': cached.ttl.toString(),
            'X-Environment': 'development'
        }
    });
}

// ===== GAS & TRANSACTION MANAGEMENT =====
/**
 * Définit le prix du gas pour les tests
 */
const defineGasPrice = async (walletClient) => {
    return {
        gasPrice: 1000000000n, // 1 gwei
        gasLimit: 100000n
    };
};

/**
 * Crée une pool de transactions présignées pour les tests
 */
async function createTransactionPool(walletClient, poolSize = TEST_CONFIG.POOL_SIZE) {
    const transactions = [];
    const { gasPrice, gasLimit } = await defineGasPrice(walletClient);
    const baseNonce = await walletClient.request({
        method: 'eth_getTransactionCount',
        params: [walletClient.account.address, 'latest']
    });

    try {
        console.log(`🔄 Creating transaction pool of ${poolSize} transactions...`);

        for (let i = 0; i < poolSize; i++) {
            const currentNonce = Number(BigInt(baseNonce)) + i;

            const transaction = {
                account: walletClient.account,
                to: walletClient.account.address,
                value: 0n,
                nonce: currentNonce,
                maxFeePerGas: gasPrice,
                maxPriorityFeePerGas: gasPrice / 10n,
                type: 'eip1559',
                gas: gasLimit,
            };

            transactions.push({
                id: `test-tx-${i}`,
                transaction,
                timestamp: Date.now()
            });
        }

        console.log(`✅ Transaction pool of ${transactions.length} transactions created`);
        return transactions;

    } catch (error) {
        console.error('❌ Error creating transaction pool:', error);
        throw new Error(`Failed to create transaction pool: ${error.message}`);
    }
}

/**
 * Teste l'envoi d'une transaction via sendRawTransaction
 */
async function testTransaction(walletClient, transaction) {
    const startTime = Date.now();

    try {
        const request = await walletClient.prepareTransactionRequest(transaction);
        const serializedTransaction = await walletClient.signTransaction(request);
        const result = await walletClient.request({
            method: 'realtime_sendRawTransaction',
            params: [serializedTransaction],
        });

        const responseTime = Date.now() - startTime;

        return {
            success: true,
            responseTime,
            txHash: result,
            error: null
        };

    } catch (error) {
        const responseTime = Date.now() - startTime;

        if (isDevelopment) {
            console.warn(`⚠️ Transaction test failed:`, error.message);
        }

        return {
            success: false,
            responseTime,
            txHash: null,
            error: error.message
        };
    }
}

// ===== ANALYSIS & RESULTS =====
/**
 * Analyse les résultats des tests pour déterminer l'état de la blockchain
 */
function analyzeResults(results) {
    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);

    // Si tout échoue
    if (successfulTests.length === 0) {
        return {
            status: 'down',
            value: 0,
            details: {
                total: results.length,
                successful: 0,
                failed: failedTests.length,
                averageResponseTime: 0,
                errors: failedTests.map(t => t.error).slice(0, 3)
            }
        };
    }

    // Calcul du temps moyen
    const avgResponseTime = successfulTests.reduce((sum, test) => sum + test.responseTime, 0) / successfulTests.length;

    // Détermination du statut
    let status, value;

    if (avgResponseTime < TEST_CONFIG.THRESHOLDS.OK) {
        status = 'excellent';
        value = avgResponseTime / 1000;
    } else if (avgResponseTime < TEST_CONFIG.THRESHOLDS.GOOD) {
        status = 'good';
        value = avgResponseTime / 1000;
    } else if (avgResponseTime <= TEST_CONFIG.THRESHOLDS.SLIGHTLY_DEGRADED) {
        status = 'slightly degraded';
        value = avgResponseTime / 1000;
    } else {
        status = 'degraded';
        value = avgResponseTime / 1000;
    }

    return {
        status,
        value: parseFloat(value.toFixed(3)),
        details: {
            total: results.length,
            successful: successfulTests.length,
            failed: failedTests.length,
            averageResponseTime: Math.round(avgResponseTime),
            minResponseTime: Math.min(...successfulTests.map(t => t.responseTime)),
            maxResponseTime: Math.max(...successfulTests.map(t => t.responseTime)),
            successRate: Math.round((successfulTests.length / results.length) * 100),
            errors: failedTests.map(t => t.error).slice(0, 3)
        }
    };
}

// ===== MAIN HANDLER =====
/**
 * GET /api/rpc
 * 
 * Teste l'état de santé de la blockchain
 * 
 * Développement:
 *   - Cache en mémoire (5 min)
 *   - Évite les appels répétés
 * 
 * Production:
 *   - Cache CDN via headers HTTP (Vercel Edge)
 *   - Tous les clients partagent le cache
 *   - stale-while-revalidate pour éviter la thundering herd
 * 
 * Query params:
 *   - ?refresh=true : Force la réexécution des tests (ignore le cache)
 */
export async function GET(request) {
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // ===== DÉVELOPPEMENT : Cache mémoire =====
    if (isDevelopment && !forceRefresh) {
        // Cache valide ? Retourner le cache
        if (cache.isValid()) {
            console.log('📦 [DEV] Returning cached blockchain health status');
            return getCachedResponse();
        }

        // Test déjà en cours ? Retourner 429 (Too Many Requests)
        if (cache.isRunning) {
            console.log('⏳ [DEV] Test already running, please wait...');
            return NextResponse.json({
                status: 'testing',
                message: 'A blockchain health test is already in progress. Please wait and try again.',
                retryAfter: 5,
                timestamp: new Date().toISOString(),
                environment: 'development'
            }, {
                status: 429,
                headers: {
                    'Retry-After': '5',
                    'X-Rate-Limit': 'Test in progress',
                    'X-Environment': 'development'
                }
            });
        }

        cache.isRunning = true;
    }

    console.log(`🚀 [${isDevelopment ? 'DEV' : 'PROD'}] ${forceRefresh ? 'Forced refresh -' : ''} Starting blockchain health test...`);

    const testStartTime = Date.now();
    let walletClient;

    // Step 0: Get wallet client
    try {
        const walletResult = getBackendRpcWallet();
        walletClient = walletResult.walletClient;

    } catch (error) {
        if (isDevelopment) cache.isRunning = false;
        console.error('❌ Failed to get test wallet client:', error);

        return NextResponse.json({
            status: 'down',
            value: 0,
            error: 'Unable to create test wallet client',
            details: error.message,
            timestamp: new Date().toISOString()
        }, {
            status: 500,
            headers: getCacheHeaders(true)
        });
    }

    // Step 1: Create transaction pool
    let transactionPool;
    try {
        transactionPool = await createTransactionPool(walletClient);
    } catch (error) {
        if (isDevelopment) cache.isRunning = false;
        console.error('❌ Failed to create transaction pool:', error);

        return NextResponse.json({
            status: 'down',
            value: 0,
            error: 'Unable to create transaction pool',
            details: error.message,
            timestamp: new Date().toISOString()
        }, {
            status: 500,
            headers: getCacheHeaders(true)
        });
    }

    // Step 2: Execute transaction tests
    console.log('📡 Running transaction tests...');

    const testPromises = transactionPool.map(async (poolItem) => {
        try {
            const result = await Promise.race([
                testTransaction(walletClient, poolItem.transaction),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), TEST_CONFIG.TIMEOUT_MS)
                )
            ]);

            return {
                ...result,
                transactionId: poolItem.id
            };
        } catch (error) {
            return {
                success: false,
                responseTime: TEST_CONFIG.TIMEOUT_MS,
                txHash: null,
                error: error.message === 'Timeout' ? 'Request timeout' : error.message,
                transactionId: poolItem.id
            };
        }
    });

    try {
        const results = await Promise.all(testPromises);

        // Step 3: Analyze results
        const analysis = analyzeResults(results);
        const totalTestTime = Date.now() - testStartTime;

        console.log(`✅ [${isDevelopment ? 'DEV' : 'PROD'}] Test completed in ${totalTestTime}ms - Status: ${analysis.status} (${analysis.details.successRate}% success rate)`);

        const responseData = {
            status: analysis.status,
            value: analysis.value,
            details: {
                ...analysis.details,
                totalTestDuration: totalTestTime,
                poolSize: transactionPool.length,
                timestamp: new Date().toISOString(),
                network: 'megaeth-testnet-v2',
                environment: isDevelopment ? 'development' : 'production',
                cacheStrategy: isDevelopment ? 'memory' : 'cdn'
            }
        };

        // Mettre à jour le cache en développement
        if (isDevelopment) {
            cache.set(responseData);
        }

        return NextResponse.json({
            ...responseData,
            cached: false
        }, {
            headers: getCacheHeaders(forceRefresh)
        });

    } catch (error) {
        if (isDevelopment) cache.isRunning = false;
        console.error('❌ Error during RPC test:', error);

        return NextResponse.json({
            status: 'down',
            value: 0,
            error: 'Internal error during testing',
            details: error.message,
            timestamp: new Date().toISOString()
        }, {
            status: 500,
            headers: getCacheHeaders(true)
        });
    }
}
