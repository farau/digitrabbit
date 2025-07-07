// Import the PrivyClient
import { PrivyClient } from '@privy-io/server-auth';

// Replace with your actual App ID and App Secret
const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

// Initialize the Privy client
const privy = new PrivyClient(privyAppId, privyAppSecret);

async function fetchEmbeddedWallets() {
  console.log('Fetching all users and their embedded wallets...');

  try {
    // The getUsers method automatically handles pagination and returns all users.
    const users = await privy.getUsers();

    const walletData = users
      .map(user => {
        // Find the embedded wallet from the user's linked accounts.
        // An embedded wallet is identified by type 'wallet' and walletClient 'privy'.
        const embeddedWallet = user.linkedAccounts.find(
          (account) => account.type === 'wallet' && account.walletClient === 'privy'
        );

        // Return an object with the user's ID and their wallet address if found.
        return {
          walletAddress: embeddedWallet ? embeddedWallet.address : null,
        };
      })
      .filter(item => item.walletAddress !== null); // Filter out users without an embedded wallet.

    console.log('Found embedded wallets:');
    console.log(walletData);

    // Here, you can convert `walletData` to a CSV file or use it as needed.

  } catch (error) {
    console.error('An error occurred while fetching users:', error);
  }
}

fetchEmbeddedWallets();