import { PrivyClient } from '@privy-io/server-auth';

// Initialiser l'API Privy pour vérifier les tokens
export const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);
