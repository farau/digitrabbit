'use client'


import Image from 'next/image'
import { XLogo } from '@/utils/constants'
import Wrapper from '@/app/components/Wrapper'
import { useTheme, useGame } from '@/context'
import { memo, useState } from 'react'
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

function Profile({ playerData }) {
  const { user } = usePrivy();
  const { themeMode } = useTheme();
  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333'
  const cardBg = isNight ? '#222' : '#f3f3f3'
  const borderColor = isNight ? '#444' : '#ddd'
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'


  const { embeddedWallet, validationError, isValidating } = useGame()
  const twitterAccount = user?.linkedAccounts?.find(
    (account) => account.type === 'twitter_oauth'
  )
  const twitterProfilePictureUrl = twitterAccount?.profilePictureUrl || '/img/default-avatar.jpg'
  const twitterDisplayName = twitterAccount?.name || twitterAccount?.username || 'Rabbit'


  const { rabbitPoints, totalClicks, streak, maxClicks, dailyMessages, weeklyMessages, gamePlayed, totalMessages } = playerData


  const { data: balance } = useBalance({
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


  // Prepare messaging data for chart
  const isWeeklyReady = Array.isArray(weeklyMessages)


  const messageChartData = isWeeklyReady ? [
    { day: 'Today', messages: dailyMessages },
    { day: '-1d', messages: Number(weeklyMessages[1]) ?? 0 },
    { day: '-2d', messages: Number(weeklyMessages[2]) ?? 0 },
    { day: '-3d', messages: Number(weeklyMessages[3]) ?? 0 },
    { day: '-4d', messages: Number(weeklyMessages[4]) ?? 0 },
    { day: '-5d', messages: Number(weeklyMessages[5]) ?? 0 },
    { day: '-6d', messages: Number(weeklyMessages[6]) ?? 0 },
  ] : [];

  const totalWeeklyMessages = isWeeklyReady
    ? weeklyMessages.reduce((sum, count) => sum + Number(count), 0)
    : 0
  const totalMessagesCount = Number(totalMessages)
  const hasTotalMessages = Number.isFinite(totalMessagesCount)

  const formatCompactCount = (value) => (
    new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value)
  )

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
      <div className="w-full max-w-sm h-64 mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={messageChartData}
            margin={{ top: 8, right: 16, left: 16, bottom: 0 }}
          >
            <XAxis
              dataKey="day"
              stroke={isNight ? '#555' : '#000000ff'}
              style={{ fontSize: 12 }}
            />
            <YAxis
              stroke={isNight ? '#555' : '#000000ff'}
              style={{ fontSize: 12 }}
              width={32}
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
        {/* Avatar X/Twitter */}
        <div className="flex flex-col items-center">
          <Image
            src={twitterProfilePictureUrl}
            alt={`${twitterDisplayName} profile picture`}
            width={96}
            height={96}
            style={{
              borderRadius: '50%',
              border: `1px solid ${borderColor}`,
              boxShadow,
              objectFit: 'cover'
            }}
          />
          {twitterAccount?.username && (
            <p className="text-xs mt-2" style={{ color: textColor }}>
              @{twitterAccount.username}
            </p>
          )}
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
              Messages
            </h3>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '15px',
              marginBottom: '15px'
            }}>
              <div style={{
                background: isNight ? '#1a1a1a' : '#e9efeaff',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                flex: '1 1 120px'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: isNight ? '#888' : '#666' }}>Today</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                  {isWeeklyReady ? dailyMessages : '...'}
                </p>
              </div>
              <div style={{
                background: isNight ? '#1a1a1a' : '#e9efeaff',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                flex: '1 1 120px'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: isNight ? '#888' : '#666' }}>Total Week</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                  {isWeeklyReady ? totalWeeklyMessages : '...'}
                </p>
              </div>
              <div style={{
                background: isNight ? '#1a1a1a' : '#e9efeaff',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                flex: '1 1 120px'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: isNight ? '#888' : '#666' }}>Total</p>
                <p
                  title={hasTotalMessages ? totalMessagesCount.toLocaleString('en-US') : undefined}
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: 'clamp(18px, 4vw, 24px)',
                    fontWeight: 'bold',
                    lineHeight: 1.15,
                    wordBreak: 'break-word'
                  }}
                >
                  {hasTotalMessages ? formatCompactCount(totalMessagesCount) : '...'}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* RIGHT - Chart */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          {!isWeeklyReady ? (
            <div className="flex items-center justify-center h-64 w-full">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <MessageChart />
          )}
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

function areWeeklyMessagesEqual(prevWeekly, nextWeekly) {
  if (prevWeekly === nextWeekly) return true
  if (!Array.isArray(prevWeekly) || !Array.isArray(nextWeekly)) return false
  if (prevWeekly.length !== nextWeekly.length) return false

  for (let i = 0; i < prevWeekly.length; i += 1) {
    if (Number(prevWeekly[i]) !== Number(nextWeekly[i])) {
      return false
    }
  }

  return true
}

function arePlayerDataEqual(prev, next) {
  if (prev === next) return true
  if (!prev || !next) return false

  return (
    Number(prev.rabbitPoints) === Number(next.rabbitPoints) &&
    Number(prev.totalClicks) === Number(next.totalClicks) &&
    Number(prev.streak) === Number(next.streak) &&
    Number(prev.maxClicks) === Number(next.maxClicks) &&
    Number(prev.dailyMessages) === Number(next.dailyMessages) &&
    Number(prev.gamePlayed) === Number(next.gamePlayed) &&
    Number(prev.totalMessages) === Number(next.totalMessages) &&
    areWeeklyMessagesEqual(prev.weeklyMessages, next.weeklyMessages)
  )
}

export default memo(Profile, (prevProps, nextProps) =>
  arePlayerDataEqual(prevProps.playerData, nextProps.playerData)
)
