import { PrivyClient } from '@privy-io/server-auth';

function getPrivyClient() {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;

    if (!appId || !appSecret) {
        throw new Error('Privy environment variables are not configured');
    }

    return new PrivyClient(appId, appSecret);
}

// Initialiser l'API Privy pour vérifier les tokens
export const privy = getPrivyClient();

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
