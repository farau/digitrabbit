// lib/walletRpcBackend.js
import { createWalletClient, createPublicClient, http } from 'viem';
import { megaethTestnet } from 'viem/chains'; // Signer will be used especially on MegaETH Testnet
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
        chain: megaethTestnet,
        transport: http(megaethTestnet.rpcUrls.default.http[0]),
    });

    // Create separate public client for better performance
    backendPublicClient = createPublicClient({
        chain: megaethTestnet,
        transport: http(megaethTestnet.rpcUrls.default.http[0]),
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