// src/app/test-megaeth/page.tsx
'use client'

import styles from './Game.module.css'
import { useState, useEffect, useRef, useCallback } from 'react'
import { megaethTestnet } from 'viem/chains'
import { Loader2 } from 'lucide-react'
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, COOLDOWN_SECONDS } from '@/constants'
import { encodeFunctionData } from 'viem'

import React from 'react'
import Wrapper from './Wrapper'
import { getWalletClient } from '@/utils/walletClient';
// Rabbit 3D model
import RabbitModel from './RabbitModel'


const NETWORKS = [
  {
    id: 'select',
    name: 'Select Network',
    color: 'gray',
    chainId: 0,
    endpoint: ''
  },
  {
    id: 'megaeth',
    name: 'MegaETH',
    color: 'yellow',
    chainId: 6342,
    endpoint: 'realtime_sendRawTransaction'
  },]

const play = encodeFunctionData({
  abi: DIGIT_RABBITS_ABI,
  functionName: 'play',
  args: []
})


function PlayerData({ refreshCounter, themeMode, seasonId, playerData, embeddedWallet }) {

  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // On destructure les données de la props
  const { rabbitPoints, playerItems, totalClicks, sessionEndsAt, boost } = playerData


  useEffect(() => {
    if (
      sessionEndsAt === null ||
      sessionEndsAt === undefined
    ) return;

    if (sessionEndsAt === 0n || sessionEndsAt === 0) { // parfois BigInt 0n
      setCooldownRemaining(0);
      return;
    }

    const cooldownEnd = Number(sessionEndsAt) + COOLDOWN_SECONDS;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(cooldownEnd - now, 0);
      setCooldownRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sessionEndsAt]);



  if (!playerData) return <p>Loading player data...</p>;

  return (
    <div className="mb-8 text-center">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm sm:text-base">
        {/* RabbitPoints */}
        <div
          className={`p-4 rounded-xl shadow border transition-all ${themeMode === 'light'
            ? 'bg-yellow-100 text-black border-yellow-300'
            : 'bg-yellow-800 text-white border-yellow-600'
            }`}
        >
          <p className="text-xs opacity-70">RabbitPoints</p>
          <p className="text-xl font-bold">
            {rabbitPoints}
          </p>
        </div>

        {/* Total Clicks */}
        <div
          className={`p-4 rounded-xl shadow border transition-all ${themeMode === 'light'
            ? 'bg-blue-100 text-black border-blue-300'
            : 'bg-blue-800 text-white border-blue-600'
            }`}
        >
          <p className="text-xs opacity-70">Total Clicks</p>
          <p className="text-xl font-bold">
            {totalClicks}
          </p>
        </div>

        {/* Cooldown */}
        <div
          className={`p-4 rounded-xl shadow border transition-all ${cooldownRemaining > 0
            ? themeMode === 'light'
              ? 'bg-gray-200 text-black border-gray-300'
              : 'bg-gray-800 text-white border-gray-600'
            : themeMode === 'light'
              ? 'bg-green-200 text-black border-green-400'
              : 'bg-green-800 text-white border-green-600'
            }`}
        >
          <p className="text-xs opacity-70">Cooldown</p>
          <p className="text-l font-bold">
            {cooldownRemaining > 0
              ? new Date(cooldownRemaining * 1000).toISOString().substr(11, 8)
              : 'Ready 🟢'}
          </p>
        </div>

        {/* Boost */}
        <div
          className={`p-4 rounded-xl shadow border transition-all ${themeMode === 'light'
            ? 'bg-pink-100 text-black border-pink-300'
            : 'bg-pink-800 text-white border-pink-600'
            }`}
        >
          <p className="text-xs opacity-70">Boost</p>
          <p className="text-xl font-bold">{boost}%</p>
        </div>
      </div>
    </div>
  );
}

export default function Game({ isTimeExpired, setIsTimeExpired, isGameStarted, setIsGameStarted, themeMode, refreshCounter, setRefreshCounter, playerData, embeddedWallet }) {
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [transactionHistory, setTransactionHistory] = useState([])
  const [isWritingContract, setIsWritingContract] = useState(false)

  const clientRef = useRef(null)
  // Initialiser et stocker le client à chaque fois que embeddedWallet change
  // Réinitialiser les historiques de transactions, erreurs et results aussi
  useEffect(() => {
    try {
      setResult('')
      setError('')
      setTransactionHistory([])
      const client = getWalletClient();
      clientRef.current = client;
    } catch (err) {
      console.warn('walletClient uninitialized');
    }
  }, [embeddedWallet]);

  // Contract interaction
  const handleStartGame = async () => {
    try {
      const walletClient = clientRef.current
      if (!walletClient || !embeddedWallet || !embeddedWallet.address) {
        setError('No embedded wallet or address')
        return
      }

      console.log(`Starting game on MegaETH Testnet...`)

      setError('')
      setIsWritingContract(true)

      const startTime = performance.now()

      const result = await walletClient.writeContract({
        account: embeddedWallet.address,
        address: DIGIT_RABBITS_ADDRESS,
        abi: DIGIT_RABBITS_ABI,
        functionName: 'startGame',
        args: [],
        chain: megaethTestnet
      })

      if (!result) {
        throw new Error('Failed to start game')
      }

      console.log(`Game started with hash: ${result}`)
      setIsGameStarted(true)
      const endTime = performance.now()
      const timeTaken = Math.round(endTime - startTime)

      setResult(`Hash: ${result.transactionHash || result}\nTime: ${timeTaken}ms`)
      setTransactionHistory(prev => [
        {
          network: 'MegaETH',
          hash: result || 'N/A',
        },
        ...prev.slice(0, 9) // Keep only last 10
      ])
    } catch (error) {
      console.error('Contract write failed:', error)
      setError(error.message)
      setIsGameStarted(false)
    } finally {
      setIsWritingContract(false)
      setIsTimeExpired(false)
      setRefreshCounter(c => c + 1)
    }
  }

  const defineGasPrice = async (walletClient) => {
    try {
      const networkGasPrice = await walletClient.getGasPrice()
      return {
        gasPrice: networkGasPrice,
        gasLimit: 100000n // Default gas limit for simple transactions
      }
    } catch (error) {
      console.warn('⚠️ Failed to get gas price, using fallback:', error)
      // Fallback to very low prices for testnets
      return {
        gasPrice: 1000000000n, // 1 gwei
        gasLimit: 50000n // Lower limit for testnets
      }
    }
  }

  // Fixed execution with proper refill trigger
  const executeTransaction = async () => {
    setIsExecuting(true)
    setError('')
    setResult('')

    try {
      const walletClient = clientRef.current
      if (!walletClient) return null
      if (!embeddedWallet?.address) throw new Error('Wallet address missing')

      // Récupère le nonce actuel
      const currentNonce = await walletClient.getTransactionCount({
        address: embeddedWallet.address,
        blockTag: "pending"
      })

      // Get actual gas price from network and apply smart adjustments
      const { gasPrice, gasLimit } = await defineGasPrice(walletClient)

      console.log(`Executing transaction to play the game...`)
      // 2. Construire la transaction (sans signature)
      const tx = {
        account: embeddedWallet.address,
        to: DIGIT_RABBITS_ADDRESS,
        data: play,
        nonce: currentNonce,
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: gasPrice / 10n, // 10% tip
        type: 'eip1559',
        gas: gasLimit,
      }

      const startTime = performance.now()

      // 3. Signer la transaction
      const signedTx = await walletClient.signTransaction(tx)

      // 4. Envoyer la transaction signée avec realtime_sendRawTransaction
      const result = await walletClient.request({
        method: 'realtime_sendRawTransaction',
        params: [signedTx],
      })


      if (!result) {
        throw new Error('Failed to play the game')
      }

      const endTime = performance.now()
      const timeTaken = Math.round(endTime - startTime)

      setResult(`Hash: ${result.transactionHash || result}\nTime: ${timeTaken}ms`)
      setTransactionHistory(prev => [
        {
          network: 'MegaETH',
          hash: result.transactionHash || result || 'N/A',
          time: timeTaken
        },
        ...prev.slice(0, 9),
      ])
    } catch (err) {
      console.error('❌ Error executing:', err)
      setError(err.message)
    } finally {
      setIsExecuting(false)
      setRefreshCounter(c => c + 1)
    }
  }

  const clearHistory = () => {
    setTransactionHistory([])
  }

  return embeddedWallet ? (
    <Wrapper>
      <div className={`flex flex-col items-center text-center justify-start pt-28 p-4 sm:p-8 ${styles.bgBackground}`} >

        {/* Player Info */}
        <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          <PlayerData refreshCounter={refreshCounter} themeMode={themeMode} playerData={playerData} embeddedWallet={embeddedWallet} />
        </div>

        <div className="mb-4 relative w-full flex items-center justify-center">
          {/* 🐰 Le modèle interactif */}
          <div className="z-50 relative cursor-pointer">
            <RabbitModel
              isClicked={() => {
                if (isGameStarted && !isExecuting) {
                  executeTransaction();
                  setRefreshCounter(c => c + 1);
                }
              }}
            />
            {result && (
              result.split('\n').map((line, index) => {
                if (line.startsWith('Hash:')) {
                  const hash = line.replace('Hash: ', '');
                  const getExplorerUrl = (hash) => `https://web3.okx.com/explorer/megaeth-testnet/tx/${hash}`
                  // Fallback to 'megaeth' since selectedNetwork is not defined in this scope
                  const explorerUrl = getExplorerUrl('megaeth', hash);

                  return (
                    <a
                      key={hash}
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-4 left-[71%] px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded shadow hover:bg-green-200 dark:hover:bg-green-800 transition-all cursor-pointer z-20 w-[180px]"
                    >
                      ✅ Transaction Successful
                    </a>
                  );
                }
                return null;
              })
            )}
          </div>
        </div>


        {/* Start Game Button */}
        <div className="mb-10">
          <button
            onClick={() => {
              handleStartGame();
              setRefreshCounter(c => c + 1);
            }}
            disabled={isExecuting || isGameStarted}
            className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold text-lg transition-all duration-200 hover:bg-green-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed z-10"
          >
            {isExecuting ? (
              <>
                <Loader2 className="animate-spin inline mr-2" size={20} />
                Executing transaction...
              </>
            ) : (
              `Start Game`
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100/70 dark:bg-red-900/70 rounded-lg max-w-2xl text-left backdrop-blur-sm">
          <h4 className="text-red-700 dark:text-red-300 break-all">❌ Error :</h4>
          <p className="text-red-700 dark:text-red-300 break-all">{error}</p>
        </div>
      )}

      {/* Scroll Indicator Floating */}
      {transactionHistory.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => {
              document.querySelector('.transaction-history-table')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-blue-600 text-white rounded-full px-4 py-3 shadow-lg hover:bg-blue-700 transition-all animate-pulse flex items-center gap-2"
          >
            <span className="text-sm font-medium">{transactionHistory.length} transaction{transactionHistory.length > 1 ? 's' : ''}</span>
            <span className="text-lg">↓</span>
          </button>
        </div>
      )}

      {/* Transaction History Table */}
      {transactionHistory.length > 0 && (
        <div className="w-full max-w-3xl mt-16">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Last {transactionHistory.length} Transaction{transactionHistory.length > 1 ? 's' : ''}
            </h3>
            <button
              onClick={clearHistory}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear History
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
            <table className="w-full text-sm transaction-history-table">
              <thead className="bg-gray-50 dark:bg-gray-800 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Network</th>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Hash</th>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactionHistory.map((tx, index) => {
                  const getExplorerUrl = (networkName, hash) =>
                    networkName.toLowerCase().includes('megaeth')
                      ? `https://web3.okx.com/explorer/megaeth-testnet/tx/${hash}`
                      : '#';

                  return (
                    <tr
                      key={`${tx.hash}-${index}`}
                      className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full bg-amber-600`} />
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{tx.network}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={getExplorerUrl(tx.network, tx.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-mono text-xs hover:underline"
                        >
                          {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                        </a>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className={`px-2 py-1 rounded-full text-xs ${tx.time < 200
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : tx.time < 500
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                          {tx.time}ms
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile scroll hint */}
          <div className="flex justify-center mt-2 md:hidden text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              ← <span>Scroll to see all columns</span> →
            </span>
          </div>
        </div>
      )}
    </Wrapper>
  ) : (
    <Wrapper><p>Please connect your wallet</p></Wrapper>
  )
}