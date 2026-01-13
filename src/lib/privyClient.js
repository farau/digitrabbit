import { PrivyClient } from '@privy-io/server-auth';

// Initialiser l'API Privy pour vérifier les tokens
export const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);

export async function verifyAndGetUser(idToken) {
    try {
        // This verifies the token signature and parses the payload
        const user = await privy.getUser({ idToken });
        return user;
    } catch (error) {
        console.error('Invalid identity token:', idToken, error);
        throw new Error('Authentication failed', idToken);
    }
}