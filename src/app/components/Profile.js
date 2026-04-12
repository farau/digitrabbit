'use client'


import Image from 'next/image'
import { XLogo } from '@/utils/constants'
import Wrapper from '@/app/components/Wrapper'
import { useTheme, useGame } from '@/context'
import { memo, useEffect, useMemo, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import WalletButton from './WalletButton'
import { useBalance } from 'wagmi'
import { getLeagueCardBackground, getLeagueFromMetrics } from '@/utils/league'
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
  const [claimedQuestsCount, setClaimedQuestsCount] = useState(null)
  const [claimedQuestsUpdatedAt, setClaimedQuestsUpdatedAt] = useState(null)
  const [relativeTimeTick, setRelativeTimeTick] = useState(Date.now())
  const [userLeaderboardRank, setUserLeaderboardRank] = useState(null)
  const [leaderboardTotalPlayers, setLeaderboardTotalPlayers] = useState(0)

  useEffect(() => {
    if (!embeddedWallet?.address) {
      setClaimedQuestsCount(null)
      return
    }

    let isCancelled = false
    const controller = new AbortController()

    async function fetchClaimedQuestsCount() {
      try {
        const response = await fetch(
          `/api/users/profile/${encodeURIComponent(embeddedWallet.address)}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch profile stats: ${response.status}`)
        }

        const payload = await response.json()
        const nextCount = Number(payload?.profile?.questsClaimed || 0)
        const updatedAtRaw = payload?.metadata?.timestamp
        const updatedAtMs = updatedAtRaw ? new Date(updatedAtRaw).getTime() : Date.now()

        if (!isCancelled) {
          setClaimedQuestsCount(nextCount)
          setClaimedQuestsUpdatedAt(Number.isFinite(updatedAtMs) ? updatedAtMs : Date.now())
        }
      } catch (error) {
        if (error?.name === 'AbortError') return
        console.error('Failed to fetch claimed quests count:', error)
        if (!isCancelled) {
          setClaimedQuestsCount(0)
          setClaimedQuestsUpdatedAt(null)
        }
      }
    }

    fetchClaimedQuestsCount()

    return () => {
      isCancelled = true
      controller.abort()
    }
  }, [embeddedWallet?.address])

  useEffect(() => {
    if (!embeddedWallet?.address) {
      setUserLeaderboardRank(null)
      setLeaderboardTotalPlayers(0)
      return
    }

    let isCancelled = false
    const controller = new AbortController()

    async function fetchLeaderboardRank() {
      try {
        const response = await fetch(
          `/api/leaderboard?user=${encodeURIComponent(embeddedWallet.address)}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch leaderboard rank: ${response.status}`)
        }

        const payload = await response.json()
        const rank = Number(payload?.userRank?.rank || 0)
        const totalPlayers = Number(payload?.metadata?.totalPlayers || 0)

        if (!isCancelled) {
          setUserLeaderboardRank(rank > 0 ? rank : null)
          setLeaderboardTotalPlayers(totalPlayers > 0 ? totalPlayers : 0)
        }
      } catch (error) {
        if (error?.name === 'AbortError') return
        console.error('Failed to fetch leaderboard rank:', error)
        if (!isCancelled) {
          setUserLeaderboardRank(null)
          setLeaderboardTotalPlayers(0)
        }
      }
    }

    fetchLeaderboardRank()

    return () => {
      isCancelled = true
      controller.abort()
    }
  }, [embeddedWallet?.address])

  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTimeTick(Date.now())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const claimedQuestsUpdatedLabel = useMemo(() => {
    if (!claimedQuestsUpdatedAt) return null
    const diffMs = Math.max(0, relativeTimeTick - claimedQuestsUpdatedAt)
    const diffMinutes = Math.floor(diffMs / 60000)
    return `updated ${diffMinutes} mn ago`
  }, [claimedQuestsUpdatedAt, relativeTimeTick])

  const { data: balance } = useBalance({
    address: embeddedWallet?.address,
  });

  const rawStats = {
    totalClicks: Number(totalClicks),
    streak: Number(streak),
    maxClicks: Number(maxClicks),
    gamePlayed: Number(gamePlayed),
  }

  const playerLeague = getLeagueFromMetrics({
    rank: userLeaderboardRank,
    totalPlayers: leaderboardTotalPlayers
  })

  const hasLeague = playerLeague.id !== 'none'

  // ── League-aware design tokens ────────────────────────────────────────────
  // Outer wrapper
  const leagueFrameBorder = hasLeague ? playerLeague.accent : borderColor
  const leagueFrameBackground = getLeagueCardBackground(playerLeague.id, isNight)
  const leagueFrameGlow = hasLeague
    ? `0 0 0 1px ${playerLeague.accent}40, 0 12px 26px ${playerLeague.accent}2d`
    : boxShadow

  // Inner cards background: slightly tinted when league is active
  const innerCardBg = hasLeague
    ? (isNight
      ? `color-mix(in srgb, ${playerLeague.accent} 6%, #1a1a1a)`
      : `color-mix(in srgb, ${playerLeague.accent} 5%, #f5f5f5)`)
    : cardBg

  // Inner cards border: accent at low opacity
  const innerCardBorder = hasLeague
    ? `${playerLeague.accent}55`
    : borderColor

  // Inner cards box-shadow: very subtle league glow
  const innerCardShadow = hasLeague
    ? `0 2px 10px ${playerLeague.accent}18`
    : boxShadow

  // Stat cells background (inside cards)
  const statCellBg = hasLeague
    ? (isNight
      ? `color-mix(in srgb, ${playerLeague.accent} 10%, #111)`
      : `color-mix(in srgb, ${playerLeague.accent} 8%, #e8e8e8)`)
    : (isNight ? '#1a1a1a' : '#e9efeaff')

  // Table row divider
  const tableDivider = hasLeague
    ? `${playerLeague.accent}33`
    : (isNight ? '#475569' : '#e2e8f0')

  // Text colors
  const leagueTextColor = hasLeague
    ? (isNight ? '#f8fafc' : '#1f2937')
    : (isNight ? '#cbd5e1' : '#475569')

  const leagueDescription = playerLeague.id === 'gold'
    ? 'Elite bracket. You are among the highest-performing rabbits this season.'
    : playerLeague.id === 'silver'
      ? 'Strong tier. You are above average and close to elite placement.'
      : playerLeague.id === 'bronze'
        ? 'Solid start. Keep grinding to climb toward Silver.'
        : 'You are currently unranked. Keep playing and claiming quests to enter a league.'

  const leagueRankText = playerLeague.rank && playerLeague.totalPlayers
    ? `Rank #${playerLeague.rank} of ${playerLeague.totalPlayers}`
    : null

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
        <div style={{
          backgroundColor: isNight ? '#333' : '#fff',
          border: `1px solid ${borderColor}`,
          padding: '8px',
          borderRadius: 4,
          color: isNight ? '#eee' : '#333',
        }}>
          <p style={{ margin: 0 }}>
            <strong>{stat}</strong>: {real}
          </p>
        </div>
      )
    }
    return null
  }

  const MessageTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: isNight ? '#333' : '#fff',
          border: `1px solid ${borderColor}`,
          padding: '8px',
          borderRadius: 4,
          color: isNight ? '#eee' : '#333',
        }}>
          <p style={{ margin: 0 }}>
            <strong>{payload[0].payload.day}</strong>: {payload[0].value} messages
          </p>
        </div>
      )
    }
    return null
  }

  // Radar stroke/fill tinted by league when active
  const radarStroke = hasLeague ? playerLeague.accent : '#4f46e5'
  const radarFill = hasLeague
    ? playerLeague.accentLight ?? playerLeague.accent
    : '#818cf8'

  function RadarStatsChart() {
    // Labels personnalisés : latéraux (Streak, Max clicks) en vertical, haut/bas normaux
    const renderRadarLabel = ({ payload, x, y, cx, cy }) => {
      const label = payload.value
      const dx = x - cx
      // Labels sur les côtés (gauche/droite) => rotation 90°
      const isSide = Math.abs(dx) > Math.abs(y - cy) * 1.2
      if (isSide) {
        return (
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(-90, ${x}, ${y})`}
            style={{ fill: isNight ? '#ccc' : '#333', fontSize: 11 }}
          >
            {label}
          </text>
        )
      }
      const isTop = y < cy
      return (
        <text
          x={x}
          y={isTop ? y - 6 : y + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fill: isNight ? '#ccc' : '#333', fontSize: 11 }}
        >
          {label}
        </text>
      )
    }

    return (
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={blockchainStats} outerRadius="90%" margin={{ top: 24, right: 28, bottom: 24, left: 28 }}>
            <PolarGrid stroke={hasLeague ? `${playerLeague.accent}55` : (isNight ? '#555' : '#ccc')} />
            <PolarAngleAxis dataKey="stat" tick={renderRadarLabel} />
            <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Stats"
              dataKey="value"
              stroke={radarStroke}
              fill={radarFill}
              fillOpacity={0.55}
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
          <BarChart data={messageChartData} margin={{ top: 8, right: 16, left: 16, bottom: 0 }}>
            <XAxis dataKey="day" stroke={isNight ? '#555' : '#000'} style={{ fontSize: 12 }} />
            <YAxis stroke={isNight ? '#555' : '#000'} style={{ fontSize: 12 }} width={32} />
            <Tooltip content={<MessageTooltip />} />
            <Bar
              dataKey="messages"
              stroke={radarStroke}
              fill={radarStroke}
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
        aria-label="Copy wallet address"
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {isCopied ? 'Copied!' : 'Copy'}
      </button>
    );
  }

  if (isValidating) {
    return (
      <Wrapper>
        <div style={{
          background: cardBg, padding: '20px', borderRadius: '10px',
          border: `1px solid ${borderColor}`, boxShadow, textAlign: 'center', margin: '20px'
        }}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <p className="break-all">Validating your wallet... Please wait.</p>
          </div>
        </div>
      </Wrapper>
    )
  }

  if (validationError) {
    return (
      <Wrapper>
        <div style={{
          background: cardBg, padding: '20px', borderRadius: '10px',
          border: `1px solid ${borderColor}`, boxShadow, textAlign: 'center', margin: '20px'
        }}>
          <div className="flex items-center justify-center gap-3 text-red-700">
            <p className="break-all">{validationError}</p>
          </div>
        </div>
      </Wrapper>
    )
  }

  const userAddress = embeddedWallet?.address || '0x0000000000000000000000000000000000000000'
  const displayAddress = userAddress.slice(0, 4) + '...' + userAddress.slice(-4)

  const formatBalance = (value) => {
    const num = parseFloat(value) / 10 ** 18;
    return num.toFixed(5).replace(/\.?0+$/, '');
  };

  return (embeddedWallet ?
    <Wrapper>
      {/* ── Outer league frame ─────────────────────────────────────────────── */}
      <div style={{
        border: `2px solid ${leagueFrameBorder}`,
        background: leagueFrameBackground,
        boxShadow: leagueFrameGlow,
        borderRadius: '14px',
        padding: '14px'
      }}>

        {/* ── Avatar + wallet/balance/points row ───────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-start gap-5">

          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div style={{
              padding: '3px',
              borderRadius: '50%',
              background: hasLeague
                ? `linear-gradient(135deg, ${playerLeague.accent}, ${playerLeague.accentLight ?? playerLeague.accent})`
                : borderColor,
              boxShadow: hasLeague ? `0 0 14px ${playerLeague.accent}55` : 'none',
            }}>
              <Image
                src={twitterProfilePictureUrl}
                alt={`${twitterDisplayName} profile picture`}
                width={96}
                height={96}
                style={{
                  borderRadius: '50%',
                  display: 'block',
                  objectFit: 'cover'
                }}
              />
            </div>
            <p className="text-sm mt-2 font-semibold" style={{ color: textColor }}>
              {twitterDisplayName}
            </p>
            {twitterAccount?.username && (
              <p className="text-xs mt-1" style={{ color: hasLeague ? playerLeague.accent : textColor }}>
                @{twitterAccount.username}
              </p>
            )}
          </div>

          {/* Infos */}
          <div style={{ flex: 1, color: textColor }}>
            {/* Wallet + balance */}
            <div style={{
              background: innerCardBg,
              padding: '10px 15px',
              borderRadius: '10px',
              border: `1px solid ${innerCardBorder}`,
              boxShadow: innerCardShadow,
              marginBottom: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>Wallet Address:</strong>
                  <span style={{ wordBreak: 'break-all', marginLeft: '8px' }}>{displayAddress}</span>
                </div>
                <div className="flex-shrink-0">
                  <CopyWalletButton address={userAddress} />
                </div>
              </div>
              <div>
                <strong>Balance:</strong>
                <span style={{ wordBreak: 'break-all', marginLeft: '8px' }}>
                  {balance ? `${formatBalance(balance.value)} ${balance.symbol}` : 'Loading...'}
                </span>
              </div>
            </div>

            {/* RabbitPoints */}
            <div style={{
              background: innerCardBg,
              padding: '10px 15px',
              borderRadius: '10px',
              border: `1px solid ${innerCardBorder}`,
              boxShadow: innerCardShadow,
            }}>
              <strong>RabbitPoints:</strong>
              <span className="ml-2 break-all">{rabbitPoints}</span>
            </div>
          </div>
        </div>

        {/* ── League card ──────────────────────────────────────────────────── */}
        <div className="mt-4" style={{
          borderRadius: '12px',
          padding: '14px 16px',
          border: `2px solid ${leagueFrameBorder}`,
          background: hasLeague
            ? (isNight ? `${playerLeague.accent}1f` : `${playerLeague.accent}17`)
            : (isNight ? '#1f2937' : '#f8fafc'),
          boxShadow: leagueFrameGlow
        }}>
          <p style={{
            margin: 0, fontSize: '12px', letterSpacing: '0.06em',
            textTransform: 'uppercase', color: leagueTextColor, opacity: 0.9
          }}>
            Current League
          </p>
          <h2 style={{ margin: '6px 0 4px 0', fontSize: '24px', fontWeight: 800, color: leagueTextColor }}>
            {playerLeague.badge ? `${playerLeague.badge} ` : ''}{playerLeague.label}
          </h2>
          {leagueRankText && (
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: leagueTextColor, opacity: 0.88, fontWeight: 600 }}>
              {leagueRankText}
            </p>
          )}
          <p style={{ margin: 0, fontSize: '14px', color: leagueTextColor, opacity: 0.92 }}>
            {leagueDescription}
          </p>
        </div>

        {/* ── Messages section ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col md:flex-row gap-8 items-stretch mt-4">
          <div className="w-full md:w-1/2 flex flex-col justify-center" style={{ color: textColor }}>
            <div style={{
              background: innerCardBg,
              padding: '10px 15px',
              borderRadius: '10px',
              border: `1px solid ${innerCardBorder}`,
              boxShadow: innerCardShadow,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <h3 style={{
                fontSize: '18px', fontWeight: '600', margin: 0, marginBottom: 15,
                color: isNight ? '#e2e8f0' : '#334155',
              }} className="text-center">
                Messages
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                {[
                  { label: 'Today', value: isWeeklyReady ? dailyMessages : '...' },
                  { label: 'Total Week', value: isWeeklyReady ? totalWeeklyMessages : '...' },
                  {
                    label: 'Total',
                    value: hasTotalMessages ? formatCompactCount(totalMessagesCount) : '...',
                    title: hasTotalMessages ? totalMessagesCount.toLocaleString('en-US') : undefined,
                  },
                ].map(({ label, value, title }) => (
                  <div key={label} style={{
                    background: statCellBg,
                    padding: '12px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    flex: '1 1 120px',
                    border: hasLeague ? `1px solid ${playerLeague.accent}22` : 'none',
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', color: isNight ? '#888' : '#666' }}>{label}</p>
                    <p title={title} style={{
                      margin: '8px 0 0 0',
                      fontSize: 'clamp(18px, 4vw, 24px)',
                      fontWeight: 'bold',
                      lineHeight: 1.15,
                      wordBreak: 'break-word',
                      color: hasLeague ? playerLeague.accent : textColor,
                    }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Message chart */}
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

        {/* ── Stats section ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 items-stretch mt-4">

          {/* Stats table */}
          <div className="w-full md:w-7/12 flex flex-col" style={{ color: textColor }}>
            <div style={{
              background: innerCardBg,
              padding: '10px 15px',
              marginTop: 10,
              borderRadius: '10px',
              border: `1px solid ${innerCardBorder}`,
              boxShadow: innerCardShadow,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <h3 style={{
                fontSize: '18px', fontWeight: '600', margin: 0,
                color: isNight ? '#e2e8f0' : '#334155',
              }} className="text-center">
                RabbitStats
              </h3>
              <table className="w-full" style={{ background: 'transparent', fontFamily: 'inherit', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <tbody style={{ background: 'transparent' }}>
                  {[
                    { label: 'Total clicks', value: rawStats.totalClicks, sub: null },
                    { label: 'Streak', value: `${rawStats.streak} days`, sub: null },
                    { label: 'Game played', value: `${rawStats.gamePlayed} games`, sub: null },
                    {
                      label: 'Max clicks',
                      value: rawStats.maxClicks,
                      sub: `${Math.floor(1000 / (rawStats.maxClicks / 60))} ms/click`
                    },
                    {
                      label: 'Quests claimed',
                      value: claimedQuestsCount ?? '...',
                      sub: claimedQuestsUpdatedLabel
                    },
                  ].map(({ label, value, sub }, i, arr) => (
                    <tr key={label} style={{
                      borderBottom: i < arr.length - 1 ? `1px solid ${tableDivider}` : 'none',
                      background: 'transparent'
                    }}>
                      <td style={{
                        color: textColor, paddingTop: '12px', paddingBottom: '12px',
                        fontSize: '16px', fontWeight: '500', background: 'transparent', fontFamily: 'inherit',
                      }}>
                        {label}
                      </td>
                      <td style={{
                        color: textColor, paddingTop: '12px', paddingBottom: '12px',
                        textAlign: 'right', fontSize: '16px', fontWeight: '500',
                        background: 'transparent', fontFamily: 'inherit',
                      }}>
                        <strong style={{
                          fontFamily: 'inherit',
                          color: hasLeague ? playerLeague.accent : textColor,
                        }}>
                          {value}
                        </strong>
                        {sub && (
                          <p style={{ fontFamily: 'inherit', fontSize: '12px', opacity: 0.75, marginTop: '4px' }}>
                            {sub}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Radar chart */}
          <div className="w-full md:w-5/12 flex flex-col items-center justify-center">
            <RadarStatsChart />
          </div>
        </div>

      </div>
    </Wrapper>

    : (
      <Wrapper>
        <div style={{
          background: cardBg, padding: '20px', borderRadius: '10px',
          border: `1px solid ${borderColor}`, boxShadow, textAlign: 'center', margin: '20px'
        }}>
          <p style={{ color: textColor, margin: 0, marginBottom: '12px' }}>
            Please login your <XLogo size={16} className={isNight ? 'text-white' : 'text-black'} /> account to access your profile.
          </p>
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
    if (Number(prevWeekly[i]) !== Number(nextWeekly[i])) return false
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