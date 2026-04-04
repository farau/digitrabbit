// /api/validate-wallet/route.js (Next.js 13+ App Router)
import { NextResponse } from 'next/server';
import { privy, verifyAndGetUser } from '@/lib/privyClient';
import { cookies } from 'next/headers';
import { consumeUserRateLimit } from '@/lib/upstashRateLimit';

// Cache pour éviter les appels répétés (optionnel)
const validationCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export async function POST(request) {
    try {
        // 1. Get identity token from cookie
        const cookieStore = await cookies();
        const idToken = cookieStore.get('privy-id-token')?.value;

        if (!idToken) {
            return NextResponse.json({ message: 'Authentication token missing' }, { status: 401 });
        }

        // 2. Parser le body
        const { walletAddress } = await request.json();

        if (!walletAddress) {
            return NextResponse.json(
                { isValid: false, message: 'Wallet address missing' },
                { status: 400 }
            );
        }

        // 3. Valider le format de l'adresse
        if (!isValidEthereumAddress(walletAddress)) {
            return NextResponse.json(
                { isValid: false, message: 'Invalid address format' },
                { status: 400 }
            );
        }

        // 4. Vérifier le cache (optionnel)
        const cacheKey = `${idToken}-${walletAddress}`;
        const cached = validationCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return NextResponse.json({
                isValid: cached.isValid,
                message: 'Validation from cache'
            });
        }

        // 5. Vérifier si le wallet appartient à l'utilisateur
        const user = await verifyAndGetUser(idToken);
        const walletMatch = user.linkedAccounts.find(
            (account) => account.type === 'wallet' &&
                account.walletClientType === 'privy' &&
                account.address.toLowerCase() === walletAddress.toLowerCase() // Le coeur de la vérification
        );

        const isValid = !!walletMatch;

        // 6. Vérifications supplémentaires de sécurité
        if (isValid) {
            // Vérifier que le wallet est actif
            const isWalletActive = await checkWalletStatus(walletAddress);
            if (!isWalletActive) {
                return NextResponse.json(
                    { isValid: false, message: 'Wallet inactive or compromised' },
                    { status: 403 }
                );
            }

            // Vérifier les limites de taux (rate limiting)
            const rateLimitCheck = await checkRateLimit(user.userId);
            if (!rateLimitCheck.allowed) {
                return NextResponse.json(
                    { isValid: false, message: 'Rate limit exceeded' },
                    { status: 429 }
                );
            }
        }

        // 7. Mettre en cache le résultat
        validationCache.set(cacheKey, {
            isValid,
            timestamp: Date.now()
        });

        // 8. Logger pour la sécurité
        console.log(`Wallet validation: ${walletAddress} for user ${user.id} - ${isValid ? 'SUCCESS' : 'FAILED'}`);

        // 9. Retourner le résultat
        return NextResponse.json({
            isValid,
            message: isValid ? 'Wallet successfully validated!' : 'Wallet not associated with user',
            walletType: walletMatch?.walletClient || null
        });

    } catch (error) {
        console.error('Erreur lors de la validation du wallet:', error);

        // Ne pas exposer les détails de l'erreur en production
        const isProduction = process.env.NODE_ENV === 'production';

        return NextResponse.json(
            {
                isValid: false,
                message: isProduction ? 'Validation error' : error.message
            },
            { status: 500 }
        );
    }
}

// Fonctions utilitaires

function isValidEthereumAddress(address) {
    // Vérifier le format basique d'une adresse Ethereum
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressRegex.test(address);
}

async function checkWalletStatus(walletAddress) {
    // Vérifier si le wallet n'est pas dans une liste noire
    // Vous pouvez implémenter vos propres vérifications ici

    try {
        // Exemple : vérifier contre une liste noire
        const blacklistedWallets = await getBlacklistedWallets();
        if (blacklistedWallets.includes(walletAddress.toLowerCase())) {
            return false;
        }
        return true;
    } catch (error) {
        console.error('Erreur lors de la vérification du statut du wallet:', error);
        return true; // Par défaut, considérer comme valide en cas d'erreur
    }
}

async function checkRateLimit(userId) {
    try {
        const maxRequests = 60; // 60 requêtes par heure
        const windowSeconds = 60 * 60; // 1 heure
        const result = await consumeUserRateLimit(userId, maxRequests, windowSeconds);
        if (!result.allowed) {
            return { allowed: false, resetTime: result.resetAt };
        }
        return { allowed: true, remaining: result.remaining };
    } catch (error) {
        console.error('Erreur lors de la vérification du rate limit:', error);
        return { allowed: true }; // Par défaut, autoriser en cas d'erreur
    }
}

async function getBlacklistedWallets() {
    // Récupérer la liste des wallets blacklistés depuis votre base de données
    // Exemple basique
    return [
        // Ajouter des adresses blacklistées ici
        '0x0000000000000000000000000000000000000000'
    ];
}


// Nettoyage du cache périodiquement
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of validationCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            validationCache.delete(key);
        }
    }
}, CACHE_DURATION);
