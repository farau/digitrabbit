'use client'

import { useState, useEffect } from 'react'
import { Loader2, ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import Wrapper from './Wrapper'
import styles from './Shop.module.css'
import { useTheme, useGame } from '@/context'
import WalletButton from './WalletButton'
import { XLogo } from '@/utils/constants'
import { usePrivy } from '@privy-io/react-auth'
import { Alchemy, Network } from 'alchemy-sdk'

// Configuration Alchemy
const alchemyConfig = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo',
  network: Network.ETH_MAINNET,
}

const alchemy = new Alchemy(alchemyConfig)

// Adresse du contrat ERC721
const ERC721_CONTRACT_ADDRESS = process.env.ERC721_DIGIT_RABBITS_CONTRACT_ADDRESS || '0x0dc2a6df9cE984F1d7CBCB662fB44A87779eC30A'

export default function NFTGallery() {
  const [nfts, setNfts] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [linkedWallets, setLinkedWallets] = useState([])
  const [retryTrigger, setRetryTrigger] = useState(0)
  const { embeddedWallet, isValidating, validationError } = useGame()
  const { themeMode } = useTheme()
  const { user } = usePrivy()

  // Couleurs en fonction du theme
  const isNight = themeMode === 'dark'
  const textColor = isNight ? '#eee' : '#333'
  const cardBg = isNight ? '#222' : '#f3f3f3'
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'
  const borderColor = isNight ? '#444' : '#ddd'

  // Fonction pour obtenir la meilleure URL d'image (priorité aux URLs cachées)
  const getBestImageUrl = (nftImage) => {
    if (!nftImage) return ''

    // Priorité: cachedUrl > thumbnailUrl > originalUrl
    // Les URLs cachées sont servies depuis le CDN d'Alchemy, évitant les problèmes CSP avec IPFS
    return nftImage.cachedUrl ||
      nftImage.thumbnailUrl ||
      nftImage.pngUrl ||
      nftImage.originalUrl ||
      ''
  }

  // Charger les NFTs au montage
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!user) {
        setError('No wallet connected')
        return
      }

      setIsLoading(true)
      setError('')

      try {
        // Récupérer tous les wallets linkés via Privy
        const wallets = user.linkedAccounts.filter(
          account => account.type === 'wallet' && account.address
        )

        if (wallets.length === 0) {
          setError('No linked wallets found')
          setNfts([])
          setIsLoading(false)
          return
        }

        setLinkedWallets(wallets.map(w => w.address))

        // Récupérer les NFTs pour chaque wallet
        const allNfts = []

        for (const wallet of wallets) {
          try {
            // 🚀 Utiliser Alchemy SDK pour récupérer les NFTs d'un contrat spécifique
            const nftsForOwner = await alchemy.nft.getNftsForOwner(wallet.address, {
              contractAddresses: [ERC721_CONTRACT_ADDRESS],
            })

            // Transformer les données Alchemy en format utilisable
            // Utiliser getBestImageUrl pour prioriser les URLs cachées
            const walletNfts = nftsForOwner.ownedNfts.map(nft => ({
              tokenId: nft.tokenId,
              name: nft.name || nft.title || `NFT #${nft.tokenId}`,
              description: nft.description || 'No description',
              image: getBestImageUrl(nft.image),
              attributes: nft.raw?.metadata?.attributes || [],
              ownerWallet: wallet.address
            }))

            allNfts.push(...walletNfts)

          } catch (err) {
            console.error(`Error fetching NFTs for wallet ${wallet.address}:`, err)
          }
        }

        if (allNfts.length === 0) {
          setError('No NFTs found in any of your linked wallets')
        }

        setNfts(allNfts)
        setCurrentIndex(0)

      } catch (err) {
        console.error('Error fetching NFTs:', err)
        setError(err.message || 'Failed to fetch NFTs')
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchNFTs()
    }
  }, [user, retryTrigger])

  // Navigation
  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(nfts.length - 1, prev + 1))
  }

  // Retry function
  const handleRetry = () => {
    setError('')
    setRetryTrigger(prev => prev + 1)
  }

  const currentNFT = nfts[currentIndex]

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

  return embeddedWallet ? (
    <Wrapper>
      <div className={`min-h-screen px-4 pt-2 ${styles.bgBackground}`}>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-10">
            <div
              style={{
                background: cardBg,
                padding: '20px',
                borderRadius: '10px',
                border: `1px solid ${borderColor}`,
                boxShadow,
                textAlign: 'center',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <Loader2 size={20} className="animate-spin" style={{ color: textColor }} />
                <p style={{ color: textColor }}>Loading your NFTs...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="mb-6 mt-4 p-4 bg-red-100/70 dark:bg-red-900/70 rounded-lg max-w-2xl text-left backdrop-blur-sm mx-auto">
            <h4 className="text-red-700 dark:text-red-300 break-all">❌ Error:</h4>
            <p className="text-red-700 dark:text-red-300 break-all">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* MAIN CONTENT */}
        {!isLoading && !error && nfts.length > 0 && currentNFT && (
          <div className="flex flex-col lg:flex-row gap-6 items-start justify-center mt-10 max-w-6xl mx-auto">
            {/* LEFT : NFT Image + Description + Etherscan */}
            <div className="w-full lg:w-1/2">
              <h4 className="text-sm font-semibold mb-4 text-center" style={{ color: textColor }}>
                {currentNFT.name}
              </h4>
              <div
                className="w-full rounded-xl shadow overflow-hidden mb-4"
                style={{
                  backgroundColor: cardBg,
                  color: textColor,
                  borderColor,
                  boxShadow,
                  borderWidth: 1,
                  borderStyle: 'solid',
                }}
              >
                {currentNFT.image ? (
                  <img
                    src={currentNFT.image}
                    alt={currentNFT.name}
                    className="w-full h-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      console.error('Failed to load NFT image:', currentNFT.image)
                    }}
                  />
                ) : (
                  <div className="text-center p-8" style={{ color: textColor }}>
                    <p>No image available</p>
                  </div>
                )}
              </div>

              {/* Description + Etherscan link sous l'image */}
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
              >
                <p className="text-sm mb-3">{currentNFT.description}</p>
                <p className="text-xs opacity-75 mb-2">
                  Owner: {currentNFT.ownerWallet.slice(0, 6)}...{currentNFT.ownerWallet.slice(-4)}
                </p>
                <a
                  href={`https://etherscan.io/token/${ERC721_CONTRACT_ADDRESS}?a=${currentNFT.tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-500 hover:underline text-xs"
                >
                  <ExternalLink size={12} />
                  View on Etherscan
                </a>
              </div>
            </div>

            {/* RIGHT : NFT Details */}
            <div className="w-full lg:w-1/2 grid grid-cols-1 gap-4">
              <h4 className="font-semibold text-center text-sm" style={{ color: textColor }}>
                NFT Details
              </h4>

              <div className="w-full">
                {/* Navigation */}
                <div
                  style={{
                    backgroundColor: cardBg,
                    color: textColor,
                    borderColor,
                    boxShadow,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                  }}
                  className="flex items-center justify-between mb-4"
                >
                  <ArrowLeft
                    size={20}
                    className={`cursor-pointer hover:scale-110 transition ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    onClick={currentIndex > 0 ? goToPrevious : undefined}
                  />
                  <div className="text-center">
                    <div className="font-bold text-base">
                      {currentIndex + 1} / {nfts.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Token ID: {currentNFT.tokenId}
                    </div>
                  </div>
                  <ArrowRight
                    size={20}
                    className={`cursor-pointer hover:scale-110 transition ${currentIndex === nfts.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    onClick={currentIndex < nfts.length - 1 ? goToNext : undefined}
                  />
                </div>

                {/* Attributes */}
                {currentNFT.attributes && currentNFT.attributes.length > 0 && (
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
                  >
                    <h5 className="font-semibold mb-4 text-base">Attributes</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {currentNFT.attributes.map((attr, idx) => (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: isNight ? '#333' : '#fff',
                            borderColor,
                            borderWidth: 1,
                            borderStyle: 'solid',
                          }}
                          className="p-3 rounded-lg"
                        >
                          <p className="text-xs opacity-75 mb-1.5">
                            {attr.trait_type || 'Trait'}
                          </p>
                          <p className="font-semibold text-sm break-words">
                            {attr.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!currentNFT.attributes || currentNFT.attributes.length === 0) && (
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
                  >
                    <p className="text-sm opacity-75 text-center">No attributes available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && nfts.length === 0 && (
          <div className="text-center py-10">
            <div
              style={{
                background: cardBg,
                padding: '20px',
                borderRadius: '10px',
                border: `1px solid ${borderColor}`,
                boxShadow,
                textAlign: 'center',
              }}
            >
              <p style={{ color: textColor }}>
                No NFTs found in your wallet for this collection.
              </p>
            </div>
          </div>
        )}
      </div>
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
        <p style={{ color: textColor, margin: 0, marginBottom: '12px' }}>
          Please log in your <XLogo size={16} className={isNight ? 'text-white' : 'text-black'} /> account to view your NFT collection.
        </p>
        <WalletButton />
      </div>
    </Wrapper>
  )
}