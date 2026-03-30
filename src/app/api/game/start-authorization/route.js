// app/api/game/start-authorization/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseAbi, keccak256, encodePacked } from 'viem';
import { verifyAndGetUser } from '@/lib/privyClient';
import { publicClientMegaMainnet } from '@/utils/chainConfig';
import { signMessageStartGame } from '@/lib/walletBackend';

// ERC721 ABI
const erc721Abi = parseAbi([
    'function balanceOf(address owner) view returns (uint256)'
]);

const NFT_ADDRESS = process.env.ERC721_DIGIT_RABBITS_CONTRACT_ADDRESS;

/**
 * Vérifier si un utilisateur possède le NFT requis
 */
async function checkNFTOwnership(user) {
    try {
        const allAddresses = [];

        if (user.wallet?.address) {
            allAddresses.push(user.wallet.address);
        }

        if (user.linkedAccounts) {
            user.linkedAccounts.forEach(account => {
                if (account.type === 'wallet' && account.address) {
                    allAddresses.push(account.address);
                }
            });
        }

        console.log(`Checking NFT ownership for user ${user.id}`);
        console.log(`Addresses to check: ${allAddresses.join(', ')}`);

        const balances = await publicClientMegaMainnet.multicall({
            contracts: allAddresses.map(address => ({
                address: NFT_ADDRESS,
                abi: erc721Abi,
                functionName: 'balanceOf',
                args: [address],
            })),
        });
        const totalBalance = balances.reduce((sum, b) => sum + BigInt(b.result), 0n);

        if (totalBalance > 0n) {
            return true;
        }
        else {
            return false;
        }

    } catch (error) {
        console.error('Error checking NFT ownership:', error);
        return false;
    }
}


/**
 * POST /api/game/start-authorization
 */
export async function POST(request) {
    try {
        const { embeddedWalletAddress } = await request.json();

        // 1. Get identity token from cookie
        const cookieStore = await cookies();
        const idToken = cookieStore.get('privy-id-token')?.value;

        if (!idToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Extraire le userId de Privy
        const user = await verifyAndGetUser(idToken);

        // Vérifier que l'adresse correspond à l'utilisateur connecté
        const embeddedWallet = user.linkedAccounts.find(
            (account) => account.type === 'wallet' && account.walletClientType === 'privy'
        );
        const address = embeddedWallet.address;

        const normalizedPlayerAddress = embeddedWalletAddress.toLowerCase();
        // On autorise que si l'adresse playerAddress est bien celle de l'embeddedwallet
        const isAuthorized = address.toLowerCase() === normalizedPlayerAddress;

        if (!isAuthorized) {
            return NextResponse.json({
                success: false,
                error: 'Address does not belong to authenticated user'
            }, { status: 403 });
        }

        // 2. Vérifier la possession du NFT sur tous les wallets
        const hasNFT = await checkNFTOwnership(user);

        if (!hasNFT) {
            return NextResponse.json(
                {
                    error: 'NFT_NOT_FOUND',
                    message: 'You need to own the required NFT to play',
                    requiredNFT: process.env.ERC721_DIGIT_RABBITS_CONTRACT_ADDRESS
                },
                { status: 403 }
            );
        }

        // 3. Générer un nonce unique
        const nonce = Date.now() + Math.floor(Math.random() * 1000000);

        // 4. Signer l'autorisation
        const signature = await signMessageStartGame(
            embeddedWalletAddress,
            nonce
        );


        return NextResponse.json({
            success: true,
            nonce,
            signature,
            message: 'NFT verified, you can start the game'
        });

    } catch (error) {
        console.error('Error in startGameAuthorization:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}