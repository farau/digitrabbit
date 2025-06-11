const abi = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
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
          "name": "points",
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
          "internalType": "uint8[6][]",
          "name": "itemsList",
          "type": "uint8[6][]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint8[6]",
          "name": "items",
          "type": "uint8[6]"
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
          "internalType": "uint8[6]",
          "name": "items",
          "type": "uint8[6]"
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
          "internalType": "uint8[6]",
          "name": "items",
          "type": "uint8[6]"
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
          "name": "sessionEndsAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lastSessionEndedAt",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
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
    }
];

export default abi;