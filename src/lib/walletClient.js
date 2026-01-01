// lib/walletClient.js
import { createWalletClient, custom, publicActions, http } from 'viem';
import { megaethTestnet } from 'viem/chains';
import { customMegaethTestnet } from '@/utils/constants';

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