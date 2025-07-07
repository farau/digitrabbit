'use client';
import { useState } from 'react';
import {
  Sun, Moon, Volume2, Copy, KeyRound, X, Check, EyeOff, Sparkles,
} from 'lucide-react';
import { useTheme } from '@/context';
import Wrapper from './Wrapper';
import { useWallets, useLinkAccount, usePrivy } from '@privy-io/react-auth';
import { useAccount, useBalance } from 'wagmi';

function AllLinkedWallets() {
  const { user } = usePrivy();
  const { themeMode } = useTheme();

  const isNight = themeMode === 'dark';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';
  const borderColor = isNight ? '#444' : '#ddd';
  const textColor = isNight ? 'text-white' : 'text-black';
  const subTextColor = isNight ? 'text-zinc-400' : 'text-gray-600';

  const allWallets = user?.linkedAccounts.filter(
    (account) => account.type === 'wallet' && account.walletClientType !== 'privy'
  ) || [];

  return (
    <div
      style={{
        background: cardBg,
        padding: '10px 15px',
        borderRadius: '10px',
        marginTop: 12,
        boxShadow,
        border: `1px solid ${borderColor}`,
      }}
    >
      <p className={`text-base font-semibold mb-3 ${textColor}`}>All historically linked wallets</p>

      {allWallets.length > 0 ? (
        <div>
          {allWallets.map((wallet) => (
            <div
              key={wallet.address}
              className="mb-4 pb-2 border-b border-dashed border-gray-300 dark:border-zinc-700 last:border-none last:pb-0"
            >
              <code className="block text-base bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-md text-gray-900 dark:text-white break-words select-none mb-1">
                {wallet.address}
              </code>
              <p className={`text-base ${subTextColor}`}>Type: {wallet.walletClientType}</p>
              <p className={`text-base ${subTextColor}`}>First linked: {new Date(wallet.firstVerifiedAt).toLocaleDateString()}</p>
              <UnlinkButton addressToUnlink={wallet.address} />
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-base italic ${subTextColor}`}>No wallets have been linked to this account.</p>
      )}
      <LinkButton />
      <p className={`text-base italic ${subTextColor}`}>Keep in mind that a user can only unlink an account if they have at least one other linked account remaining.</p>
    </div>
  );
}

function MyWalletList() {
  const { wallets } = useWallets();
  const { themeMode } = useTheme();

  const isNight = themeMode === 'dark';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';
  const borderColor = isNight ? '#444' : '#ddd';
  const textColor = isNight ? 'text-white' : 'text-black';
  const subTextColor = isNight ? 'text-zinc-400' : 'text-gray-600';

  if (!wallets || wallets.length === 0) return null;

  return (
    <div
      style={{
        background: cardBg,
        padding: '10px 15px',
        borderRadius: '10px',
        marginTop: 12,
        boxShadow,
        border: `1px solid ${borderColor}`,
      }}
    >
      <p className={`text-base font-semibold mb-3 ${textColor}`}>Active wallet</p>

      {wallets
        .filter((wallet) => wallet.walletClientType !== 'privy')
        .map((wallet) => (
          <div
            key={wallet.address}
            className="mb-4 pb-2 border-b border-dashed border-gray-300 dark:border-zinc-700 last:border-none last:pb-0"
          >
            <code className="block text-base bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-md text-gray-900 dark:text-white break-words select-none mb-1">
              {wallet.address}
            </code>
            <p className={`text-base ${subTextColor}`}>Chain ID: {wallet.chainId}</p>
            <p className={`text-base ${subTextColor}`}>Type: {wallet.walletClientType}</p>
          </div>
        ))}
    </div>
  );
}


function LinkButton() {
  const { linkWallet } = useLinkAccount();

  return (
    <div className="link-options mb-4">
      <p className='text-base'>Link wallets containing "partnerships" NFTs to get bonuses.</p>
      <button onClick={linkWallet}>Link Wallet</button>
    </div>
  );
}

// Make sure to pass the address of the wallet you want to unlink
function UnlinkButton({ addressToUnlink }) {
  const { unlinkWallet } = usePrivy();
  const [error, setError] = useState(null);

  const handleUnlink = async () => {
    try {
      await unlinkWallet(addressToUnlink);
      setError(null); // Clear previous error if any
    } catch (err) {
      console.error('Failed to unlink wallet:', err);
      setError(err.message || 'An unknown error occurred while unlinking.');
    }
  };

  return (
    <div className="unlink-options text-base mt-1">
      <button
        onClick={handleUnlink}
        className="text-base text-red-600 hover:underline transition-colors"
      >
        Unlink Wallet
      </button>

      {error && (
        <p className="text-base text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

function WalletBalance({ embeddedWallet, themeMode }) {
  const { data: balance, refetch: refetchBalance } = useBalance({
    address: embeddedWallet?.address,
  });

  if (!embeddedWallet?.address) {
    return (
      <div className="mt-2 text-base text-red-600 dark:text-red-400">
        ⚠️ No wallet connected
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="mt-2 text-base text-gray-500 dark:text-gray-400">
        Loading balance...
      </div>
    );
  }

  const hasBalance = balance?.value > 0n;
  const textColor = themeMode === 'dark' ? 'text-white' : 'text-black';

  return (
    <div className="mt-4 space-y-2">
      <p>
        Balance: {balance.formatted} {balance.symbol}
      </p>

      {!hasBalance && (
        <div className="space-y-2">
          <p className="text-red-600 dark:text-red-400 text-base font-medium">
            ⚠️ You need testnet tokens to interact

            <a
              href="https://testnet.megaeth.com/?faucet=true"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ml-2"
            >
              Get Tokens
            </a>

            <button
              onClick={refetchBalance}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-base font-medium ml-2"
            >
              Reload
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

export default function Settings({ sound, setSound, embeddedWallet }) {
  const { themeMode, toggleTheme, show3DEffects, toggle3DEffects } = useTheme();
  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'
  const borderColor = isNight ? '#444' : '#ddd'

  const { ready, authenticated, exportWallet } = usePrivy();

  const { wallets } = useWallets();
  const { user } = usePrivy();

  const [copied, setCopied] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [privateKey, setPrivateKey] = useState(null);
  const [showKey, setShowKey] = useState(false);

  if (!ready) return;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExportPrivateKey = async () => {
    try {
      const key = await exportWallet();
      setPrivateKey(key);
      setShowKey(true);
      setTimeout(() => {
        setShowKey(false);
      }, 8000);
    } catch (e) {
      console.error('Error exporting private key:', e);
    } finally {
      setShowConfirm(false);
    }
  };

  const embeddedWallet_ = wallets.find(
    (w) => w.walletClientType === 'privy' && w.address
  );

  const sounds = ['crying', 'robot', 'bird', 'cat', 'sheep', 'cow', 'rooster'];

  return (
    <Wrapper>
      {/* Theme Switch */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-base font-medium flex items-center gap-2">
          {themeMode === 'light' ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-blue-500" />
          )}
          <span>
            {themeMode === 'light' ? 'Currently in Day Mode' : 'Currently in Night Mode'}
          </span>
        </div>
        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-md bg-indigo-500 text-white text-base font-semibold shadow hover:bg-indigo-600 transition"
        >
          {themeMode === 'light' ? 'Switch to Night' : 'Switch to Day'}
        </button>
      </div>

      {/* 3D Effects Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-base font-medium flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <span>3D Effects</span>
        </div>
        <button
          onClick={toggle3DEffects}
          className="px-4 py-2 rounded-md bg-indigo-500 text-white text-base font-semibold shadow hover:bg-indigo-600 transition"
        >
          {show3DEffects ? 'Disable 3D Effects' : 'Enable 3D Effects'}
        </button>
      </div>

      {/* Sound Selector */}
      <div className="mb-6">
        <label className="block mb-2 text-base font-semibold flex items-center gap-2">
          <Volume2 className="w-4 h-4" /> Rabbitio Sound
        </label>
        <select
          value={sound}
          onChange={(e) => setSound(e.target.value)}
          className={`w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm
            ${themeMode === 'light'
              ? 'bg-white text-black border-gray-300'
              : 'bg-white text-black border-zinc-600'
            }`}
        >
          {sounds.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Wallet Section */}
      {ready && authenticated && (
        <div className="mt-8 border-t border-gray-200 dark:border-zinc-700 pt-6">
          <h4 className="text-md font-semibold mb-4">Wallets</h4>

          {[
            { label: 'Embedded Wallet', wallet: embeddedWallet_, type: 'embedded' }].map(
              ({ label, wallet, type }) =>
                wallet && (
                  <div
                    key={type}
                    style={{
                      background: cardBg,
                      padding: '10px 15px',
                      borderRadius: '10px',
                      marginBottom: 10,
                      boxShadow,
                      border: `1px solid ${borderColor}`,
                    }}
                  >
                    <p
                      className={
                        "text-base font-semibold mb-3 " +
                        (themeMode === "dark" ? "text-white" : "text-black")
                      }
                    >
                      {label}
                    </p>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <code className="flex-1 min-w-0 text-base bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-md text-gray-900 dark:text-white break-words select-none">
                        {wallet.address}
                      </code>
                      <button
                        onClick={() => handleCopy(wallet.address, type)}
                        aria-label={`Copy ${type} wallet address`}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        {copied === type ? (
                          <>
                            Copied!
                          </>
                        ) : (
                          'Copy'
                        )}
                      </button>

                    </div>

                    {type === 'embedded' && (
                      <>
                        <WalletBalance embeddedWallet={embeddedWallet} />
                        <button
                          onClick={() => setShowConfirm(true)}
                          className="mt-4 inline-flex items-center text-base font-semibold transition focus:outline-none focus:underline"
                        >
                          <KeyRound className="w-0 h-3.5" /> Export Private Key
                        </button>

                        {showKey && privateKey && (
                          <div className="mt-3 p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-base text-red-800 dark:text-red-300 break-words relative shadow-inner">
                            <EyeOff className="w-5 h-5 absolute top-3 right-3 opacity-60" />
                            {privateKey}
                          </div>
                        )}
                        <AllLinkedWallets />
                      </>
                    )}
                  </div>
                )
            )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-[90%] max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-semibold text-red-600 dark:text-red-400">
                Export Private Key
              </h4>
            </div>
            <p className="text-base text-gray-700 dark:text-gray-300 mb-5 leading-relaxed">
              Warning: your private key gives full access to your wallet. Do not share it with anyone.
              Are you sure you want to export it?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 text-base hover:bg-gray-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExportPrivateKey}
                className="px-4 py-2 rounded-md bg-red-600 text-white text-base hover:bg-red-700 transition"
              >
                Export anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </Wrapper>
  );
}