// lib/walletBackend.js
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts'
import { encodePacked, keccak256, hashMessage } from 'viem';
import { recoverAddress } from 'viem'
import { customMegaethTestnet } from '@/utils/chainConfig'

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
function initializeBackendWallet() {
  if (backendWalletClient && backendPublicClient) {
    return { walletClient: backendWalletClient, publicClient: backendPublicClient };
  }

  const privateKey = process.env.BACKEND_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('BACKEND_PRIVATE_KEY environment variable is required');
  }

  const account = createMegaETHAccount(privateKey);

  // Create wallet client 
  backendWalletClient = createWalletClient({
    account,
    chain: customMegaethTestnet,
    transport: http('https://carrot.megaeth.com/rpc?vip=1&u=digitrabbits%20v2&v=5184000&s=mafia&verify=' + process.env.NEXT_VIP_RPC_KEY),
  });

  // Create separate public client for better performance
  backendPublicClient = createPublicClient({
    chain: customMegaethTestnet,
    transport: http('https://carrot.megaeth.com/rpc?vip=1&u=digitrabbits%20v2&v=5184000&s=mafia&verify=' + process.env.NEXT_VIP_RPC_KEY),
  });

  console.log('Backend wallet initialized for address:', account.address);

  return { walletClient: backendWalletClient, publicClient: backendPublicClient };
}

// Get backend wallet (lazy initialization)
function getBackendWallet() {
  return initializeBackendWallet();
}

// Sign start game authorization message
export async function signMessageStartGame(userAddress, nonce) {
  const { walletClient } = getBackendWallet();

  // Create message to sign (same as Solidity createMessageHash)
  const packed = encodePacked(
    ['address', 'string', 'uint256'],
    [userAddress, 'START_GAME', nonce]
  );

  // Create the hash (equivalent to keccak256(abi.encodePacked(...)) in Solidity)
  const messageHash = keccak256(packed);

  try {
    // Sign the raw hash - viem will automatically apply the Ethereum signed message prefix
    const signature = await walletClient.signMessage({
      message: { raw: messageHash }, // Sign the raw hash, not the packed data
    });
    return signature;
  } catch (error) {
    console.error('Error signing start game message:', error);
    throw new Error('Failed to sign start game message');
  }
}

// Sign message function
async function signMessage(userAddress, amount, nonce) {
  const { walletClient } = getBackendWallet();

  // Create message to sign (same as Solidity createMessageHash)
  const packed = encodePacked(
    ['address', 'uint256', 'uint256'],
    [userAddress, amount, nonce]
  );

  // Create the hash (equivalent to keccak256(abi.encodePacked(...)) in Solidity)
  const messageHash = keccak256(packed);

  try {
    // Sign the raw hash - viem will automatically apply the Ethereum signed message prefix
    const signature = await walletClient.signMessage({
      message: { raw: messageHash }, // Sign the raw hash, not the packed data
    });

    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    throw new Error('Failed to sign message');
  }
}

// Sign message chat function
async function signMessageChat(userAddress, content, score, nonce) {
  const { walletClient } = getBackendWallet();

  // Create message to sign (same as Solidity createMessageHash)
  const packed = encodePacked(
    ['address', 'string', 'uint256', 'uint256'],
    [userAddress, content, score, nonce]
  );

  // Create the hash (equivalent to keccak256(abi.encodePacked(...)) in Solidity)
  const messageHash = keccak256(packed);

  try {
    // Sign the raw hash - viem will automatically apply the Ethereum signed message prefix
    const signature = await walletClient.signMessage({
      message: { raw: messageHash }, // Sign the raw hash, not the packed data
    });

    return signature;
  } catch (error) {
    console.error('Error signing chat message:', error);
    throw new Error('Failed to sign chat message');
  }
}

export {
  initializeBackendWallet,
  getBackendWallet,
  signMessage,
  signMessageChat
};