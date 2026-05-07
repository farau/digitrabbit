// lib/walletBackend.js
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts'
import { encodePacked, keccak256, hashMessage } from 'viem';
import { megaeth } from 'viem/chains';
import {
  DIGIT_RABBITS_ABI,
  DIGIT_RABBITS_ADDRESS,
  DIGIT_RABBITS_CHAT_ABI,
  DIGIT_RABBITS_CHAT_ADDRESS
} from '@/utils/chainConfig'

// Singleton pattern for wallet clients
let backendWalletClient = null;
let backendPublicClient = null;
let rabbitBotWalletClient = null;
let rabbitBotPublicClient = null;
let rabbitBotAccount = null;

function getBackendRpcUrl() {
  const vipKey = process.env.NEXT_VIP_RPC_KEY
  if (vipKey) {
    return `https://mainnet.megaeth.com/rpc?vip=1&u=digitrabbits%20v2&v=5184000&s=mafia&verify=${vipKey}`
  }
  return 'https://mainnet.megaeth.com/rpc'
}

function buildClientsFromPrivateKey(privateKey) {
  const account = createMegaETHAccount(privateKey)
  const transport = http(getBackendRpcUrl())

  const walletClient = createWalletClient({
    account,
    chain: megaeth,
    transport,
  })

  const publicClient = createPublicClient({
    chain: megaeth,
    transport,
  })

  return { account, walletClient, publicClient }
}

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

  const { account, walletClient, publicClient } = buildClientsFromPrivateKey(privateKey)
  backendWalletClient = walletClient
  backendPublicClient = publicClient

  console.log('Backend wallet initialized for address:', account.address);

  return { walletClient: backendWalletClient, publicClient: backendPublicClient };
}

// Get backend wallet (lazy initialization)
function getBackendWallet() {
  return initializeBackendWallet();
}

// Initialize RabbitBot wallet (singleton)
function initializeRabbitBotWallet() {
  if (rabbitBotWalletClient && rabbitBotPublicClient && rabbitBotAccount) {
    return {
      account: rabbitBotAccount,
      walletClient: rabbitBotWalletClient,
      publicClient: rabbitBotPublicClient
    }
  }

  const privateKey = process.env.RABBITBOT_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('RABBITBOT_PRIVATE_KEY is required')
  }

  const { account, walletClient, publicClient } = buildClientsFromPrivateKey(privateKey)
  rabbitBotAccount = account
  rabbitBotWalletClient = walletClient
  rabbitBotPublicClient = publicClient

  console.log('RabbitBot wallet initialized for address:', account.address)

  return {
    account: rabbitBotAccount,
    walletClient: rabbitBotWalletClient,
    publicClient: rabbitBotPublicClient
  }
}

function getRabbitBotWallet() {
  return initializeRabbitBotWallet()
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

// Sign message chat function
async function signMessageQuests(playerAddress, questId, periodKey, periodTypeNum, rewardAmount, nonce) {
  const { walletClient } = getBackendWallet();

  // Create message to sign (same as Solidity createMessageHash)
  const messageHash = keccak256(
    encodePacked(
      ['address', 'string', 'string', 'uint8', 'uint256', 'uint256'],
      [
        playerAddress,
        questId,
        periodKey,
        periodTypeNum,
        rewardAmount,
        nonce
      ]
    )
  );

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

function buildRabbitBotNonce() {
  return BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000000))
}

function extractReadableError(error) {
  return error?.details || error?.shortMessage || error?.message || 'Unknown error'
}

async function extractRevertReasonFromTxHash(publicClient, txHash) {
  try {
    const tx = await publicClient.getTransaction({ hash: txHash })
    await publicClient.call({
      account: tx.from,
      to: tx.to,
      data: tx.input,
      value: tx.value,
      gas: tx.gas,
      gasPrice: tx.gasPrice,
    })
    return null
  } catch (error) {
    return extractReadableError(error)
  }
}

export async function sendRabbitBotChatMessage({
  content,
  score = 1n,
  replyToMessageId = 0n,
  twitterUsername = process.env.RABBITBOT_USERNAME || 'RabbitBot',
  twitterProfilePictureUrl = process.env.RABBITBOT_AVATAR_URL || '/img/default-avatar.jpg'
}) {
  if (!content || typeof content !== 'string') {
    throw new Error('RabbitBot content is required')
  }

  const { account, walletClient, publicClient } = getRabbitBotWallet()

  const nonce = buildRabbitBotNonce()
  const finalScore = BigInt(score)
  const finalReplyToMessageId = BigInt(replyToMessageId)

  const signature = await signMessageChat(
    account.address,
    content,
    finalScore,
    nonce
  )

  const txHash = await walletClient.writeContract({
    account,
    address: DIGIT_RABBITS_ADDRESS,
    abi: DIGIT_RABBITS_ABI,
    functionName: 'sendChatMessage',
    args: [
      content,
      finalScore,
      nonce,
      twitterUsername,
      twitterProfilePictureUrl,
      signature,
      finalReplyToMessageId
    ],
    chain: megaeth,
    gas: BigInt(process.env.RABBITBOT_CHAT_GAS_LIMIT || '30000000')
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  if (receipt.status === 'reverted') {
    const revertReason = await extractRevertReasonFromTxHash(publicClient, txHash)
    throw new Error(`RabbitBot chat transaction reverted${revertReason ? `: ${revertReason}` : ''}`)
  }

  return { txHash, receipt, sender: account.address }
}

export async function sendRabbitBotAwardPoints({
  userAddress,
  amount,
  reason = 'RabbitBot reward'
}) {
  if (!userAddress) {
    throw new Error('userAddress is required')
  }

  const rewardAmount = BigInt(amount)
  if (rewardAmount <= 0n) {
    throw new Error('amount must be > 0')
  }

  const { account, walletClient, publicClient } = getRabbitBotWallet()

  const txHash = await walletClient.writeContract({
    account,
    address: DIGIT_RABBITS_CHAT_ADDRESS,
    abi: DIGIT_RABBITS_CHAT_ABI,
    functionName: 'awardPoints',
    args: [userAddress, rewardAmount, reason],
    chain: megaeth,
    gas: BigInt(process.env.RABBITBOT_AWARD_GAS_LIMIT || '300000')
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  if (receipt.status === 'reverted') {
    throw new Error('RabbitBot award transaction reverted')
  }

  return { txHash, receipt }
}


export {
  initializeBackendWallet,
  initializeRabbitBotWallet,
  getBackendWallet,
  getRabbitBotWallet,
  signMessage,
  signMessageChat,
  signMessageQuests
};
