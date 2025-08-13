'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Download, Gift, Loader2, Trophy } from 'lucide-react'
import Image from 'next/image'
import { XLogo } from '@/utils/constants'
import Wrapper from '@/app/components/Wrapper'
import { useTheme, useGame } from '@/context'
import DynamicAvatar from '@/app/components/DynamicAvatar'
import { useState } from 'react'
import { useWallets, usePrivy } from '@privy-io/react-auth'
import { useWalletClient } from '../hooks/useWalletClient'
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS } from '@/utils/constants'
import WalletButton from './WalletButton'
import { useBalance } from 'wagmi'

function XProfileDisplay() {
  const { user } = usePrivy();
  const { themeMode } = useTheme();

  // Find the X/Twitter account from the user's linked accounts
  const twitterAccount = user?.linkedAccounts.find(
    (account) => account.type === 'twitter_oauth'
  );

  const isNight = themeMode === 'dark';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';
  const borderColor = isNight ? '#444' : '#ddd';
  const textColor = isNight ? 'text-white' : 'text-black';
  const subTextColor = isNight ? 'text-zinc-400' : 'text-gray-600';

  // If the user has no linked Twitter account, don't render anything
  if (!twitterAccount) {
    return null;
  }

  const { name, username, profilePictureUrl } = twitterAccount;

  return (
    <div
      style={{
        background: cardBg,
        padding: '15px',
        borderRadius: '10px',
        marginTop: 12,
        boxShadow,
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* Header with profile info and connection status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {profilePictureUrl && (
            <Image
              src={profilePictureUrl}
              alt={name || 'X profile picture'}
              width={50}
              height={50}
              style={{ borderRadius: '50%' }}
            />
          )}
          <div>
            <p className={`text-lg font-bold ${textColor}`}>{name}</p>
            {username && <p className={`text-sm ${subTextColor}`}>@{username}</p>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <XLogo className={`${isNight ? 'text-white' : 'text-black'}`} size={20} />
          <span className={`text-sm ${subTextColor}`}>Connected</span>
        </div>
      </div>
    </div>
  );
}

// Configuration des collections avec leurs images
const COLLECTIONS_CONFIG = [
  {
    name: 'badbunnz',
    displayName: 'BadBunnz',
    image: '/img/collections/badbunnz.png',
  },
  {
    name: 'fluffles',
    displayName: 'The Fluffle',
    image: '/img/collections/fluffles.jpg',
  },
  //
  {
    name: 'pudgypenguins',
    displayName: 'Pudgy Penguins',
    image: '/img/collections/pudgypenguins.png',
  },
  {
    name: 'milady',
    displayName: 'Milady',
    image: '/img/collections/milady.png',
  },
  //
  {
    name: 'cyberkongz',
    displayName: 'CyberKongz',
    image: '/img/collections/cyberkongz.png',
  },
  {
    name: 'chimpers',
    displayName: 'Chimpers',
    image: '/img/collections/chimpers.png',
  },
  {
    name: 'sprotogremlins',
    displayName: 'Sproto Gremlins',
    image: '/img/collections/sprotogremlins.jpg',
  },
  {
    name: 'steadyteddys',
    displayName: 'Steady Teddys',
    image: '/img/collections/steadyteddys.jpg',
  },
  //
  {
    name: 'megalio',
    displayName: 'Megalio',
    image: '/img/collections/megalio.jpg',
  },
  {
    name: 'bullas',
    displayName: 'The Bullas',
    image: '/img/collections/bullas.png',
  }
];

function PointsModal({ isOpen, onClose, pointsData, onClaim, isClaiming, isNight }) {
  if (!isOpen || !pointsData) return null;

  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const borderColor = isNight ? '#444' : '#ddd';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';
  const overlayBg = isNight ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)';
  const subTextColor = isNight ? '#ccc' : '#666';

  // Créer la liste des collections avec leurs données
  const collections = COLLECTIONS_CONFIG.map(config => {
    const collectionData = pointsData.collectionsBreakdown?.[config.name];
    return {
      ...config,
      count: collectionData?.totalCount || 0,
      points: collectionData?.totalPoints || 0
    };
  }).filter(collection => collection.count > 0); // Filtrer seulement les collections avec des NFTs

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        minHeight: '110vh',
        right: 0,
        bottom: 0,
        backgroundColor: overlayBg,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)', // Support Safari
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: cardBg,
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '75vh',
          overflowY: 'auto',
          border: `1px solid ${borderColor}`,
          boxShadow,
          color: textColor,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: `1px solid ${borderColor}`
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: 0,
            color: textColor
          }}>
            Available Rewards
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: subTextColor,
              padding: '4px 8px',
              borderRadius: '4px',
              outline: 'none'
            }}
          >
            ✕
          </button>
        </div>

        {/* Collections */}
        <div style={{ marginBottom: '20px' }}>
          {collections.map((collection, index) => (
            <div
              key={collection.name}
              style={{
                background: cardBg,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                padding: '12px',
                marginBottom: index < collections.length - 1 ? '8px' : '0',
                boxShadow
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Image
                    src={collection.image}
                    alt={collection.displayName}
                    width={36}
                    height={36}
                    style={{
                      borderRadius: '6px',
                      objectFit: 'cover',
                      border: `1px solid ${borderColor}`
                    }}
                  />
                  <div>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: textColor,
                      marginBottom: '2px'
                    }}>
                      {collection.displayName}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: subTextColor
                    }}>
                      {collection.count} NFT{collection.count > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: textColor
                  }}>
                    {collection.points.toLocaleString()}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: subTextColor
                  }}>
                    points
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div
          style={{
            background: cardBg,
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: `1px solid ${borderColor}`,
            boxShadow
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Total RabbitPoints:</strong>
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: textColor
            }}>
              {pointsData.claimablePoints.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={onClaim}
          disabled={isClaiming || pointsData.claimablePoints === 0}
          style={{
            width: '100%',
            background: pointsData.claimablePoints === 0
              ? (isNight ? '#444' : '#ddd')
              : (isNight ? '#4f46e5' : '#6366f1'),
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: (isClaiming || pointsData.claimablePoints === 0) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity: (isClaiming || pointsData.claimablePoints === 0) ? 0.6 : 1,
            transition: 'opacity 0.2s ease'
          }}
        >
          {isClaiming ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Claiming...
            </>
          ) : pointsData.claimablePoints === 0 ? (
            'No Points Available'
          ) : (
            <>
              Claim Points
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CheckAndClaimPointsButton({ isNight, user, embeddedWallet, setRefreshCounter, isGameStarted }) {
  const { wallets } = useWallets();
  const { walletClient } = useWalletClient(embeddedWallet);
  const [isChecking, setIsChecking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [pointsData, setPointsData] = useState(null);
  const [error, setError] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleCheckPoints = async () => {
    if (!user?.linkedAccounts) return;
    setPointsData(null);
    setIsChecking(true);
    setError(null);
    setClaimSuccess(false);

    try {
      // Utiliser l'endpoint GET mis à jour
      const response = await fetch('/api/users/claim', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPointsData(data);

      // Ouvrir la modale si des points sont disponibles
      if (data.claimablePoints > 0) {
        setShowModal(true);
      }
    } catch (err) {
      console.error('Error checking points:', err);
      setError('Failed to check points');
    } finally {
      setIsChecking(false);
    }
  };

  const handleClaimPoints = async () => {
    if (!pointsData || !embeddedWallet || pointsData.claimablePoints === 0) return;
    if (!walletClient) {
      setError('Wallet client not initialized yet')
      return
    }

    setIsClaiming(true);
    setError(null);

    try {
      if (!embeddedWallet) {
        throw new Error('Embedded wallet not found');
      }

      // Utiliser l'endpoint POST mis à jour
      const claimResponse = await fetch('/api/users/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!claimResponse.ok) {
        throw new Error(`HTTP error! status: ${claimResponse.status}`);
      }

      const claimData = await claimResponse.json();

      if (!claimData.success || !claimData.signature) {
        throw new Error('Failed to get claim signature');
      }

      const hash = await walletClient.writeContract({
        account: embeddedWallet.address,
        address: DIGIT_RABBITS_ADDRESS,
        abi: DIGIT_RABBITS_ABI,
        functionName: 'claimPoints',
        args: [
          BigInt(claimData.claimablePoints),
          BigInt(claimData.nonce),
          claimData.signature
        ],
      });

      console.log('Transaction hash:', hash);
      setClaimSuccess(true);
      setRefreshCounter(c => c + 1);
      setPointsData(null);

    } catch (err) {
      console.error('Error claiming points:', err);
      if (err.shortMessage?.toLowerCase().includes("maximum limit")) {
        setError("Please fund your wallet with testnet tokens. Go to the Settings section, copy your wallet address and paste it into the faucet.");
      } else {
        setError(`Failed to claim points: ${err.shortMessage}`);
      }
    } finally {
      setIsClaiming(false);
      setShowModal(false);
    }
  };

  const buttonStyle = {
    background: isNight
      ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
      : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: (isChecking || isClaiming) ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: isNight
      ? '0 2px 6px rgba(79, 70, 229, 0.3)'
      : '0 2px 6px rgba(79, 70, 229, 0.3)',
    opacity: (isChecking || isClaiming) ? 0.7 : 1,
  };

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleCheckPoints}
          disabled={isChecking || isClaiming || isGameStarted}
          style={buttonStyle}
          onMouseOver={(e) => {
            if (!isChecking && !isClaiming) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = isNight
                ? '0 3px 8px rgba(79, 70, 229, 0.4)'
                : '0 3px 8px rgba(79, 70, 229, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            if (!isChecking && !isClaiming) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = isNight
                ? '0 2px 6px rgba(79, 70, 229, 0.3)'
                : '0 2px 6px rgba(79, 70, 229, 0.3)';
            }
          }}
        >
          {isChecking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Gift className="w-4 h-4" />
          )}
          {isChecking ? 'Checking...' : 'Check Points'}
        </button>

        {/* Affichage simple quand pas de points */}
        {pointsData && !isChecking && pointsData.claimablePoints === 0 && (
          <div className={`text-sm ${isNight ? 'text-gray-400' : 'text-gray-600'} text-center`}>
            No points to claim
          </div>
        )}

        {claimSuccess && (
          <div className={`text-sm ${isNight ? 'text-green-400' : 'text-green-600'} text-center`}>
            ✅ Points claimed successfully!
          </div>
        )}

        {error && (
          <div className={`text-sm ${isNight ? 'text-red-400' : 'text-red-600'} text-center max-w-xs`}>
            {error}
          </div>
        )}
      </div>

      {/* Modale pour le récapitulatif */}
      <PointsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        pointsData={pointsData}
        onClaim={handleClaimPoints}
        isClaiming={isClaiming}
        isNight={isNight}
      />
    </>
  );
}

export default function Profile({ playerData, setRefreshCounter, isGameStarted }) {
  const { user } = usePrivy();
  const { themeMode } = useTheme();
  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333'
  const cardBg = isNight ? '#222' : '#f3f3f3'
  const labelColor = isNight ? '#ccc' : '#333'
  const tooltipBg = isNight ? '#333' : '#fff'
  const tooltipColor = isNight ? '#eee' : '#333'
  const borderColor = isNight ? '#444' : '#ddd'
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'

  const { embeddedWallet, validationError, isValidating } = useGame()

  const { rabbitPoints, playerItems, totalClicks, sessionEndsAt, boost, streak, hasClaimedPoints, maxClicks } = playerData

  const { data: balance, refetch: refetchBalance } = useBalance({
    address: embeddedWallet?.address,
  });

  const rawStats = {
    clothes: playerItems.reduce((count, val) => count + (val > 0 ? val : 0), 0),
    boost: Number(boost),
    totalClicks: Number(totalClicks),
    streak: Number(streak),
    maxClicks: Number(maxClicks)
  }

  const blockchainStats = [
    {
      stat: 'Clothes',
      value: (rawStats.clothes ?? 0) / 25,
      real: `${rawStats.clothes ?? 0}/25`
    },
    {
      stat: 'Boost',
      value: (rawStats.boost ?? 0) / 360,
      real: `${rawStats.boost ?? 0}%`
    },
    {
      stat: 'Total clicks',
      value: Math.min((rawStats.totalClicks ?? 0) / 100000, 1),
      real: `${rawStats.totalClicks ?? 0}`
    },
    {
      stat: 'Streak',
      value: (rawStats.streak ?? 0) / 50,
      real: `${rawStats.streak ?? 0} days`
    }
  ];

  const renderVerticalLabels = ({ payload, x, y }) => {
    const angle = payload.coordinate?.angle ?? 0
    const label = payload.value
    const shouldRotate = label === 'Streak' || label === 'Boost'
    const isLeft = angle > 90 && angle < 270

    return (
      <text
        x={x}
        y={y}
        textAnchor={isLeft ? 'end' : 'start'}
        dominantBaseline="middle"
        transform={shouldRotate ? `rotate(90 ${x} ${y})` : undefined}
        style={{ fill: labelColor, fontSize: 12 }}
      >
        {label}
      </text>
    )
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { stat, real } = payload[0].payload
      return (
        <div
          style={{
            backgroundColor: tooltipBg,
            border: `1px solid ${borderColor}`,
            padding: '8px',
            borderRadius: 4,
            color: tooltipColor,
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>{stat}</strong>: {real}
          </p>
        </div>
      )
    }
    return null
  }

  function RadarStatsChart() {
    return (
      <div className="w-full md:w-64 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={blockchainStats}>
            <PolarGrid stroke={isNight ? '#555' : '#ccc'} />
            <PolarAngleAxis dataKey="stat" tick={renderVerticalLabels} />
            <PolarRadiusAxis domain={[0, 1]} tickCount={6} stroke={labelColor} />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Stats"
              dataKey="value"
              stroke="#4f46e5"
              fill="#818cf8"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  function CopyWalletButton({ address }) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(address);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    };

    return (
      <button
        onClick={handleCopy}
        aria-label={`Copy wallet address`}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {isCopied ? (
          <>
            Copied!
          </>
        ) : (
          'Copy'
        )}
      </button>
    );
  }

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

  const userAddress =
    embeddedWallet?.address || '0x0000000000000000000000000000000000000000'
  const displayAddress = userAddress.slice(0, 4) + '...' + userAddress.slice(-4)

  // Formater la balance à 5 décimales maximum
  const formatBalance = (value) => {
    const num = parseFloat(value);
    return num.toFixed(5).replace(/\.?0+$/, ''); // Supprime les zéros inutiles à la fin
  };

  return (embeddedWallet ?
    <Wrapper>
      <div className="flex flex-col md:flex-row md:items-start gap-5">
        {/* Avatar Dynamique */}
        <div className="flex flex-col items-center">
          <DynamicAvatar
            playerItems={playerItems}
            size="w-30 h-30"
            showBorder={true}
            width={96}
            height={96}
          />
          <div className="flex flex-col items-center gap-2 mt-2">
            <button
              onClick={async () => {
                try {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  canvas.width = 512;
                  canvas.height = 512;

                  ctx.imageSmoothingEnabled = true;
                  ctx.imageSmoothingQuality = 'high';

                  const loadImage = (src) => {
                    return new Promise((resolve, reject) => {
                      const img = document.createElement('img');
                      img.crossOrigin = 'anonymous';
                      img.onload = () => resolve(img);
                      img.onerror = reject;
                      img.src = src;
                    });
                  };

                  const layerOrder = [
                    { folder: 'backgrounds', index: 1 },
                    { folder: 'rabbit_color', index: 0 },
                    { folder: 'clothes', index: 2 },
                    { folder: 'glasses', index: 3 },
                    { folder: 'hat', index: 4 }
                  ];

                  for (const layer of layerOrder) {
                    const itemLevel = playerItems[layer.index] || 0;
                    const imagePath = `/img/shop/${layer.folder}/${itemLevel}.webp`;

                    try {
                      const img = await loadImage(imagePath);
                      ctx.drawImage(img, 0, 0, 512, 512);
                    } catch (error) {
                      console.warn(`Failed to load image: ${imagePath}`, error);
                    }
                  }

                  const link = document.createElement('a');
                  link.download = 'my-digital-rabbit.png';
                  link.href = canvas.toDataURL('image/png', 1.0);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } catch (error) {
                  console.error('Error creating avatar image:', error);
                }
              }}
              className="text-xs hover:underline flex items-center gap-1"
              style={{ color: '#333', border: 'none', cursor: 'pointer' }}
            >
              <Download className="w-3 h-3" />
              Download Rabbit
            </button>
          </div>
        </div>

        {/* Infos */}
        <div style={{ flex: 1, color: textColor }}>
          <div
            style={{
              background: cardBg,
              padding: '10px 15px',
              borderRadius: '10px',
              border: `1px solid ${borderColor}`,
              boxShadow,
            }}
            className='mb-3'
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '15px',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>Wallet Address:</strong>
                <span style={{
                  wordBreak: 'break-all',
                  marginLeft: '8px'
                }}>
                  {displayAddress}
                </span>
              </div>
              <div className="flex-shrink-0">
                <CopyWalletButton address={userAddress} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>Balance:</strong>
              <span style={{
                wordBreak: 'break-all',
                marginLeft: '8px'
              }}>
                {balance ? `${formatBalance(balance.formatted)} ${balance.symbol}` : 'Loading...'}
              </span>
            </div>
          </div>
          <div style={{
            background: cardBg,
            padding: '10px 15px',
            borderRadius: '10px',
            border: `1px solid ${borderColor}`,
            boxShadow,
          }}
          >
            <strong>RabbitPoints:</strong>
            <span className="md:inline ml-2 break-all">
              {rabbitPoints}
            </span>
          </div>
        </div>
      </div>

      <XProfileDisplay />
      {/* Reward Section */}
      <div
        style={{
          background: isNight
            ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${isNight ? '#4f46e5' : '#6366f1'}`,
          boxShadow: isNight
            ? '0 4px 12px rgba(79, 70, 229, 0.1)'
            : '0 4px 12px rgba(99, 102, 241, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        className='mt-4 mb-4'
      >
        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <Gift className={`w-5 h-5 ${isNight ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: 0,
              color: isNight ? '#e2e8f0' : '#334155',
            }}
          >
            Rewards
          </h3>
        </div>

        {/* Content */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {!hasClaimedPoints ? (
            <div className="flex flex-col items-center gap-3">
              <div
                style={{
                  background: isNight
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(239, 68, 68, 0.05)',
                  color: isNight ? '#fca5a5' : '#dc2626',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: `1px solid ${isNight ? '#dc2626' : '#fca5a5'}`,
                }}
              >
                <span>•</span>
                Rewards available to claim
              </div>
              <CheckAndClaimPointsButton
                isNight={isNight}
                user={user}
                embeddedWallet={embeddedWallet}
                setRefreshCounter={setRefreshCounter}
                isGameStarted={isGameStarted}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div
                style={{
                  background: isNight
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(16, 185, 129, 0.05)',
                  color: isNight ? '#6ee7b7' : '#059669',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: `1px solid ${isNight ? '#10b981' : '#6ee7b7'}`,
                  maxWidth: '320px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                <Trophy className="w-4 h-4" />
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                    Rewards Claimed Successfully
                  </div>
                  <div style={{ fontSize: '12px', opacity: '0.8' }}>
                    Thanks for your support!
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: isNight ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${isNight ? '#374151' : '#d1d5db'}`,
                  fontSize: '12px',
                  color: isNight ? '#9ca3af' : '#6b7280',
                  textAlign: 'center',
                }}
              >
                Keep collecting RabbitPoints for future rewards!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 flex flex-col md:flex-row gap-8 items-start mt-4">
        <div className="w-full md:w-1/2" style={{ color: textColor }}>
          <div
            style={{
              background: cardBg,
              padding: '10px 15px',
              marginTop: 10,
              borderRadius: '10px',
              border: `1px solid ${borderColor}`,
              boxShadow,
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: 0,
                color: isNight ? '#e2e8f0' : '#334155',
              }}
              className='text-center'
            >
              RabbitStats
            </h3>
            <table className="w-full" style={{ background: 'transparent', fontFamily: 'inherit' }}>
              <tbody style={{ background: 'transparent' }}>
                <tr style={{ borderBottom: `1px solid ${isNight ? '#475569' : '#e2e8f0'}`, background: 'transparent' }}>
                  <td
                    style={{
                      color: textColor,
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      fontSize: '16px',
                      fontWeight: '500',
                      background: 'transparent',
                      fontFamily: 'inherit',
                    }}
                  >
                    Number of clothes
                  </td>
                  <td
                    style={{
                      color: textColor,
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      textAlign: 'right',
                      fontSize: '16px',
                      fontWeight: '500',
                      background: 'transparent',
                      fontFamily: 'inherit',
                    }}
                  >
                    <strong style={{ fontFamily: 'inherit' }}>{rawStats.clothes}/25</strong>
                  </td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${isNight ? '#475569' : '#e2e8f0'}`, background: 'transparent' }}>
                  <td
                    style={{
                      color: textColor,
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      fontSize: '16px',
                      fontWeight: '500',
                      background: 'transparent',
                      fontFamily: 'inherit',
                    }}
                  >
                    Boost
                  </td>
                  <td
                    style={{
                      color: textColor,
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      textAlign: 'right',
                      fontSize: '16px',
                      fontWeight: '500',
                      background: 'transparent',
                      fontFamily: 'inherit',
                    }}
                  >
                    <strong style={{ fontFamily: 'inherit' }}>{rawStats.boost}%</strong>
                  </td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${isNight ? '#475569' : '#e2e8f0'}`, background: 'transparent' }}>
                  <td
                    style={{
                      color: textColor,
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      fontSize: '16px',
                      fontWeight: '500',
                      background: 'transparent',
                      fontFamily: 'inherit',
                    }}
                  >
                    Total clicks
                  </td>
                  <td
                    style={{
                      color: textColor,
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      textAlign: 'right',
                      fontSize: '16px',
                      fontWeight: '500',
                      background: 'transparent',
                      fontFamily: 'inherit',
                    }}
                  >
                    <strong style={{ fontFamily: 'inherit' }}>{rawStats.totalClicks}</strong>
                  </td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${isNight ? '#475569' : '#e2e8f0'}`, background: 'transparent' }}>
                  <td
                    style={{
                      color: textColor,
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      fontSize: '16px',
                      fontWeight: '500',
                      background: 'transparent',
                      fontFamily: 'inherit',
                    }}
                  >
                    Streak
                  </td>
                  <td
                    style={{
                      color: textColor,
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      textAlign: 'right',
                      fontSize: '16px',
                      fontWeight: '500',
                      background: 'transparent',
                      fontFamily: 'inherit',
                    }}
                  >
                    <strong style={{ fontFamily: 'inherit' }}>{rawStats.streak} days</strong>
                  </td>
                </tr>
                <tr style={{ background: 'transparent' }}>
                  <td
                    style={{
                      color: textColor,
                      paddingTop: '12px',
                      fontSize: '16px',
                      fontWeight: '500',
                      background: 'transparent',
                      fontFamily: 'inherit',
                    }}
                  >
                    Max clicks
                  </td>
                  <td
                    style={{
                      color: textColor,
                      paddingTop: '12px',
                      textAlign: 'right',
                      fontSize: '16px',
                      fontWeight: '500',
                      background: 'transparent',
                      fontFamily: 'inherit',
                    }}
                  >
                    <strong style={{ fontFamily: 'inherit' }}>{rawStats.maxClicks}</strong>
                    <p style={{ fontFamily: 'inherit' }}>{Math.floor(1000 / (rawStats.maxClicks / 60))} ms/click</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="w-full md:w-1/2">
          <RadarStatsChart />
        </div>
      </div>
    </Wrapper>
    : (
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
          <p style={{ color: textColor, margin: 0, marginBottom: '12px' }}>Please login your <XLogo size={16} className={isNight ? 'text-white' : 'text-black'} /> account to access your profile.</p>
          <WalletButton />
        </div>
      </Wrapper>
    )
  )
}