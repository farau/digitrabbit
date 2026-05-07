import { megaeth } from 'viem/chains';
import { http } from 'wagmi';
import { createConfig } from '@privy-io/wagmi';

// Replace these with your app's chains

export const wagmiConfig = createConfig({
  chains: [megaeth],
  transports: {
    [megaeth.id]: http("https://mainnet.megaeth.com/rpc")
  },
});