import { megaethTestnet } from 'viem/chains';
import { http } from 'wagmi';
import { createConfig } from '@privy-io/wagmi';

// Replace these with your app's chains

export const wagmiConfig = createConfig({
  chains: [megaethTestnet],
  transports: {
    [megaethTestnet.id]: http("https://timothy.megaeth.com/rpc?vip=1&u=digitrabbits%20v2&v=5184000&s=mafia&verify=" + process.env.NEXT_PUBLIC_RPC_KEY)
  },
});