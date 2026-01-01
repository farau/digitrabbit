// lib/walletRpcBackend.js
import { createWalletClient, createPublicClient, http } from 'viem';
import { customMegaethTestnet } from '@/utils/constants';
import { privateKeyToAccount } from 'viem/accounts'

// Singleton pattern for wallet clients
let backendWalletClient = null;
let backendPublicClient = null;

// Create account from private key
function createMegaETHAccount(privateKey) {
    // Remove '0x' prefix if present
    const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`

    return privateKeyToAccount(cleanPrivateKey)
}

// Initialize backend wallet client (singleton)
function initializeBackendRpcWallet() {
    if (backendWalletClient && backendPublicClient) {
        return { walletClient: backendWalletClient, publicClient: backendPublicClient };
    }

    const privateKey = process.env.BACKEND_PRIVATE_KEYRPC;
    if (!privateKey) {
        throw new Error('BACKEND_RPC_PRIVATE_KEY environment variable is required');
    }

    const account = createMegaETHAccount(privateKey);

    // Create wallet client 
    backendWalletClient = createWalletClient({
        account,
        chain: customMegaethTestnet,
        transport: http('https://timothy.megaeth.com/rpc?vip=1&u=digitrabbits%20v2&v=5184000&s=mafia&verify=' + process.env.NEXT_PUBLIC_RPC_KEY),
    });

    // Create separate public client for better performance
    backendPublicClient = createPublicClient({
        chain: customMegaethTestnet,
        transport: http('https://timothy.megaeth.com/rpc?vip=1&u=digitrabbits%20v2&v=5184000&s=mafia&verify=' + process.env.NEXT_PUBLIC_RPC_KEY),
    });

    console.log('Backend wallet initialized for address:', account.address);

    return { walletClient: backendWalletClient, publicClient: backendPublicClient };
}

// Get backend wallet (lazy initialization)
function getBackendRpcWallet() {
    return initializeBackendRpcWallet();
}

export {
    initializeBackendRpcWallet,
    getBackendRpcWallet
};