// src/app/test-megaeth/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { megaethTestnet } from 'viem/chains'
import { Loader2 } from 'lucide-react'
import { useWallets, getEmbeddedConnectedWallet } from '@privy-io/react-auth'
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, publicClient } from '@/constants'
import { encodeFunctionData, parseAbiItem } from 'viem'
import { usePrivy } from '@privy-io/react-auth'
import React from 'react'
import Wrapper from './Wrapper'
import { getWalletClient } from '@/utils/walletClient';
// Rabbit 3D model
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

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

const startGame = encodeFunctionData({
  abi: DIGIT_RABBITS_ABI,
  functionName: 'startGame',
  args: []
})

const seasonId = Number(await publicClient.readContract({
  address: DIGIT_RABBITS_ADDRESS,
  abi: DIGIT_RABBITS_ABI,
  functionName: 'currentSeasonId'
})) 

const COOLDOWN_SECONDS = 6 * 60 * 60; // 6h

function RabbitScene({ isClicked, sound }) {
  const headGltf = useGLTF("/3d/head-game");
  const cryGltf = useGLTF("/3d/cry-game");

  const modelRef = useRef();
  const soundRef = useRef(null);
  const [click, setClick] = useState(false)

  const targetScale = useRef(1.5);
  const scaleRef = useRef(1.5);
  const initialYRef = useRef(null);

  const clickIndex = useRef(1); // 🔁 index pour alterner les sons

  // Initialise Yref
  useEffect(() => {
    if (modelRef.current && initialYRef.current === null) {
      initialYRef.current = modelRef.current.position.y;
    }
  }, []);

  // Initialiser le son
  useEffect(() => {
    soundRef.current = new Audio(`/sounds/hit.mp3`);
    soundRef.current.volume = 0.4;
  }, [sound]);

  // Mouvement du modèle
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (modelRef.current) {
      modelRef.current.position.y += Math.sin(t * 1.5) * 0.005;

      targetScale.current = 1.4;
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale.current, 0.05);
      modelRef.current.scale.setScalar(scaleRef.current);
    }

  });

  // 🔊 Changer le son à chaque clic
  const handleModelClick = () => {
    setClick(true);
    isClicked();

    // Incrémente l’index cycliquement (de 1 à 5)
    clickIndex.current = ((clickIndex.current + 1) % 5) + 1;
    const nextSound = new Audio(`/sounds/hit${clickIndex.current}.mp3`);
    nextSound.volume = 0.4;
    nextSound.play();

    soundRef.current = nextSound;
  };

  const handleModelUp = () => {
    setClick(false)
  };

  // Garantit que si on sort du canva le clic se désactive (même si le clic reste actif)
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setClick(false);
    };

    window.addEventListener("pointerup", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, []);



  return (
    <>
      <ambientLight />
      <directionalLight position={[2, 2, 2]} />
      <group ref={modelRef} onPointerDown={handleModelClick} onPointerUp={handleModelUp}>
        <primitive object={click ? cryGltf.scene : headGltf.scene} dispose={null} />
      </group>
    </>
  );
}

function RabbitModel({ isClicked, sound }) {
  return (
    <div
        className="relative w-64 h-64 z-10 rounded-full shadow-xl overflow-hidden"
  style={{
    backgroundImage: 'url(/img/background_game.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }}
    >
      <Canvas camera={{ position: [0, 0, 3] }}>
        <RabbitScene isClicked={isClicked} sound={sound} />
      </Canvas>
    </div>
  );
}


function PlayerData({ refreshCounter, themeMode }) {
  const [data, setData] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const { wallets } = useWallets()
  const embeddedWallet = getEmbeddedConnectedWallet(wallets);

  async function fetchPlayerData() {

    let result;
    try {
      result = await publicClient.readContract({
        address: DIGIT_RABBITS_ADDRESS,
        abi: DIGIT_RABBITS_ABI,
        functionName: 'getPlayerData',
        args: [embeddedWallet?.address, seasonId],
      })
      } catch (err) {
      console.error('Failed to fetch player data:', err)
    } finally {
      return result
    }
  }

  useEffect(() => {
    async function fetchData() {
      const result = await fetchPlayerData();
      setData(result);
    }
    if (embeddedWallet?.address) {
      fetchData();
    }
  }, [embeddedWallet?.address, refreshCounter]); // <-- à chaque changement de ces props, on refait le fetch

  useEffect(() => {
    if (!data) return;

    const sessionEndsAt = Number(data[3]);

    // Aucun cooldown en cours
    if (sessionEndsAt === 0) {
      setCooldownRemaining(0);
      return;
    }

    const cooldownEnd = sessionEndsAt + COOLDOWN_SECONDS;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(cooldownEnd - now, 0);
      setCooldownRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data]);

  if (!data) return <p>Loading player data...</p>;

  return (
    <div className="mb-8 text-center">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm sm:text-base">
        {/* RabbitScore */}
        <div
          className={`p-4 rounded-xl shadow border transition-all ${
            themeMode === 'light'
              ? 'bg-yellow-100 text-black border-yellow-300'
              : 'bg-yellow-800 text-white border-yellow-600'
          }`}
        >
          <p className="text-xs opacity-70">RabbitScore</p>
          <p className="text-xl font-bold">
            {Number(data[0]) / 1_000_000}
          </p>
        </div>

        {/* Total Clicks */}
        <div
          className={`p-4 rounded-xl shadow border transition-all ${
            themeMode === 'light'
              ? 'bg-blue-100 text-black border-blue-300'
              : 'bg-blue-800 text-white border-blue-600'
          }`}
        >
          <p className="text-xs opacity-70">Total Clicks</p>
          <p className="text-xl font-bold">
            {data[1].toString()}
          </p>
        </div>

        {/* Cooldown */}
        <div
          className={`p-4 rounded-xl shadow border transition-all ${
            cooldownRemaining > 0
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
          className={`p-4 rounded-xl shadow border transition-all ${
            themeMode === 'light'
              ? 'bg-pink-100 text-black border-pink-300'
              : 'bg-pink-800 text-white border-pink-600'
          }`}
        >
          <p className="text-xs opacity-70">Boost</p>
          <p className="text-xl font-bold">{data[4]}%</p>
        </div>
      </div>
    </div>
  );
}



export default function Game({ isTimeExpired, setIsTimeExpired, isGameStarted, setIsGameStarted, sound, themeMode }) {
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[1])
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [transactionHistory, setTransactionHistory] = useState([])
  const [isWritingContract, setIsWritingContract] = useState(false)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets()
  //const embeddedWallet = getEmbeddedConnectedWallet(wallets)
  const clientRef = useRef(null)
  const [embeddedWallet, setEmbeddedWallet] = useState(null);

  useEffect(() => {
    const wallet = getEmbeddedConnectedWallet(wallets);
    setEmbeddedWallet(wallet);
  }, [wallets]);



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
      
      setResult(`Hash: ${result}\nTime: ${timeTaken}ms`)
      setTransactionHistory(prev => [
        {
          network: selectedNetwork.name,
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
      setRefreshCounter(c => c+1)
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
          network: selectedNetwork.name,
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
      setRefreshCounter(c => c+1)
    }
  }

  const clearHistory = () => {
    setTransactionHistory([])
  }

  return embeddedWallet ? (
  <Wrapper>
    <div className="flex flex-col items-center text-center justify-start pt-28 p-4 sm:p-8">

      {/* Player Info */}
      {selectedNetwork.id !== 'select' && (
        <div className="mb-6 text-xs text-gray-500 dark:text-gray-400">
          <PlayerData refreshCounter={refreshCounter} themeMode={themeMode} />
        </div>
      )}

      {selectedNetwork.id !== 'select' && (
        <div className="mb-10 relative w-full flex items-center justify-center">
          {/* 🐰 Le modèle interactif */}
          <div className="z-10">
            <RabbitModel
              isClicked={() => {
                if (isGameStarted && !isExecuting) {
                  executeTransaction();
                  setRefreshCounter(c => c + 1);
                }
              }}
              sound="hit"
              />
              {result && (
                result.split('\n').map((line, index) => {
                  if (line.startsWith('Hash:')) {
                    const hash = line.replace('Hash: ', '');
                    const getExplorerUrl = (networkId, hash) =>
                      networkId === 'megaeth'
                        ? `https://web3.okx.com/explorer/megaeth-testnet/tx/${hash}`
                        : '#';

                    const explorerUrl = getExplorerUrl(selectedNetwork.id, hash);

                    return (
                      <a
                        key={index}
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-4 left-[71%] px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded shadow hover:bg-green-200 dark:hover:bg-green-800 transition-all cursor-pointer z-20 w-[180px]"
                      >
                        ✅ Transaction Successful
                        <div className="mt-1 text-blue-600 dark:text-blue-400 underline font-mono break-all text-[10px]">
                          {hash}
                        </div>
                      </a>
                    );
                  }
                  return null;
                })
              )}
          </div>
        </div>
      )}


      {/* Start Game Button */}
      <div className="mb-10">
        <button
          onClick={() => {
            handleStartGame();
            setRefreshCounter(c => c + 1);
          }}
          disabled={isExecuting || isGameStarted}
          className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold text-lg transition-all duration-200 hover:bg-green-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 rounded-lg max-w-2xl text-left">
          <h3 className="font-semibold text-red-800 dark:text-red-200">❌ Error</h3>
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
        <div className="w-full max-w-4xl mt-16">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
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
                          <span className={`w-2 h-2 rounded-full ${
                            tx.network === 'MegaETH' ? 'bg-amber-600' :
                            tx.network === 'RISE' ? 'bg-purple-500' : 'bg-green-500'
                          }`} />
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
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          tx.time < 200
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
    </div>
  </Wrapper>
  ) : (
    <Wrapper><p>Please connect your wallet</p></Wrapper>
  )
}