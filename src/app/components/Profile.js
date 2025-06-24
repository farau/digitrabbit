'use client'

import { useProfile } from '@/app/hooks/useProfile'
import Image from 'next/image'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { Download } from 'lucide-react'
import Wrapper from '@/app/components/Wrapper';

export default function Profile({ themeMode = 'light' }) {
    const isNight = themeMode === 'dark';
    const textColor = isNight ? '#eee' : '#333';
    const cardBg = isNight ? '#222' : '#f3f3f3';
    const labelColor = isNight ? '#ccc' : '#333';
    const tooltipBg = isNight ? '#333' : '#fff';
    const tooltipColor = isNight ? '#eee' : '#333';

    const { profile, loading, error, embeddedWallet, smartWallet, wallets } = useProfile()


    const rawStats = {
        clothes: 4,             // max = 6
        bonus: 1.6,             // max = 2
        tx: 152,                // max = 1000
        streak: 10              // max = 30
    }
      
    // 🟠 Données normalisées + stockage valeur réelle pour le tooltip
    const blockchainStats = [
        { stat: 'Clothes', value: rawStats.clothes / 6, real: `${rawStats.clothes}/6` },
        { stat: 'Bonus', value: rawStats.bonus / 2, real: `x${rawStats.bonus}` },
        { stat: 'Tx', value: rawStats.tx / 1000, real: `${rawStats.tx}` },
        { stat: 'Streak', value: rawStats.streak / 30, real: `${rawStats.streak} days` },
    ]

    const renderVerticalLabels = ({ payload, x, y, textAnchor }) => {
        const angle = payload.coordinate?.angle ?? 0;
        const label = payload.value;
        const shouldRotate = label === 'Streak' || label === 'Bonus';
        const isLeft = angle > 90 && angle < 270;

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
        );
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const { stat, real } = payload[0].payload;
            return (
                <div style={{
                    backgroundColor: tooltipBg,
                    border: '1px solid #666',
                    padding: '8px',
                    borderRadius: 4
                }}>
                    <p style={{ margin: 0, color: tooltipColor }}>
                        <strong>{stat}</strong>: {real}
                    </p>
                </div>
            );
        }
        return null;
    };

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
        );
    }

  if (loading) return <p>Loading...</p>
  if (error) return <p>{error}</p>
  if (!profile) return <p>Please connect your wallet to see your profile.</p>

  const userAddress =
    wallets?.[0]?.address ||
    '0x0000000000000000000000000000000000000000'

  const displayAddress = userAddress.slice(0, 4) + '...' + userAddress.slice(-4)

  const renderWallet = (wallet, label) => (
    <div
      key={wallet.address}
      style={{
        background: cardBg,
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '0.875rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
      }}
    >
      <span>
        <strong>{label}:</strong>{' '}
        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
      </span>
    </div>
  )

  return (
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
            className="mt-2 text-xs text-blue-500 hover:underline"
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
            }}
          >
            <strong>RabbitScore:</strong> 213 <br />
            <strong>Points (Socials):</strong> {profile.points_socials ?? 0}
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
            }}
          >
            <h4 className="text-lg font-semibold mb-3 text-center">RabbitStatio</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
              <li>Number of clothes: <strong>4/6</strong></li>
              <li>Bonus: <strong>x1.6</strong></li>
              <li>Transactions: <strong>152</strong></li>
              <li>Streak: <strong>10 days</strong></li>
            </ul>
          </div>
        </div>
        <RadarStatsChart />
      </div>
    </Wrapper>
  )
}