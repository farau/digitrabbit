// lib/walletClient.js
import { createWalletClient, custom, publicActions } from 'viem';
import { megaethTestnet } from 'viem/chains';

// Configuration customisée du Megaeth Testnet avec une URL RPC spécifique
const customMegaethTestnet = {
  ...megaethTestnet,
  id: 6343, // Viem utilise 'id' plutôt que 'chainId'
  chainId: 6343, // Garder aussi chainId pour compatibilité
  name: 'MegaETH Testnet v2', // Optionnel mais recommandé
  rpcUrls: {
    default: {
      http: ['https://timothy.megaeth.com/rpc'],
    },
    public: {
      http: ['https://timothy.megaeth.com/rpc'],
    },
  },
};

let client = null;

export const initWalletClient = async (embeddedWallet) => {
  if (!embeddedWallet?.address) throw new Error('Embedded wallet not connected');
  if (client) return client;

  const provider = await embeddedWallet.getEthereumProvider();
  if (!provider) throw new Error('No Ethereum provider found');

  client = createWalletClient({
    //@ts-ignore
    account: embeddedWallet.address,
    chain: customMegaethTestnet,
    transport: custom(provider, { retryCount: 1 }), //nb de retry quand une tx fail
  }).extend(publicActions);

  console.log('✅ walletClient initialized');
  return client;
};

export function clearWalletClient() {
  client = null;

}