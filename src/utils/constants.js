import { createPublicClient, http } from "viem"
import { megaethTestnet, mainnet } from "viem/chains"

export const publicClient = createPublicClient({
  chain: megaethTestnet,
  transport: http(), // Utilise l’URL par défaut ou ajoute une RPC custom ici
})

export const publicClientEth = createPublicClient({
  chain: mainnet,
  transport: http(), // Utilise l’URL par défaut ou ajoute une RPC custom ici
})

// Logo X officiel
export const XLogo = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`align-text-bottom inline ${className}`}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

// NFT Partners Collections on other chains
export const BADBUNNZ_ADDRESS_ETH = "0xbdb13add477e76c1df52192d4f5f4dd67f6a40d8"
export const MEGALIO_ADDRESS_ETH = "0x851b728e568c9e10ab8007f27a525fbbed29b259"


// Digit Rabbits smart contract on MegaETH Testnet
export const DIGIT_RABBITS_ADDRESS = process.env.NEXT_PUBLIC_DIGIT_RABBITS_ADDRESS
export const NUM_SLOTS = 5
export const MAX_LEVEL = 5
export const COOLDOWN_SECONDS = 2 * 60 * 60; // 2h cooldown

export const DIGIT_RABBITS_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "ECDSAInvalidSignature",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "length",
        "type": "uint256"
      }
    ],
    "name": "ECDSAInvalidSignatureLength",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "s",
        "type": "bytes32"
      }
    ],
    "name": "ECDSAInvalidSignatureS",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "by",
        "type": "address"
      }
    ],
    "name": "ContractPaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "by",
        "type": "address"
      }
    ],
    "name": "ContractUnpaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "seasonId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "clicks",
        "type": "uint256"
      }
    ],
    "name": "GamePlayed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "seasonId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "sessionEndsAt",
        "type": "uint256"
      }
    ],
    "name": "GameStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "slot",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      }
    ],
    "name": "ItemBought",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "seasonId",
        "type": "uint256"
      }
    ],
    "name": "PlayerAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "PointsClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "seasonId",
        "type": "uint256"
      }
    ],
    "name": "SeasonStarted",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "seasonId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "adminGrantPoints",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "slot",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      }
    ],
    "name": "buyItem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "nonce",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "claimPoints",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "nonce",
        "type": "uint256"
      }
    ],
    "name": "createMessageHash",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentSeasonId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllPlayersSeasonData",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "addresses",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "scores",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "totalClicks",
        "type": "uint256[]"
      },
      {
        "internalType": "uint8[5][]",
        "name": "itemsList",
        "type": "uint8[5][]"
      },
      {
        "internalType": "uint256[]",
        "name": "streak",
        "type": "uint256[]"
      },
      {
        "internalType": "bool[]",
        "name": "hasClaimedPoints",
        "type": "bool[]"
      },
      {
        "internalType": "uint256[]",
        "name": "maxClicks",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8[5]",
        "name": "items",
        "type": "uint8[5]"
      }
    ],
    "name": "getBoostPercent",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getPlayerCurrentSeasonData",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalClicks",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "gameClicks",
        "type": "uint256"
      },
      {
        "internalType": "uint8[5]",
        "name": "items",
        "type": "uint8[5]"
      },
      {
        "internalType": "uint256",
        "name": "sessionEndsAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "boostPercent",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "streak",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "hasClaimedPoints",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "maxClicks",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "seasonId",
        "type": "uint256"
      }
    ],
    "name": "getPlayerData",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalClicks",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "gameClicks",
        "type": "uint256"
      },
      {
        "internalType": "uint8[5]",
        "name": "items",
        "type": "uint8[5]"
      },
      {
        "internalType": "uint256",
        "name": "sessionEndsAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "boostPercent",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "streak",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "hasClaimedPoints",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "maxClicks",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "seasonId",
        "type": "uint256"
      }
    ],
    "name": "getPlayersCountInSeason",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "nonce",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "getSignatureInfo",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "messageHash",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "ethSignedMessageHash",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "recoveredSigner",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTopClicker",
    "outputs": [
      {
        "internalType": "address",
        "name": "topPlayer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "maxClicks",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalClicks",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "seasonId",
        "type": "uint256"
      }
    ],
    "name": "getTopClickerBySeason",
    "outputs": [
      {
        "internalType": "address",
        "name": "topPlayer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "maxClicks",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalClicks",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isPaused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "seasonId",
        "type": "uint256"
      }
    ],
    "name": "isPlayerInSeason",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pauseContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "play",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "playerExistsInSeason",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "playersPerSeason",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "seasonStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalClicks",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "gameClicks",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "sessionEndsAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "streak",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastStreakUpdate",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "hasClaimedPoints",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "maxClicks",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_newSigner",
        "type": "address"
      }
    ],
    "name": "setTrustedSigner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startSeason",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalClicksGame",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "trustedSigner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpauseContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "usedNonces",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "nonce",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "verifySignature",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]