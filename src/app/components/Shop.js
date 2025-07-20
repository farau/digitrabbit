'use client'

import { useState, useEffect } from 'react'
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS, NUM_SLOTS, MAX_LEVEL } from '@/utils/constants'
import { megaethTestnet } from 'viem/chains'
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react'
import Wrapper from './Wrapper'
import styles from './Shop.module.css'
import { useTheme, useGame } from '@/context'
import Image from 'next/image'
import DynamicAvatar from '@/app/components/DynamicAvatar'
import { XLogo } from '@/utils/constants'
import { useWalletClient } from '../hooks/useWalletClient'

export default function Shop({ refreshCounter, setRefreshCounter, playerData }) {
  const [selectedLevels, setSelectedLevels] = useState(Array(NUM_SLOTS).fill(1))
  const [isWriting, setIsWriting] = useState(false)
  const [error, setError] = useState('')
  const [txResult, setTxResult] = useState('')
  const { embeddedWallet, isValidating, validationError } = useGame();

  const { walletClient } = useWalletClient(embeddedWallet)

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

  // Mapping des slots vers les noms de dossiers
  const slotFolders = ['rabbit_color', 'backgrounds', 'clothes', 'glasses', 'hat']
  const slotLabels = ["Rabbit Color", "Backgrounds", "Clothes", "Glasses", "Hat"]

  // Réinitialise les états quand le walletClient est disponible
  useEffect(() => {
    if (walletClient) {
      setError('')
      setTxResult('')
    }
  }, [walletClient])

  // Initialise les niveaux sélectionnés au niveau 1
  useEffect(() => {
    if (playerItems) {
      setSelectedLevels(Array(NUM_SLOTS).fill(1))
    }
  }, [playerItems])


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


  const handleBuyItem = async (slot, level) => {
    try {
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
      setError(err.shortMessage)
    } finally {
      setIsWriting(false)
    }
  }

  const changeLevel = (slot, delta) => {
    setSelectedLevels((prev) => {
      const next = [...prev]
      // Permet de naviguer entre 1 et MAX_LEVEL
      next[slot] = Math.max(1, Math.min(MAX_LEVEL, next[slot] + delta))
      return next
    })
  }

  // Prix des items
  const getItemPrice = (level) => level > 0 ? 1000 * level : 0

  // Fonction pour obtenir le chemin de l'image
  const getImagePath = (slotIndex, level) => {
    const folder = slotFolders[slotIndex]
    return `/img/shop/${folder}/${level}.png`
  }

  // Vérifie si un niveau est disponible à l'achat
  const isLevelAvailable = (slot, level) => {
    const owned = playerItems[slot]
    return level === owned + 1
  }

  // Vérifie si un niveau peut être visualisé
  const isLevelViewable = (slot, level) => {
    // Permet de voir tous les niveaux de 1 à MAX_LEVEL
    return level >= 1 && level <= MAX_LEVEL
  }

  // Niveau sélectionné pour la preview
  const selected = selectedLevels[selectedSlot]

  return embeddedWallet ? (
    <Wrapper>
      <div className={`min-h-screen px-4 pt-10 ${styles.bgBackground}`}>
        <div className="flex justify-center">
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
            className="inline-block"
          >
            <p className="font-semibold">RabbitPoints : {rabbitPoints}</p>
          </div>
        </div>

        {/* TRAITS SELECTOR */}
        <div className="text-center pt-10">
          <p className="font-semibold mb-4" style={{ color: textColor }}>
            Choose a Trait:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
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
        </div>

        {/* MAIN CONTENT */}
        <div className="flex flex-col sm:flex-row gap-8 pt-10 items-start justify-center">
          {/* LEFT : Digit Rabbit Canvas avec DynamicAvatar */}
          <div className="w-full sm:w-1/2">
            <h4 className="text-xs font-semibold mb-4 text-center" style={{ color: textColor }}>
              Your Digit Rabbit
            </h4>
            <div
              className="w-full h-[300px] rounded-xl shadow flex items-center justify-center relative"
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
              <DynamicAvatar
                playerItems={playerItems}
                size="w-full h-full"
                showBorder={false}
                width={300}
                height={300}
              />
            </div>
          </div>

          {/* RIGHT : Trait Info */}
          <div className="w-full sm:w-1/2 grid grid-cols-1 gap-4">
            <h4 className="font-semibold text-center" style={{ color: textColor }}>
              Trait Details
            </h4>
            {(() => {
              const i = selectedSlot
              const selected = selectedLevels[i]
              const owned = playerItems[i]
              const price = getItemPrice(selected)
              const canBuy = isLevelAvailable(i, selected)
              const nextLevel = owned + 1

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
                          className={`cursor-pointer hover:scale-110 transition ${selected <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          onClick={() => selected > 1 && changeLevel(i, -1)}
                        />
                        <div className="text-center">
                          <div className="font-bold">{slotLabels[i]}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Owned: {owned > 0 ? `Lv ${owned}` : 'None'}
                          </div>
                          <div className={`text-sm ${!canBuy ? 'opacity-75' : ''}`}>
                            <div className="flex items-center justify-center gap-1">
                              <span>Selected: Lv {selected}</span>
                              {playerItems[i] >= selected && (
                                <span className="text-green-600 dark:text-green-400">✓</span>
                              )}
                            </div>
                          </div>
                          <div className={`text-sm text-yellow-600 dark:text-yellow-400`}>
                            Price: {price}
                          </div>
                          {!canBuy && (
                            <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                              {selected > nextLevel ? `Buy Lv ${nextLevel} first` : 'Already owned'}
                            </div>
                          )}
                        </div>
                        <ArrowRight
                          className={`cursor-pointer hover:scale-110 transition ${selected >= MAX_LEVEL ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          onClick={() => selected < MAX_LEVEL && changeLevel(i, 1)}
                        />
                      </div>
                    </div>

                    <button
                      disabled={isWriting || !canBuy || selected === 0}
                      onClick={() => {
                        if (canBuy) {
                          setPendingBuy({ slot: i, level: selected })
                          setModalVisible(true)
                        }
                      }}
                      className={`mt-4 w-full px-4 py-2 rounded-lg text-sm transition ${canBuy && selected > 0 && !isWriting
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        }`}
                    >
                      {isWriting && (
                        <Loader2 size={16} className="animate-spin inline mr-2" />
                      )}
                      {canBuy ? `Buy Lv ${selected}` :
                        selected > nextLevel ? `Buy Lv ${nextLevel} first` :
                          owned >= MAX_LEVEL ? 'Max Level' :
                            `Buy Lv ${nextLevel}`}
                    </button>
                  </div>
                </>
              )
            })()
            }

            {/* IMAGE PREVIEW */}
            {selected > 0 && (
              <div className="flex justify-center">
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: cardBg,
                    color: textColor,
                    borderColor,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    boxShadow,
                  }}
                >
                  <Image
                    src={getImagePath(selectedSlot, selected)}
                    alt={`${slotLabels[selectedSlot]} level ${selected}`}
                    width={160}
                    height={160}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
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

        {/* Confirmation Modal */}
        {modalVisible && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-50"
              onClick={() => setModalVisible(false)}
            />

            {/* Modal Container */}
            <div className="fixed top-150 md:top-1/2 left-1/2 transform -translate-x-1/2 md:-translate-y-1/2 z-50 w-full max-w-sm px-4">
              <div
                style={{
                  backgroundColor: cardBg,
                  color: textColor,
                  borderColor,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  boxShadow,
                  borderRadius: '12px',
                  padding: '24px'
                }}
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
          </>
        )}
      </div>
      {/* Error Message */}
      {error && (
        <div className="mb-6 mt-4 p-4 bg-red-100/70 dark:bg-red-900/70 rounded-lg max-w-2xl text-left backdrop-blur-sm">
          <h4 className="text-red-700 dark:text-red-300 break-all">❌ Error :</h4>
          <p className="text-red-700 dark:text-red-300 break-all">{error}</p>
        </div>
      )}
    </Wrapper>
  ) : (
    <Wrapper>
      <div
        style={{
          background: cardBg,
          padding: '20px',
          borderRadius: '10px',
          border: `1px solid ${borderColor}`,
          boxShadow,
          textAlign: 'center',
          margin: '20px'
        }}
      >
        <p style={{ color: textColor, margin: 0 }}>
          Please log in your <XLogo size={16} className={isNight ? 'text-white' : 'text-black'} /> account to access the shop and customize your Digit Rabbit.
        </p>
      </div>
    </Wrapper>
  )
}