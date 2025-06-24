// utils/walletClient.js
import { createWalletClient, custom, publicActions } from 'viem';
import { megaethTestnet } from 'viem/chains';
let client = null;

export const initWalletClient = async (embeddedWallet) => {
  if (!embeddedWallet?.address) throw new Error('Embedded wallet not connected');
  if (client) return client;

  const provider = await embeddedWallet.getEthereumProvider();
  if (!provider) throw new Error('No Ethereum provider found');

  client = createWalletClient({
    //@ts-ignore
    account: embeddedWallet.address,
    chain: megaethTestnet,
    transport: custom(provider),
  }).extend(publicActions);

  console.log('✅ walletClient initialized');
  return client;
};

export const getWalletClient = () => {
  if (!client) throw new Error('walletClient not initialized');
  return client;
};

export function clearWalletClient() {
  client = null;
}