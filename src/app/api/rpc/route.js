// app/api/rpc/route.js - Code complet avec cache hybride
import { NextResponse } from 'next/server';
import { getBackendRpcWallet } from '@/lib/walletRpcBackend';

// Configuration pour les tests
const TEST_CONFIG = {
    POOL_SIZE: 5,
    TIMEOUT_MS: 5000,
    CACHE_DURATION_MS: 60000 * 5, // 5mn de cache
    THRESHOLDS: {
        OK: 300,           // < 300ms
        GOOD: 1000,        // 300ms - 1s
        SLIGHTLY_DEGRADED: 3000,  // 1s - 3s
        DEGRADED: 3000     // > 3s
    }
};

// Cache en mémoire SEULEMENT pour le développement
let devCache = {
    data: null,
    timestamp: null,
    isRunning: false
};

const isDevelopment = process.env.NODE_ENV === 'development';

// Fonctions de cache pour le développement
function isDevCacheValid() {
    if (!isDevelopment || !devCache.data || !devCache.timestamp) {
        return false;
    }
    const cacheAge = Date.now() - devCache.timestamp;
    return cacheAge < TEST_CONFIG.CACHE_DURATION_MS;
}

function getDevCachedResponse() {
    const cacheAge = Date.now() - devCache.timestamp;
    const remainingTtl = Math.max(0, TEST_CONFIG.CACHE_DURATION_MS - cacheAge);

    return NextResponse.json({
        ...devCache.data,
        cached: true,
        cacheAge: Math.round(cacheAge / 1000),
        cacheTtl: Math.round(remainingTtl / 1000),
        environment: 'development'
    }, {
        headers: {
            'Cache-Control': `private, max-age=${Math.round(remainingTtl / 1000)}`,
            'X-Cache': 'DEV-HIT',
            'X-Cache-Age': Math.round(cacheAge / 1000).toString(),
            'X-Cache-TTL': Math.round(remainingTtl / 1000).toString(),
            'X-Environment': 'development'
        }
    });
}

function updateDevCache(data) {
    if (isDevelopment) {
        devCache = {
            data: { ...data },
            timestamp: Date.now(),
            isRunning: false
        };
    }
}

const defineGasPrice = async (walletClient) => {
    return {
        gasPrice: 1000000000n, // 1 gwei
        gasLimit: 100000n
    }
}

/**
 * Crée une pool de transactions présignées pour les tests
 */
async function createTransactionPool(walletClient, poolSize = TEST_CONFIG.POOL_SIZE) {
    const transactions = [];
    const { gasPrice, gasLimit } = await defineGasPrice(walletClient)
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

        if (process.env.NODE_ENV === 'development') {
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

/**
 * Analyse les résultats des tests pour déterminer l'état de la blockchain
 */
function analyzeResults(results) {
    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);

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

    const avgResponseTime = successfulTests.reduce((sum, test) => sum + test.responseTime, 0) / successfulTests.length;

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

/**
 * Gestionnaire GET avec cache hybride dev/prod
 */
export async function GET(request) {
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // En développement : utiliser le cache mémoire
    if (isDevelopment && !forceRefresh) {
        if (isDevCacheValid()) {
            console.log('📦 [DEV] Returning cached blockchain health status');
            return getDevCachedResponse();
        }

        if (devCache.isRunning) {
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

        devCache.isRunning = true;
    }

    // Headers pour la production (CDN) et développement
    const cacheHeaders = isDevelopment ? {
        'Cache-Control': 'private, no-cache',
        'X-Environment': 'development'
    } : {
        'Cache-Control': forceRefresh
            ? 'no-cache, no-store, must-revalidate'
            : `public, max-age=${Math.round(TEST_CONFIG.CACHE_DURATION_MS / 1000)}, s-maxage=${Math.round(TEST_CONFIG.CACHE_DURATION_MS / 1000)}`,
        'Vary': 'Accept-Encoding',
        'X-Environment': 'production'
    };

    console.log(`🚀 [${isDevelopment ? 'DEV' : 'PROD'}] ${forceRefresh ? 'Forced refresh -' : ''} Starting blockchain health test...`);

    const testStartTime = Date.now();
    let walletClient;

    try {
        const walletResult = getBackendRpcWallet();
        walletClient = walletResult.walletClient;

    } catch (error) {
        if (isDevelopment) devCache.isRunning = false;
        console.error('❌ Failed to get test wallet client:', error);
        return NextResponse.json({
            status: 'down',
            value: 0,
            error: 'Unable to create test wallet client',
            details: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }

    // Step 1: Create transaction pool
    let transactionPool;
    try {
        transactionPool = await createTransactionPool(walletClient);
    } catch (error) {
        if (isDevelopment) devCache.isRunning = false;
        console.error('❌ Failed to create transaction pool:', error);
        return NextResponse.json({
            status: 'down',
            value: 0,
            error: 'Unable to create transaction pool',
            details: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
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
            updateDevCache(responseData);
        }

        return NextResponse.json({
            ...responseData,
            cached: false
        }, {
            headers: cacheHeaders
        });

    } catch (error) {
        if (isDevelopment) devCache.isRunning = false;
        console.error('❌ Error during RPC test:', error);

        return NextResponse.json({
            status: 'down',
            value: 0,
            error: 'Internal error during testing',
            details: error.message,
            timestamp: new Date().toISOString()
        }, {
            status: 500,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    }
}