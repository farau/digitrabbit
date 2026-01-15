'use client'


import { Download, Gift, Loader2, Trophy } from 'lucide-react'
import Image from 'next/image'
import { XLogo } from '@/utils/constants'
import Wrapper from '@/app/components/Wrapper'
import { useTheme, useGame } from '@/context'
import DynamicAvatar from '@/app/components/DynamicAvatar'
import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import WalletButton from './WalletButton'
import { useBalance } from 'wagmi'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts'


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
        marginBottom: 30,
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



export default function Profile({ playerData }) {
  const { user } = usePrivy();
  const { themeMode } = useTheme();
  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333'
  const cardBg = isNight ? '#222' : '#f3f3f3'
  const borderColor = isNight ? '#444' : '#ddd'
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'


  const { embeddedWallet, validationError, isValidating } = useGame()


  const { rabbitPoints, playerItems, totalClicks, sessionEndsAt, boost, streak, hasClaimedPoints, maxClicks, dailyMessages, weeklyMessages, gamePlayed } = playerData


  const { data: balance, refetch: refetchBalance } = useBalance({
    address: embeddedWallet?.address,
  });


  const rawStats = {
    totalClicks: Number(totalClicks),
    streak: Number(streak),
    maxClicks: Number(maxClicks),
    gamePlayed: Number(gamePlayed),
  }

  const blockchainStats = [
    {
      stat: 'Total clicks',
      value: Math.min((rawStats.totalClicks ?? 0) / 100000, 1),
      real: `${rawStats.totalClicks ?? 0}`
    },
    {
      stat: 'Streak',
      value: Math.min((rawStats.streak ?? 0) / 40, 1),
      real: `${rawStats.streak ?? 0} days`
    },
    {
      stat: 'Game played',
      value: Math.min((rawStats.gamePlayed ?? 0) / 60, 1),
      real: `${rawStats.gamePlayed ?? 0}`
    },
    {
      stat: 'Max clicks',
      value: Math.min((rawStats.maxClicks ?? 0) / 359, 1),
      real: `${rawStats.maxClicks ?? 0} (${Math.floor(1000 / (rawStats.maxClicks / 60))} ms/click)`
    }
  ];


  // ✅ NEW: Prepare messaging data for chart
  const messageChartData = [
    { day: 'Today', messages: dailyMessages },
    { day: '-1d', messages: Number(weeklyMessages[1]) ?? 0 },
    { day: '-2d', messages: Number(weeklyMessages[2]) ?? 0 },
    { day: '-3d', messages: Number(weeklyMessages[3]) ?? 0 },
    { day: '-4d', messages: Number(weeklyMessages[4]) ?? 0 },
    { day: '-5d', messages: Number(weeklyMessages[5]) ?? 0 },
    { day: '-6d', messages: Number(weeklyMessages[6]) ?? 0 },
  ];

  const totalWeeklyMessages = weeklyMessages.reduce((sum, count) => sum + Number(count), 0);


  const renderVerticalLabels = ({ payload, x, y }) => {
    const angle = payload.coordinate?.angle ?? 0
    const label = payload.value
    const isLeft = angle > 90 && angle < 270


    return (
      <text
        x={x}
        y={y}
        textAnchor={isLeft ? 'end' : 'start'}
        dominantBaseline="middle"
        style={{ fill: isNight ? '#ccc' : '#333', fontSize: 12 }}
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
            backgroundColor: isNight ? '#333' : '#fff',
            border: `1px solid ${borderColor}`,
            padding: '8px',
            borderRadius: 4,
            color: isNight ? '#eee' : '#333',
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

  // ✅ NEW: Message chart tooltip
  const MessageTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: isNight ? '#333' : '#fff',
            border: `1px solid ${borderColor}`,
            padding: '8px',
            borderRadius: 4,
            color: isNight ? '#eee' : '#333',
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>{payload[0].payload.day}</strong>: {payload[0].value} messages
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
            <PolarRadiusAxis
              domain={[0, 1]}
              tick={false}
              axisLine={false}
            />
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


  function MessageChart() {
    return (
      <div className="w-full md:w-64 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={messageChartData}>
            <XAxis
              dataKey="day"
              stroke={isNight ? '#555' : '#000000ff'}
              style={{ fontSize: 12 }}
            />
            <YAxis
              stroke={isNight ? '#555' : '#000000ff'}
              style={{ fontSize: 12 }}
            />
            <Tooltip content={<MessageTooltip />} />
            <Bar
              dataKey="messages"
              stroke="#4f46e5"
              fill="#4f46e5"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
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
    const num = parseFloat(value) / 10 ** 18; // Convertir de wei à ether
    return num.toFixed(5).replace(/\.?0+$/, '');
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
                {balance ? `${formatBalance(balance.value)} ${balance.symbol}` : 'Loading...'}
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


      {/* ✅ NEW: Messages Section */}
      <div className="flex-1 flex flex-col md:flex-row gap-8 items-stretch mt-4">
        <div className="w-full md:w-1/2 flex flex-col justify-center" style={{ color: textColor }}>
          <div
            style={{
              background: cardBg,
              padding: '10px 15px',
              borderRadius: '10px',
              border: `1px solid ${borderColor}`,
              boxShadow,
              flex: 0,  // ✅ Remplit tout l'espace vertical
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: 0,
                marginBottom: 15,
                color: isNight ? '#e2e8f0' : '#334155',
              }}
              className='text-center'
            >
              Messages This Week
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
              marginBottom: '15px'
            }}>
              <div style={{
                background: isNight ? '#1a1a1a' : '#e9efeaff',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: isNight ? '#888' : '#666' }}>Today</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                  {dailyMessages}
                </p>
              </div>
              <div style={{
                background: isNight ? '#1a1a1a' : '#e9efeaff',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: isNight ? '#888' : '#666' }}>Total Week</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                  {totalWeeklyMessages}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* RIGHT - Chart */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="w-full md:w-1/2 -ml-8 mt-4">
            <MessageChart />
          </div>
        </div>
      </div>


      {/* Stats Section */}
      <div className="flex-1 flex flex-col md:flex-row gap-8 items-stretch mt-4">
        {/* LEFT - Table */}
        <div className="w-full md:w-1/2 flex flex-col" style={{ color: textColor }}>
          <div
            style={{
              background: cardBg,
              padding: '10px 15px',
              marginTop: 10,
              borderRadius: '10px',
              border: `1px solid ${borderColor}`,
              boxShadow,
              flex: 1,  // ✅ Remplit tout l'espace vertical
              display: 'flex',
              flexDirection: 'column',
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
                    Game played
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
                    <strong style={{ fontFamily: 'inherit' }}>{rawStats.gamePlayed} games</strong>
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
        {/* RIGHT - Radar Chart */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div style={{ flex: 1, display: 'flex' }}>
            <RadarStatsChart />
          </div>
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