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
import { XLogo } from '@/utils/constants'
import Wrapper from '@/app/components/Wrapper'
import { useTheme } from '@/context'
import DynamicAvatar from '@/app/components/DynamicAvatar'
import { useState } from 'react'
import { useWallets, usePrivy } from '@privy-io/react-auth'
import { useWalletClient } from '../hooks/useWalletClient'
import { DIGIT_RABBITS_ABI, DIGIT_RABBITS_ADDRESS } from '@/utils/constants'


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
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {profilePictureUrl && (
            <img
              src={profilePictureUrl}
              alt={name || 'X profile picture'}
              style={{ width: '50px', height: '50px', borderRadius: '50%' }}
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

      {/* Tweet button centered at bottom */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '8px',
        borderTop: `1px solid ${borderColor}`
      }}>
        <TweetAvatarButton isNight={isNight} />
      </div>
    </div>
  );
}

function TweetAvatarButton({ isNight }) {

  const handleTweetAvatar = async () => {

    // Create the tweet text
    const tweetText = encodeURIComponent(
      "Just customized my Digit Rabbit on @digitrabbits website! 🐰✨ Check out my unique avatar and join the fun! #DigitRabbits #Rabbitio"
    );

    // Create the tweet URL
    const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

    // Open Twitter in a new window/tab
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  };

  const buttonStyle = {
    background: isNight
      ? 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)'
      : 'linear-gradient(135deg, #000000 0%, #333333 100%)',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
    boxShadow: isNight
      ? '0 2px 6px rgba(0, 0, 0, 0.5)'
      : '0 2px 6px rgba(0, 0, 0, 0.3)',
  };

  return (
    <button
      onClick={handleTweetAvatar}
      style={buttonStyle}
      onMouseOver={(e) => {
        e.target.style.transform = 'translateY(-1px)';
        e.target.style.boxShadow = isNight
          ? '0 3px 8px rgba(0, 0, 0, 0.6)'
          : '0 3px 8px rgba(0, 0, 0, 0.4)';
      }}
      onMouseOut={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = isNight
          ? '0 2px 6px rgba(0, 0, 0, 0.5)'
          : '0 2px 6px rgba(0, 0, 0, 0.3)';
      }}
    >
      <XLogo size={14} />
      RabbitTwittio
    </button>
  );
}

function CheckAndClaimPointsButton({ isNight, user, embeddedWallet, setRefreshCounter }) {
  const { wallets } = useWallets();
  const { walletClient } = useWalletClient(embeddedWallet);
  const [isChecking, setIsChecking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [pointsData, setPointsData] = useState(null);
  const [error, setError] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const handleCheckPoints = async () => {
    if (!user?.linkedAccounts) return;
    setPointsData(null);
    setIsChecking(true);
    setError(null);
    setClaimSuccess(false);

    try {
      // Get all linked wallets from the user's linked accounts
      const linkedWallets = user.linkedAccounts
        .filter(account => account.type === 'wallet')
        .map(account => account.address); // Fixed: removed object wrapper

      if (linkedWallets.length === 0) {
        setError('No linked wallets found');
        return;
      }

      // Fixed: properly encode the array
      const linkedWalletsJson = JSON.stringify(linkedWallets);
      const response = await fetch(`/api/users/claim?linkedWallets=${encodeURIComponent(linkedWalletsJson)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPointsData(data);
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

      // Fixed: Get linked wallets properly
      const linkedWallets = user.linkedAccounts
        .filter(account => account.type === 'wallet')
        .map(account => account.address);

      const claimResponse = await fetch('/api/users/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkedWallets: linkedWallets, // Fixed: send array directly
          address: embeddedWallet.address
        }),
      });

      if (!claimResponse.ok) {
        throw new Error(`HTTP error! status: ${claimResponse.status}`);
      }

      const claimData = await claimResponse.json();

      if (!claimData.success || !claimData.signature) {
        throw new Error('Failed to get claim signature');
      }

      // Exécuter la transaction sur le smart contract
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
      setRefreshCounter(c => c + 1)
      setPointsData(null); // Reset pour cacher le bouton claim

    } catch (err) {
      console.error('Error claiming points:', err);
      setError(`Failed to claim points: ${err.shortMessage}`);
    } finally {
      setIsClaiming(false);
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

  const claimButtonStyle = {
    background: isNight
      ? 'linear-gradient(135deg, #10b981 0%, #14c085 100%)'
      : 'linear-gradient(135deg, #10b981 0%, #14c085 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: isClaiming ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: isNight
      ? '0 2px 6px rgba(16, 185, 129, 0.3)'
      : '0 2px 6px rgba(16, 185, 129, 0.3)',
    opacity: isClaiming ? 0.7 : 1,
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleCheckPoints}
        disabled={isChecking || isClaiming}
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

      {/* Display results */}
      {pointsData && !isChecking && pointsData.claimablePoints > 0 && (
        <div className="flex flex-col items-center gap-2">
          <div className={`text-sm ${isNight ? 'text-green-400' : 'text-green-600'} text-center`}>
            🎉 {pointsData.claimablePoints} points claimable!
          </div>
          <button
            onClick={handleClaimPoints}
            disabled={isClaiming}
            style={claimButtonStyle}
            onMouseOver={(e) => {
              if (!isClaiming) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = isNight
                  ? '0 3px 8px rgba(16, 185, 129, 0.4)'
                  : '0 3px 8px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!isClaiming) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = isNight
                  ? '0 2px 6px rgba(16, 185, 129, 0.3)'
                  : '0 2px 6px rgba(16, 185, 129, 0.3)';
              }
            }}
          >
            {isClaiming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trophy className="w-4 h-4" />
            )}
            {isClaiming ? 'Claiming...' : 'Claim Points'}
          </button>
        </div>
      )}

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
  );
}

export default function Profile({ embeddedWallet, playerData, setRefreshCounter }) {
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

  const { rabbitPoints, playerItems, totalClicks, sessionEndsAt, boost, streak, hasClaimedPoints } = playerData

  const rawStats = {
    clothes: playerItems.reduce((count, val) => count + (val > 0 ? 1 : 0), 0),
    boost: Number(boost),
    totalClicks: Number(totalClicks),
    streak: Number(streak),
  }

  const blockchainStats = [
    {
      stat: 'Clothes',
      value: (rawStats.clothes ?? 0) / 6,
      real: `${rawStats.clothes ?? 0}/6`
    },
    {
      stat: 'Boost',
      value: (rawStats.boost ?? 0) / 360,
      real: `${rawStats.boost ?? 0}%`
    },
    {
      stat: 'Total clicks',
      value: Math.min((rawStats.totalClicks ?? 0) / 10000, 1),
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
    const shouldRotate = label === 'Streak' || label === 'Bonus'
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

  const userAddress =
    embeddedWallet?.address || '0x0000000000000000000000000000000000000000'
  const displayAddress = userAddress.slice(0, 4) + '...' + userAddress.slice(-4)

  return (embeddedWallet ?
    <Wrapper>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Avatar Dynamique */}
        <div className="flex flex-col items-center">
          <DynamicAvatar
            playerItems={playerItems}
            size="w-24 h-24"
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
                    { folder: 'eyes', index: 3 },
                    { folder: 'hat', index: 4 }
                  ];

                  for (const layer of layerOrder) {
                    const itemLevel = playerItems[layer.index] || 0;
                    const imagePath = `/img/shop/${layer.folder}/${itemLevel}.png`;

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
              marginBottom: 10,
              border: `1px solid ${borderColor}`,
              boxShadow,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong>Wallet Address: </strong>
                <span style={{ wordBreak: 'break-all' }}>{displayAddress}</span>
              </div>
              <CopyWalletButton address={userAddress} />
            </div>
          </div>
          <div
            style={{
              background: cardBg,
              padding: '10px 15px',
              borderRadius: '10px',
              marginBottom: 10,
              border: `1px solid ${borderColor}`,
              boxShadow,
            }}
            className='mt-4'
          >
            <strong>RabbitPoints:</strong> {rabbitPoints} <br />
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
        <div className="w-full" style={{ color: textColor }}>
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
            <h4 className="text-lg font-semibold mb-3 text-center">
              RabbitStatio
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: 10,
                color: textColor,
              }}
            >
              <li>Number of clothes: <strong>{rawStats.clothes}/6</strong></li>
              <li>Boost: <strong>{rawStats.boost}%</strong></li>
              <li>Total clicks: <strong>{rawStats.totalClicks}</strong></li>
              <li>Streak: <strong>{rawStats.streak} days</strong></li>
            </ul>
          </div>
        </div>
        <RadarStatsChart />
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
          <p style={{ color: textColor, margin: 0 }}>Please login your <XLogo size={16} className={isNight ? 'text-white' : 'text-black'} /> account to access your profile.</p>
        </div>
      </Wrapper>
    )
  )
}