import { createPublicClient, http, webSocket, parseAbi } from "viem"
import { megaethTestnet, mainnet, berachain } from "viem/chains"
// Configuration customisée du Megaeth Testnet avec une URL RPC spécifique
export const customMegaethTestnet = {
  ...megaethTestnet,
  id: 6343, // Viem utilise 'id' plutôt que 'chainId'
  chainId: 6343, // Garder aussi chainId pour compatibilité
  name: 'MegaETH Testnet v2', // Optionnel mais recommandé
  rpcUrls: {
    default: {
      http: ['https://carrot.megaeth.com/rpc'],
    },
    public: {
      http: ['https://carrot.megaeth.com/rpc'],
    },
  },
};

export const publicClient = createPublicClient({
  chain: customMegaethTestnet,
  transport: http('https://carrot.megaeth.com/rpc'),
})

export const wsPublicClient = createPublicClient({
  chain: customMegaethTestnet,
  transport: webSocket(
    'wss://carrot.megaeth.com/ws',
    {
      reconnect: { attempts: 10, delay: 3000 },
    }
  ),
})

export const publicClientEth = createPublicClient({
  chain: mainnet,
  transport: http(), // Utilise l’URL par défaut ou ajoute une RPC custom ici
})

export const publicClientBera = createPublicClient({
  chain: berachain,
  transport: http(), // Utilise l’URL par défaut ou ajoute une RPC custom ici
})


export const defineGasPrice = async (walletClient) => {
  try {
    let estimatedGas = await walletClient.estimateContractGas({
      account: embeddedWallet.address,
      address: DIGIT_RABBITS_ADDRESS,
      abi: DIGIT_RABBITS_ABI,
      functionName: 'play',
      args: [],
      chain: customMegaethTestnet
    });

    // Ajouter une marge de sécurité de 20%

    return {
      gasPrice: (estimatedGas * 120n) / 100n,
      gasLimit: 30000000n
    }

  } catch (error) {
    console.warn('⚠️ Failed to get gas price, using fallback:', error)
    return {
      gasPrice: 30000000n,
      gasLimit: 30000000n
    }
  }
}

// Digit Rabbits smart contract on MegaETH Testnet
export const DIGIT_RABBITS_ADDRESS = process.env.NEXT_PUBLIC_DIGIT_RABBITS_ADDRESS
export const DIGIT_RABBITS_CHAT_ADDRESS = process.env.NEXT_PUBLIC_DIGIT_RABBITS_CHAT_ADDRESS
export const NUM_SLOTS = 5
export const MAX_LEVEL = 5
export const COOLDOWN_SECONDS = 12 * 60 * 60; // 12h cooldown

export const DIGIT_RABBITS_ABI = parseAbi([
  // Season1 ABI - State variables
  'function totalClicksGame() external view returns (uint256)',
  'function currentSeasonId() external view returns (uint256)',

  // Season1 ABI - Functions
  'function startGame(uint256 nonce, bytes memory signature) external',
  'function play() external',
  'function claimPoints(uint256 amount, uint256 nonce, bytes memory signature) public',
  'function sendChatMessage(string calldata content, uint256 score, uint256 nonce, string calldata twitterUsername, string calldata twitterProfilePictureUrl, bytes memory signature, uint256 replyToMessageId) external',

  // Season1 ABI - Admin Functions
  'function startSeason() external',

  // Season1 ABI - View Functions
  'function getPlayerCurrentSeasonData(address user) external view returns (uint256 score, uint256 totalClicks, uint256 gameClicks, uint256 sessionEndsAt, uint256 streak, uint256 lastClaimTimestamp, uint256 maxClicks, uint256 gamePlayed)',
  'function getPlayerData(address user, uint256 seasonId) external view returns (uint256 score, uint256 totalClicks, uint256 gameClicks, uint256 sessionEndsAt, uint256 streak, uint256 lastClaimTimestamp, uint256 maxClicks, uint256 gamePlayed)',
  'function isPaused() external view returns (bool)',

  // Season1 ABI - Events
  'event GameStarted(address indexed player, uint256 seasonId, uint256 sessionEndsAt)',
  'event GamePlayed(address indexed player, uint256 seasonId, uint256 clicks)',
  'event PointsClaimed(address indexed player, uint256 amount)',
  'event SeasonStarted(uint256 indexed seasonId)',

  // Season1 ABI - Quest Functions & Events
  'function claimQuest(string calldata questId, string calldata periodKey, uint8 periodType, uint256 rewardAmount, uint256 nonce, bytes memory signature) external',
  'function canClaimQuest(address player, string calldata questId, uint8 periodType) external view returns (bool canClaim, uint256 remainingTime)',
  'function getLastQuestClaimTime(address player, string calldata questId) external view returns (uint256)',
  'function isQuestClaimed(address player, string calldata questId, string calldata periodKey) external view returns (bool)',
  'function getClaimedQuests(address player, string[] calldata questIds, string calldata periodKey) external view returns (bool[] memory)',
  'event QuestClaimed(address indexed player, string questId, string period, uint256 rewardAmount, uint256 timestamp)',
  'event QuestRewardCredited(address indexed player, uint256 amount, string questId)',

])

export const DIGIT_RABBITS_CHAT_ABI = parseAbi([
  // RabbitChat ABI - State variables
  'function currentSeasonId() external view returns (uint256)',
  'function messageCounter() external view returns (uint256)',
  'function trustedSigner() external view returns (address)',
  'function season1Contract() external view returns (address)',
  'function paused() external view returns (bool)',
  'function minMessageCooldown() external view returns (uint256)',
  'function maxMessageLength() external view returns (uint256)',

  // RabbitChat ABI - Core Functions (UPDATED: Added seasonId parameter)
  'function sendMessageFromSeason1(address user, string calldata content, uint256 score, uint256 nonce, string calldata twitterUsername, string calldata twitterProfilePictureUrl, bytes memory signature, uint256 replyToMessageId, uint256 seasonId) external returns (uint256)',

  // RabbitChat ABI - Admin Functions
  'function addModerator(address _user) external',
  'function removeModerator(address _user) external',
  'function pauseContract() external',
  'function unpauseContract() external',
  'function setSeason1Contract(address _newContract) external',
  'function setTrustedSigner(address _newSigner) external',
  'function setMinMessageCooldown(uint256 _seconds) external',
  'function setMaxMessageLength(uint256 _length) external',
  'function setRoleBonus(uint8 _role, uint256 _bonusPercent) external',
  'function syncSeasonFromSeason1(uint256 _newSeasonId) external', // ✅ NEW
  'function setCurrentSeason(uint256 _seasonId) external', // ✅ NEW

  // RabbitChat ABI - Moderator Functions
  'function promoteToConfirmedRabbit(address _user) external',
  'function demoteToRabbitMob(address _user) external',
  'function muteUser(address _user, uint256 _duration) external',
  'function unmuteUser(address _user) external',

  // RabbitChat ABI - Payment Functions
  'function buyConfirmedRabbit() external payable',
  'function withdraw() external',
  'function withdrawAmount(uint256 amount) external',
  'function getBalance() external view returns (uint256)',

  // RabbitChat ABI - View Functions (Current Season)
  'function getUserData(address user) external view returns (uint8 role, uint256 messageCount, uint256 totalScore, uint256 lastMessageTimestamp, bool canSendMessage, bool isMuted, uint256 muteExpiresAt)',
  'function getMessageCooldown(address user) external view returns (bool canSend, uint256 remainingTime)',
  'function getUserRole(address user) external view returns (uint8)',
  'function isModerator(address user) external view returns (bool)',
  'function isUserMuted(address user) external view returns (bool isMuted, uint256 expiresAt)',
  'function getRoleBonus(uint8 role) external view returns (uint256)',
  'function getTotalMessages() external view returns (uint256)',
  'function calculatePointsWithBonus(address user, uint256 baseScore) external view returns (uint256 totalPoints, uint256 bonus)',
  'function getUserMessageCountPerDay(address user, uint256 daysCount) external view returns (uint256[] memory)',
  'function getUserMessageCountInLastDays(address user, uint256 daysCount) external view returns (uint256)',

  // RabbitChat ABI - View Functions (Per-Season) ✅ NEW
  'function getUserDataForSeason(address user, uint256 seasonId) external view returns (uint8 role, uint256 messageCount, uint256 totalScore, uint256 lastMessageTimestamp, bool isMuted, uint256 muteExpiresAt)',
  'function getUserRoleForSeason(address user, uint256 seasonId) external view returns (uint8)',
  'function isModeratorForSeason(address user, uint256 seasonId) external view returns (bool)',
  'function getTotalMessagesForSeason(uint256 seasonId) external view returns (uint256)',
  'function getUserMessageCountPerDayForSeason(address user, uint256 seasonId, uint256 daysCount) external view returns (uint256[] memory)',
  'function getUserMessageCountInLastDaysForSeason(address user, uint256 seasonId, uint256 daysCount) external view returns (uint256)',

  // RabbitChat ABI - Message View Functions
  'function getMessage(uint256 messageId) external view returns (address sender, string memory content, uint256 timestamp, uint256 score, uint8 senderRole, uint256 replyToMessageId, uint256 seasonId)', // ✅ UPDATED: Added seasonId

  // RabbitChat ABI - Signature Functions
  'function createMessageHash(address user, string calldata content, uint256 score, uint256 nonce) public pure returns (bytes32)',
  'function verifySignature(address user, string calldata content, uint256 score, uint256 nonce, bytes memory signature) public view returns (bool)',

  // RabbitChat ABI - Events
  'event MessageSent(uint256 indexed messageId, address indexed sender, string content, uint256 score, uint8 senderRole, string twitterUsername, string twitterProfilePictureUrl, uint256 timestamp, uint256 replyToMessageId, uint256 indexed seasonId)', // ✅ UPDATED
  'event RoleChanged(address indexed user, uint8 oldRole, uint8 newRole, address indexed changedBy, uint256 indexed seasonId)', // ✅ UPDATED
  'event PointsAwarded(address indexed user, uint256 baseScore, uint256 bonusPoints, uint256 totalPoints, uint256 indexed seasonId)', // ✅ UPDATED
  'event UserMuted(address indexed user, uint256 duration, uint256 expiresAt, address indexed mutedBy, uint256 indexed seasonId)', // ✅ UPDATED
  'event UserUnmuted(address indexed user, address indexed unmutedBy, uint256 indexed seasonId)', // ✅ UPDATED
  'event ConfirmedRabbitPurchased(address indexed user, uint256 amountPaid)',
  'event FundsWithdrawn(address indexed to, uint256 amount)',
  'event ContractPaused(address indexed by)',
  'event ContractUnpaused(address indexed by)',
  'event Season1ContractUpdated(address indexed oldContract, address indexed newContract)',
  'event TrustedSignerUpdated(address indexed oldSigner, address indexed newSigner)',
  'event SeasonSynchronized(uint256 indexed newSeasonId)', // ✅ NEW
])

// ==================== HELPERS ====================

// Role names
export const ROLE_NAMES = {
  0: 'Rabbit Mob',
  1: 'Confirmed Rabbit',
  2: 'Moderator'
}

// Role badges
export const ROLE_BADGES = {
  0: '🐰',
  1: '✨🐰',
  2: '👑'
}

// Role colors (Tailwind classes)
export const ROLE_COLORS = {
  0: 'text-gray-400',
  1: 'text-blue-400',
  2: 'text-red-400'
}

// Helper: Format address
export const formatAddress = (address) => {
  if (!address) return '0x0000...0000'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Helper: Format timestamp
export const formatTimestamp = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString()
}