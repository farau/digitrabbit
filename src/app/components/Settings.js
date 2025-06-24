'use client';
import { useState } from 'react';
import {
  Sun, Moon, Volume2, Copy, KeyRound, X, Check, EyeOff,
} from 'lucide-react';
import { useTheme } from '@/context';
import Wrapper from './Wrapper';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';


export default function Settings({ sound, setSound }) {
  const { themeMode, toggleTheme } = useTheme();
  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';

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

  const embeddedWallet = wallets.find(
    (w) => w.walletClientType === 'privy' && w.address
  );
  const smartWallet = user?.linkedAccounts?.find((account) => account.type === 'smart_wallet');

  const sounds = ['crying', 'robot', 'bird', 'cat', 'sheep', 'cow', 'rooster'];

  return (
    <Wrapper>
      {/* Theme Switch */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-medium flex items-center gap-2">
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
          className="px-4 py-2 rounded-md bg-indigo-500 text-white text-sm font-semibold shadow hover:bg-indigo-600 transition"
        >
          {themeMode === 'light' ? 'Switch to Night' : 'Switch to Day'}
        </button>
      </div>

      {/* Sound Selector */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-semibold flex items-center gap-2">
          <Volume2 className="w-4 h-4" /> Rabbitio Sound
        </label>
        <select
          value={sound}
          onChange={(e) => setSound(e.target.value)}
          className={`w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm
            ${
              themeMode === 'light'
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

          {[{ label: 'Smart Wallet', wallet: smartWallet, type: 'smart' },
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
                  }}
                >
                  <p
                    className={
                      "text-sm font-semibold mb-3 " +
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
                      <button
                        onClick={() => setShowConfirm(true)}
                        className="mt-4 inline-flex items-center text-xs font-semibold transition focus:outline-none focus:underline"
                      >
                        <KeyRound className="w-0 h-3.5" /> Export Private Key
                      </button>

                      {showKey && privateKey && (
                        <div className="mt-3 p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-xs text-red-800 dark:text-red-300 break-words relative shadow-inner">
                          <EyeOff className="w-5 h-5 absolute top-3 right-3 opacity-60" />
                          {privateKey}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
          )}
          {/*<SignMessage />
          <SendTransactionButton />*/}
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
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-5 leading-relaxed">
              Warning: your private key gives full access to your wallet. Do not share it with anyone.
              Are you sure you want to export it?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 text-sm hover:bg-gray-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExportPrivateKey}
                className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 transition"
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
