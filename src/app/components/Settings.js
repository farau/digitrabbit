'use client';
import { useState } from 'react';
import {
  Sun, Moon, Volume2, VolumeX, Volume, Sparkles, Music
} from 'lucide-react';

import { useTheme, useGame } from '@/context';
import Wrapper from './Wrapper';
import { useLinkAccount, usePrivy } from '@privy-io/react-auth';
import { useBalance } from 'wagmi';


function ExportWalletButton() {
  const { ready, authenticated, user, exportWallet } = usePrivy();
  // Check that your user is authenticated
  const isAuthenticated = ready && authenticated;
  // Check that your user has an embedded wallet
  const hasEmbeddedWallet = !!user.linkedAccounts.find(
    (account) =>
      account.type === 'wallet' &&
      account.walletClientType === 'privy' &&
      account.chainType === 'ethereum'
  );

  return (
    <button className='mt-2' onClick={exportWallet} disabled={!isAuthenticated || !hasEmbeddedWallet}>
      Export my wallet
    </button>
  );
}

function AllLinkedWallets() {

  const { themeMode } = useTheme();
  const isNight = themeMode === 'dark';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';
  const borderColor = isNight ? '#444' : '#ddd';
  const textColor = isNight ? 'text-white' : 'text-black';
  const subTextColor = isNight ? 'text-zinc-400' : 'text-gray-600';

  const { embeddedWallet, isValidating, validationError } = useGame()
  const { user } = usePrivy();

  // Error and loading states
  if (isValidating) {
    return (
      <Wrapper>
        <div style={{
          background: cardBg,
          padding: '20px',
          borderRadius: '10px',
          border: `1px solid ${borderColor}`,
          boxShadow,
          textAlign: 'center',
          margin: '20px'
        }}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="break-all">
              Validating your wallet... Please wait.
            </p>
          </div>
        </div>
      </Wrapper>
    )
  }

  if (validationError) {
    return (
      <Wrapper>
        <div style={{
          background: cardBg,
          padding: '20px',
          borderRadius: '10px',
          border: `1px solid ${borderColor}`,
          boxShadow,
          textAlign: 'center',
          margin: '20px'
        }}>
          <div className="flex items-center justify-center gap-3 text-red-700">
            <p className="break-all">
              {validationError}
            </p>
          </div>
        </div>
      </Wrapper>
    )
  }


  const allWallets = user?.linkedAccounts.filter(
    (account) => account.type === 'wallet' && account.walletClientType !== 'privy'
  ) || [];

  return embeddedWallet && (
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
              <code className="block text-xs bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-md text-gray-900 dark:text-white break-words select-none mb-1">
                {wallet.address}
              </code>
              <p className={`text-base ${subTextColor}`}>Type: {wallet.walletClientType}</p>
              <p className={`text-base ${subTextColor}`}>First linked: {new Date(wallet.firstVerifiedAt).toLocaleDateString()}</p>
              <UnlinkButton addressToUnlink={wallet.address} />
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-base italic ${subTextColor} mb-2`}>No wallets have been linked to this account.</p>
      )}
      <LinkButton />
    </div>
  );
}

function LinkButton() {
  const { linkWallet } = useLinkAccount();

  return (
    <div className="link-options mb-4">
      <p className='text-base mb-2'>Link wallets containing &quot;partnerships&quot; NFTs to get bonuses.</p>
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

export default function Settings({ sound, setSound, volume, setVolume, volumePlayer, setVolumePlayer }) {
  const { themeMode, toggleTheme, show3DEffects, toggle3DEffects } = useTheme();
  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'
  const borderColor = isNight ? '#444' : '#ddd'

  const [copied, setCopied] = useState(null);
  const { ready, authenticated } = usePrivy();
  const { embeddedWallet, isValidating, validationError } = useGame();

  if (!ready) return;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };


  const sounds = ['crying', 'McDonald’s Beeping', 'robot', 'Yeah Boi', 'One Piece Brooks Laugh', 'Sponge Bob', 'cat', 'sheep'];

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

      {/* 3D Effects Toggle hidden on Mobile  */}
      <div className="hidden md:flex items-center justify-between mb-6">
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

      {/* Main Music Sound Selector - Hidden on mobile */}
      <div className="hidden md:block mt-4 mb-4">
        <div className="block mb-2 text-base font-medium flex items-center gap-2">
          <Music className="w-5 h-5 text-indigo-500" />
          Main Music
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-4 px-1">
            <VolumeX className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 relative group">
              {/* Track background */}
              <div className={`w-full h-3 rounded-full shadow-inner
          ${themeMode === 'light'
                  ? 'bg-gradient-to-r from-gray-200 to-gray-300'
                  : 'bg-gradient-to-r from-gray-700 to-gray-600'
                }`}
              />

              {/* Progress fill with gradient */}
              <div
                className="absolute top-0 left-0 h-3 rounded-full pointer-events-none transition-all duration-300 ease-out
            bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600 shadow-md
            group-hover:shadow-lg group-hover:from-indigo-500 group-hover:to-indigo-700"
                style={{ width: `${volumePlayer * 100}%` }}
              />

              {/* Invisible input overlay */}
              <input
                type="range"
                min={0}
                max={100}
                value={volumePlayer * 100}
                onChange={(e) => setVolumePlayer(Number(e.target.value) / 100)}
                className="absolute top-0 left-0 w-full h-3 opacity-0 cursor-pointer"
              />

              {/* Custom thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg 
            border-2 border-indigo-500 pointer-events-none transition-all duration-200
            group-hover:scale-110 group-hover:border-indigo-600 group-hover:shadow-xl"
                style={{ left: `calc(${volumePlayer * 100}% - 10px)` }}
              >
                <div className="w-full h-full bg-indigo-500 rounded-full scale-50 group-hover:bg-indigo-600 transition-colors" />
              </div>
            </div>
            <Volume2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className={`text-sm font-bold min-w-[3rem] text-center px-3 py-2 rounded-lg shadow-sm border
        ${themeMode === 'light'
                ? 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 border-gray-200'
                : 'bg-gradient-to-br from-gray-800 to-gray-700 text-gray-200 border-gray-600'
              }`}>
              {Math.round(volumePlayer * 100)}%
            </div>
          </div>
        </div>
      </div>


      {/* Sound Selector - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-between mb-4">
        <div className="text-base font-medium flex items-center gap-2">
          <Music className="w-5 h-5 text-green-500" />
          <span>Rabbitio Sound</span>
        </div>
        <select
          value={sound}
          onChange={(e) => setSound(e.target.value)}
          className={`w-48 p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm
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

      {/* Volume Control - Hidden on mobile*/}
      <div className="hidden md:block space-y-3">
        <div className="flex items-center gap-4 px-1">
          <VolumeX className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div className="flex-1 relative group">
            {/* Track background */}
            <div className={`w-full h-3 rounded-full shadow-inner
          ${themeMode === 'light'
                ? 'bg-gradient-to-r from-gray-200 to-gray-300'
                : 'bg-gradient-to-r from-gray-700 to-gray-600'
              }`}
            />

            {/* Progress fill with gradient */}
            <div
              className="absolute top-0 left-0 h-3 rounded-full pointer-events-none transition-all duration-300 ease-out
                     bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600 shadow-md
                     group-hover:shadow-lg group-hover:from-indigo-500 group-hover:to-indigo-700"
              style={{ width: `${volume * 100}%` }}
            />

            {/* Invisible input overlay */}
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="absolute top-0 left-0 w-full h-3 opacity-0 cursor-pointer"
            />

            {/* Custom thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg 
                     border-2 border-indigo-500 pointer-events-none transition-all duration-200
                     group-hover:scale-110 group-hover:border-indigo-600 group-hover:shadow-xl"
              style={{ left: `calc(${volume * 100}% - 10px)` }}
            >
              <div className="w-full h-full bg-indigo-500 rounded-full scale-50 group-hover:bg-indigo-600 transition-colors" />
            </div>
          </div>
          <Volume2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div className={`text-sm font-bold min-w-[3rem] text-center px-3 py-2 rounded-lg shadow-sm border
        ${themeMode === 'light'
              ? 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 border-gray-200'
              : 'bg-gradient-to-br from-gray-800 to-gray-700 text-gray-200 border-gray-600'
            }`}>
            {Math.round(volume * 100)}%
          </div>
        </div>
      </div>

      {/* Wallet Section */}

      {
        isValidating && (
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="break-all">
              Validating your wallet... Please wait.
            </p>
          </div>
        )
      }

      {
        validationError && (
          <div className="flex items-center justify-center gap-3 text-red-700">
            <p className="break-all">
              {validationError}
            </p>
          </div>
        )
      }

      {
        ready && authenticated && embeddedWallet && (
          <div className="mt-8 border-t border-gray-200 dark:border-zinc-700 pt-6">
            {[
              { label: 'Embedded Wallet', wallet: embeddedWallet, type: 'embedded' }].map(
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
                        <code className="flex-1 min-w-0 text-xs bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-md text-gray-900 dark:text-white break-words select-none">
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
                          <ExportWalletButton />
                          <AllLinkedWallets />
                        </>
                      )}
                    </div>
                  )
              )}
          </div>
        )
      }

    </Wrapper >
  );
}