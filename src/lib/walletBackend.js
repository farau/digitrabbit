// utils/walletBackend.js
import { createWalletClient, createPublicClient, http } from 'viem';
import { megaethTestnet } from 'viem/chains'; // Signer will be used especially on MegaETH Testnet
import { privateKeyToAccount } from 'viem/accounts'
import { encodePacked, keccak256, hashMessage } from 'viem';

import { recoverAddress } from 'viem'


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
    console.log('Using existing backend wallet client');
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
function getBackendWallet() {
  return initializeBackendWallet();
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

    // For verification, let's check what we signed
    const ethSignedMessageHash = hashMessage(messageHash);

    // Recover the signer to verify
    const recoveredAddress = await recoverAddress({
      hash: ethSignedMessageHash,
      signature
    });

    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    throw new Error('Failed to sign message');
  }
}

// Alternative: Sign typed data (EIP-712) - more secure approach
async function signTypedData(userAddress, amount, nonce) {
  const { walletClient } = getBackendWallet();

  const domain = {
    name: 'MegaETH Claims',
    version: '1',
    chainId: megaethTestnet.id,
    verifyingContract: '0x0000000000000000000000000000000000000000', // Replace with your contract address
  };

  const types = {
    Claim: [
      { name: 'user', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
    ],
  };

  const value = {
    user: userAddress,
    amount: BigInt(amount),
    nonce: BigInt(nonce),
  };

  try {
    const signature = await walletClient.signTypedData({
      domain,
      types,
      primaryType: 'Claim',
      message: value,
    });

    return signature;
  } catch (error) {
    console.error('Error signing typed data:', error);
    throw new Error('Failed to sign typed data');
  }
}

export {
  initializeBackendWallet,
  getBackendWallet,
  signMessage,
  signTypedData,
};