'use client'

import { useState, useEffect, useRef } from 'react'
import { getWalletClient } from '@/utils/walletClient'
import { useWallets, getEmbeddedConnectedWallet } from '@privy-io/react-auth'
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, publicClient, NUM_SLOTS, MAX_LEVEL } from '@/constants'
import { usePrivy } from '@privy-io/react-auth'
import { megaethTestnet } from 'viem/chains'
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react'
import Wrapper from './Wrapper'
import styles from './Shop.module.css'
import { useTheme } from '@/context'

export default function Shop({ refreshCounter, setRefreshCounter, playerData, embeddedWallet }) {
  const [selectedLevels, setSelectedLevels] = useState(Array(NUM_SLOTS).fill(0))
  const [isWriting, setIsWriting] = useState(false)
  const [error, setError] = useState('')
  const [txResult, setTxResult] = useState('')
  const clientRef = useRef(null)

  // On récupère les données joueurs directement via la props
  const { rabbitPoints, playerItems, totalClicks, sessionEndsAt, boost } = playerData


  // Modale de confirmation achat d'item
  const [modalVisible, setModalVisible] = useState(false)
  const [pendingBuy, setPendingBuy] = useState({ slot: 0, level: 0 })

  // Sélection du slot
  const [selectedSlot, setSelectedSlot] = useState(0)

  // Couleurs en fonction du theme
  const { themeMode, toggleTheme } = useTheme();
  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'
  const borderColor = isNight ? '#444' : '#ddd'


  // On initialise le client wallet à partir du moment où un embeddedWallet est présent ou changé
  useEffect(() => {
    try {
      setError('')
      const client = getWalletClient();
      clientRef.current = client;
    } catch (err) {
      console.warn('walletClient uninitialized');
    }
  }, [embeddedWallet]);

  const handleBuyItem = async (slot, level) => {

    try {
      const walletClient = clientRef.current
      if (!walletClient || !embeddedWallet || !embeddedWallet.address) {
        setError('No embedded wallet or address')
        return
      }

      setIsWriting(true)
      setError('')
      setTxResult('')

      const hash = await walletClient.writeContract({
        account: embeddedWallet.address,
        address: DIGIT_RABBITS_ADDRESS,
        abi: DIGIT_RABBITS_ABI,
        functionName: 'buyItem',
        args: [slot, level],
        chain: megaethTestnet,
      })
      console.log({ hash })
      setTxResult(hash)

      // Après succès, on refresh les données joueur pour avoir les dernières infos
      setRefreshCounter(c => c + 1)

    } catch (err) {
      setError(err.message)
    } finally {
      setIsWriting(false)
    }
  }


  const changeLevel = (slot, delta) => {
    setSelectedLevels((prev) => {
      const next = [...prev]
      next[slot] = Math.max(1, Math.min(MAX_LEVEL, next[slot] + delta))
      return next
    })
  }

  // Prix des items
  const getItemPrice = (level) => level > 0 ? 100 * level : 0
  // Nom des traits
  const slotLabels = ["Rabbit Color", "Backgrounds", "Clothes", "Glasses", "Eyes", "Hat"]
  // Emoji map par slot et niveau
  const emojiMap = {
    0: { 1: '🤍', 2: '🤎', 3: '🖤', 4: '🐇', 5: '🐰', 6: '✨' },
    1: { 1: '🌄', 2: '🌆', 3: '🌌', 4: '🌈', 5: '🔥', 6: '❄️' },
    2: { 1: '👕', 2: '👘', 3: '🧥', 4: '🎽', 5: '🦺', 6: '🥼' },
    3: { 1: '🕶️', 2: '👓', 3: '🥽', 4: '🦾', 5: '🪬', 6: '🧿' },
    4: { 1: '👁️', 2: '👀', 3: '✨', 4: '💫', 5: '🔥', 6: '🌀' },
    5: { 1: '🎩', 2: '🧢', 3: '⛑️', 4: '👑', 5: '🪖', 6: '👒' },
  }

  // Maj de l'emoji en fonction du niveau et du slot sélectionné
  const selected = selectedLevels[selectedSlot]
  const emoji =
    selected > 0
      ? emojiMap[selectedSlot]?.[selected] ?? '❓'
      : null

  return embeddedWallet ? (
    <Wrapper>
      <div className="min-h-screen px-4 pt-10">
        <div
          style={{
            backgroundColor: cardBg,
            color: textColor,
            borderColor,
            boxShadow,
            borderWidth: 1,
            borderStyle: 'solid',
            borderRadius: '0.75rem',
            padding: '1rem',
          }}
          className="flex flex-col sm:flex-row items-center justify-between"
        >
          <p>RabbitPoints : {rabbitPoints}</p>
        </div>

        {/* SLOT SELECTOR */}
        <div className="flex flex-wrap justify-center gap-2 pt-10">
          {slotLabels.map((label, index) => (
            <button
              key={index}
              onClick={() => setSelectedSlot(index)}
              className={`px-4 py-2 rounded-full border text-sm transition ${selectedSlot === index
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="flex flex-col sm:flex-row gap-8 pt-10 items-start justify-center">
          {/* LEFT : Canvas */}
          <div
            className="w-full sm:w-1/2 h-[300px] rounded-xl shadow flex items-center justify-center"
            style={{
              backgroundColor: cardBg,
              color: textColor,
              borderColor,
              boxShadow,
              borderWidth: 1,
              borderStyle: 'solid',
              borderRadius: '0.75rem',
              padding: '1rem',
            }}
          >
            <div className="mt-4 flex justify-center gap-4 text-3xl">
              {Object.entries(playerItems).map(([slotStr, level]) => {
                const slot = Number(slotStr)
                if (level > 0) return <span key={slot}>{emojiMap[slot]?.[level] || '❓'}</span>
                return null
              })}
            </div>
          </div>

          {/* RIGHT : Slot Info */}
          <div className="w-full sm:w-1/2 grid grid-cols-1 gap-4">
            {(() => {
              const i = selectedSlot
              const selected = selectedLevels[i]
              const owned = playerItems[i]
              const price = getItemPrice(selected)

              return (
                <>
                  <div className="mx-auto max-w-md">
                    <div
                      style={{
                        backgroundColor: cardBg,
                        color: textColor,
                        borderColor,
                        boxShadow,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                      }}
                      className="flex flex-col sm:flex-row items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <ArrowLeft
                          className="cursor-pointer hover:scale-110 transition"
                          onClick={() => changeLevel(i, -1)}
                        />
                        <div className="text-center">
                          <div className="font-bold">{slotLabels[i]}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Owned: {owned > 0 ? `Lv ${owned}` : 'None'}
                          </div>
                          <div className="text-sm">Selected: Lv {selected}</div>
                          <div className="text-sm text-yellow-600 dark:text-yellow-400">
                            Price: {price}
                          </div>
                        </div>
                        <ArrowRight
                          className="cursor-pointer hover:scale-110 transition"
                          onClick={() => changeLevel(i, 1)}
                        />
                      </div>
                    </div>

                    <button
                      disabled={isWriting || selected <= owned || selected === 0}
                      onClick={() => {
                        setPendingBuy({ slot: i, level: selected })
                        setModalVisible(true)
                      }}
                      className={`mt-4 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${selected <= owned || selected === 0 ? 'cursor-not-allowed' : ''
                        }`}
                    >
                      {isWriting && (
                        <Loader2 size={16} className="animate-spin inline mr-2" />
                      )}
                      Buy Lv {selected}
                    </button>
                  </div>
                </>

              )
            })()}

            {/* EMOJI PREVIEW */}
            {emoji && (
              <div className="mt-4 flex justify-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                  style={{
                    backgroundColor: cardBg,
                    color: textColor,
                    borderColor,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    boxShadow,
                  }}
                >
                  {emoji}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TX Feedback */}
        {txResult && (
          <div className="mt-6 mx-auto max-w-md p-4 text-center text-green-800 bg-green-100 border border-green-400 rounded-lg dark:bg-green-900 dark:text-green-300 dark:border-green-600 text-sm shadow-sm">
            ✅ Transaction :{' '}
            <a
              className="underline hover:text-green-700 dark:hover:text-green-400"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://web3.okx.com/explorer/megaeth-testnet/tx/${txResult}`}
            >
              See on explorer
            </a>
          </div>
        )}


        {/* Error Message */}
        {error && (
          <div className="mb-6 mt-6 p-4 bg-red-100/70 dark:bg-red-900/70 rounded-lg max-w-2xl text-left backdrop-blur-sm">
            <h4 className="text-red-700 dark:text-red-300 break-all">❌ Error :</h4>
            <p className="text-red-700 dark:text-red-300 break-all">{error}</p>
          </div>
        )}

        {/* Confirmation Modal */}
        {modalVisible && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div
              style={{
                backgroundColor: cardBg,
                color: textColor,
                borderColor,
                borderWidth: 1,
                borderStyle: 'solid',
                boxShadow,
              }}
              className="rounded-xl p-6 w-[90%] max-w-sm"
            >
              <h2 className="text-lg font-bold mb-2 text-center">Confirm Purchase</h2>
              <p className="text-sm text-center mb-4">
                Buy <span className="font-semibold">Level {pendingBuy.level}</span> item in{' '}
                <span className="font-semibold">{slotLabels[pendingBuy.slot]}</span>?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setModalVisible(false)
                    handleBuyItem(pendingBuy.slot, pendingBuy.level)
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setModalVisible(false)}
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  ) : (
    <Wrapper><p>Please connect your wallet</p></Wrapper>
  )
}

