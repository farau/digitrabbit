"use client";
import { usePrivy, Captcha } from '@privy-io/react-auth'
import { useLogin } from '@privy-io/react-auth';
import { useGame } from '@/context'

function LogoutButton() {
    const { ready, authenticated, logout } = usePrivy();

    // Disable logout when Privy is not ready or the user is not authenticated
    const disableLogout = !ready || (ready && !authenticated);

    return (
        <button disabled={disableLogout} onClick={logout}>
            Log out
        </button>
    );
}

function LoginButton() {
    const { ready, authenticated } = usePrivy();
    const { login } = useLogin();

    // Disable login when Privy is not ready or the user is already authenticated
    const disableLogin = !ready || (ready && authenticated);


    const handleLogin = async () => login({
        loginMethods: ['twitter'],
        walletChainType: 'ethereum',
        disableSignup: false,
        onError: (error) => {
            console.error('Login error:', error);
        }
    })

    return (
        <>
            <button disabled={disableLogin} onClick={handleLogin}>
                Log in
            </button >
            <Captcha />
        </>
    );
}


const WalletButton = () => {

    const { ready, authenticated } = usePrivy();
    // Disable login when Privy is not ready or the user is already authenticated
    const disableLogin = !ready || (ready && !authenticated);
    const { embeddedWallet } = useGame();

    return (
        <div>
            <div>
                {authenticated ? (
                    <LogoutButton />
                ) : (
                    <LoginButton />
                )}
            </div>
        </div>
    );
};

export default WalletButton;