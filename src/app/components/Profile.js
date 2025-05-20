'use client'

import { useProfile } from '@/app/hooks/useProfile'
import Image from 'next/image'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { Download } from 'lucide-react'

export default function Profile() {
    const { profile, loading, error } = useProfile()

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
                style={{ fill: '#333', fontSize: 12 }}
            >
                {label}
            </text>
        )
    }
        
    
    // ✅ Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
        const { stat, real } = payload[0].payload
        return (
            <div style={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            padding: '8px',
            borderRadius: 4
            }}>
            <p style={{ margin: 0, color: '#333' }}><strong>{stat}</strong>: {real}</p>
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
                <PolarGrid />
                <PolarAngleAxis
                dataKey="stat"
                tick={renderVerticalLabels}
                />
                <PolarRadiusAxis domain={[0, 1]} tickCount={6} />
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

    if (loading) return <p style={{ margin: 0, padding: 10, color: "black" }}>Loading...</p>
    if (error) return <p style={{ margin: 0, padding: 10, color: "black" }}>{error}</p>
    if (!profile) return <p style={{ margin: 0, padding: 10, color: "black" }}>Please connect your wallet to see your profile.</p>

    const displayAddress = profile.userAddress.slice(0, 4) + '...' + profile.userAddress.slice(-4)

    return (
        <div style={{
            maxWidth: 600,
            margin: '20px auto',
            background: 'rgba(255, 255, 255, 0.85)',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            padding: 20,
            fontFamily: 'sans-serif'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div className="flex flex-col items-center">
                    <Image
                        src="/img/profile-rabbit.jpg"
                        alt="Avatar"
                        className="w-24 h-24 rounded-full border-2 border-white shadow-md"
                        width={80}
                        height={80}
                        style={{
                            borderRadius: '50%',
                            border: '3px solid #ddd'
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
                <div style={{ flex: 1 , color: '#333'}}>
                    <div style={{
                        background: '#f3f3f3',
                        padding: '10px 15px',
                        borderRadius: '10px',
                        marginBottom: 10
                    }}>
                        <strong>Wallet Address: </strong>
                        <span style={{ wordBreak: 'break-all' }}>
                        {displayAddress}
                        </span>
                    </div>
                    <div style={{
                        background: '#f3f3f3',
                        padding: '10px 15px',
                        borderRadius: '10px'
                    }}>
                        <strong>RabbitScore:</strong> 213 
                        <br />
                        <strong>Points (Socials):</strong> {profile.points_socials}
                    </div>
                </div>
            </div>

            {/* Section des statistiques blockchain */}
            <div className="flex-1 flex flex-col md:flex-row gap-8 items-start mt-4">
                <div className="w-full" style={{ color: '#333'}}>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 text-center">RabbitStatio</h4>
                    <div style={{ background: '#f3f3f3', padding: '10px 15px', borderRadius: '10px'}}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                            <li>Number of clothes: <strong>4/6</strong></li>
                            <li>Bonus: <strong>x1.6</strong></li>
                            <li>Transactions: <strong>152</strong></li>
                            <li>Streak: <strong>10 days</strong></li>
                        </ul>
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="w-full md:w-64 h-64">
                    <RadarStatsChart />
                </div>
            </div>
        </div>
    )
}
