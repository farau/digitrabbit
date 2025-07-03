'use client'

import { useProfile } from '@/app/hooks/useProfile'
import Image from 'next/image'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Download } from 'lucide-react'
import Wrapper from '@/app/components/Wrapper'
import { useTheme } from '@/context'

export default function Profile({ embeddedWallet, playerData }) {
  const { themeMode } = useTheme();
  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333'
  const cardBg = isNight ? '#222' : '#f3f3f3'
  const labelColor = isNight ? '#ccc' : '#333'
  const tooltipBg = isNight ? '#333' : '#fff'
  const tooltipColor = isNight ? '#eee' : '#333'
  const borderColor = isNight ? '#444' : '#ddd'
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'

  //const { profile, loading, error, wallets } = useProfile()
  const { rabbitPoints, playerItems, totalClicks, sessionEndsAt, boost, streak } = playerData

  const rawStats = {
    clothes: playerItems.reduce((count, val) => count + (val > 0 ? 1 : 0), 0),
    boost: Number(boost),
    totalClicks: Number(totalClicks),
    streak: Number(streak),
  }

  const blockchainStats = [
    {
      stat: 'Clothes',
      value: (rawStats.clothes ?? 0) / 6,           // Max: 6
      real: `${rawStats.clothes ?? 0}/6`
    },
    {
      stat: 'Boost',
      value: (rawStats.boost ?? 0) / 360,           // Max: 360%
      real: `${rawStats.boost ?? 0}%`
    },
    {
      stat: 'Total clicks',
      value: Math.min((rawStats.totalClicks ?? 0) / 10000, 1),  // Max ≈ 10k
      real: `${rawStats.totalClicks ?? 0}`
    },
    {
      stat: 'Streak',
      value: (rawStats.streak ?? 0) / 50,           // Max ≈ 50
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

  const userAddress =
    embeddedWallet?.address || '0x0000000000000000000000000000000000000000'
  const displayAddress = userAddress.slice(0, 4) + '...' + userAddress.slice(-4)


  return (embeddedWallet ?
    <Wrapper>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <Image
            src="/img/profile-rabbit.jpg"
            alt="Avatar"
            width={80}
            height={80}
            className="w-24 h-24 rounded-full border-2 shadow-md"
            style={{
              borderRadius: '50%',
              border: `3px solid ${isNight ? '#888' : '#ddd'}`,
            }}
          />
          <a
            href="/img/profile-rabbit.jpg"
            download
            className="mt-2 text-xs hover:underline"
            style={{ color: isNight ? '#90cdf4' : '#3b82f6' }}
          >
            <Download className="w-3 h-3" />
          </a>
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
            <strong>Wallet Address: </strong>
            <span style={{ wordBreak: 'break-all' }}>{displayAddress}</span>
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
          >
            <strong>RabbitPoints:</strong> {rabbitPoints} <br />
            <strong>Points (Partnership NFTs):</strong> TBA
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 flex flex-col md:flex-row gap-8 items-start mt-4">
        <div className="w-full" style={{ color: textColor }}>
          <div
            style={{
              background: cardBg,
              padding: '10px 15px',
              marginTop: 50,
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
    :
    <Wrapper>
      <p>Please connect your wallet to see your profile.</p>
    </Wrapper>
  )
}
