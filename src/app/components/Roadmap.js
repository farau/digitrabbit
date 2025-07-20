'use client'

import Image from "next/image"
import Wrapper from "./Wrapper"
import { useTheme } from '@/context'

export default function Roadmap({ embeddedWallet, refreshCounter, playerData }) {
    const { themeMode } = useTheme();

    const isNight = themeMode === 'dark';
    const textColor = isNight ? '#eee' : '#333';
    const cardBg = isNight ? '#222' : '#f3f3f3';
    const borderColor = isNight ? '#444' : '#ddd';
    const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';
    const subTextColor = isNight ? 'text-zinc-400' : 'text-gray-600';

    if (!playerData) {
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
                        <p style={{ color: textColor, margin: 0 }}>Loading Roadmap progress...</p>
                    </div>
                </div>
            </Wrapper>
        );
    }

    const totalClicks = Number(playerData.totalClicks)
    const target = 1000000;
    const progressPercentage = Math.min((totalClicks / target) * 100, 100);

    const formatNumber = (num) => {
        return num.toLocaleString();
    };

    return (
        <Wrapper>
            <div style={{
                background: cardBg,
                padding: '30px',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                boxShadow,
                textAlign: 'center',
                maxWidth: '600px',
                margin: '20px auto'
            }}>
                <div className="flex flex-col items-center gap-6">
                    {/* Roadmap Image */}
                    <div style={{
                        position: 'relative',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: `3px solid ${isNight ? '#4f46e5' : '#6366f1'}`,
                        boxShadow: isNight
                            ? '0 4px 12px rgba(79, 70, 229, 0.3)'
                            : '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}>
                        <Image
                            src="/img/roadmap-section.jpeg"
                            alt="Roadmap"
                            width={150}
                            height={150}
                            className="object-cover"
                        />
                    </div>

                    {/* Title */}
                    <h3 style={{
                        fontSize: '24px',
                        fontWeight: '600',
                        color: textColor,
                        margin: '0 0 20px 0',
                        fontStyle: 'italic'
                    }}>
                        Roadmap
                    </h3>

                    {/* Roadmap Steps - Structured List */}
                    <div style={{
                        width: '100%',
                        maxWidth: '450px',
                        textAlign: 'left',
                        background: isNight
                            ? 'rgba(30, 41, 59, 0.5)'
                            : 'rgba(248, 250, 252, 0.7)',
                        borderRadius: '12px',
                        padding: '24px',
                        border: `1px solid ${isNight ? '#374151' : '#e2e8f0'}`,
                        marginBottom: '8px'
                    }}>
                        {/* Step 1 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            marginBottom: '18px',
                            paddingBottom: '18px',
                            borderBottom: `1px solid ${isNight ? '#374151' : '#e5e7eb'}`
                        }}>
                            <div style={{
                                background: isNight ? '#4f46e5' : '#6366f1',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '600',
                                marginRight: '16px',
                                flexShrink: 0
                            }}>
                                1
                            </div>
                            <p style={{
                                fontSize: '15px',
                                color: isNight ? '#e2e8f0' : '#374155',
                                lineHeight: '1.5',
                                margin: '2px 0 0 0',
                                fontWeight: '500'
                            }}>
                                Create a beautiful community with degen vibes on MegaETH
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            marginBottom: '18px',
                            paddingBottom: '18px',
                            borderBottom: `1px solid ${isNight ? '#374151' : '#e5e7eb'}`
                        }}>
                            <div style={{
                                background: isNight ? '#4f46e5' : '#6366f1',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '600',
                                marginRight: '16px',
                                flexShrink: 0
                            }}>
                                2
                            </div>
                            <p style={{
                                fontSize: '15px',
                                color: isNight ? '#e2e8f0' : '#374155',
                                lineHeight: '1.5',
                                margin: '2px 0 0 0',
                                fontWeight: '500'
                            }}>
                                Like rabbits! 🐰
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            marginBottom: '18px',
                            paddingBottom: '18px',
                            borderBottom: `1px solid ${isNight ? '#374151' : '#e5e7eb'}`
                        }}>
                            <div style={{
                                background: isNight ? '#4f46e5' : '#6366f1',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '600',
                                marginRight: '16px',
                                flexShrink: 0
                            }}>
                                3
                            </div>
                            <p style={{
                                fontSize: '15px',
                                color: isNight ? '#e2e8f0' : '#374155',
                                lineHeight: '1.5',
                                margin: '2px 0 0 0',
                                fontWeight: '500'
                            }}>
                                Reach at least 1 million transactions on MegaETH, because we like doing degen things! 🚀
                            </p>
                        </div>

                        {/* Step 4 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start'
                        }}>
                            <div style={{
                                background: isNight ? '#4f46e5' : '#6366f1',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '600',
                                marginRight: '16px',
                                flexShrink: 0
                            }}>
                                4
                            </div>
                            <p style={{
                                fontSize: '15px',
                                color: isNight ? '#e2e8f0' : '#374155',
                                lineHeight: '1.5',
                                margin: '2px 0 0 0',
                                fontWeight: '500'
                            }}>
                                Nothing else. ✨
                            </p>
                        </div>
                    </div>

                    {/* Progress Card */}
                    <div style={{
                        background: isNight
                            ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                            : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        padding: '24px',
                        borderRadius: '12px',
                        border: `1px solid ${isNight ? '#4f46e5' : '#6366f1'}`,
                        boxShadow: isNight
                            ? '0 4px 12px rgba(79, 70, 229, 0.1)'
                            : '0 4px 12px rgba(99, 102, 241, 0.1)',
                        width: '100%',
                        maxWidth: '400px'
                    }}>
                        {/* Progress Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <span style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: isNight ? '#e2e8f0' : '#334155'
                            }}>
                                Progress
                            </span>
                            <span style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: isNight ? '#fbbf24' : '#f59e0b',
                                background: isNight
                                    ? 'rgba(251, 191, 36, 0.1)'
                                    : 'rgba(245, 158, 11, 0.1)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: `1px solid ${isNight ? '#fbbf24' : '#f59e0b'}`
                            }}>
                                {progressPercentage.toFixed(1)}%
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{
                            width: '100%',
                            height: '8px',
                            background: isNight ? '#374151' : '#e5e7eb',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: '16px'
                        }}>
                            <div
                                style={{
                                    height: '100%',
                                    background: isNight
                                        ? 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)'
                                        : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                                    borderRadius: '4px',
                                    transition: 'width 0.7s ease-out',
                                    width: `${progressPercentage}%`
                                }}
                            />
                        </div>

                        {/* Progress Stats */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{
                                fontSize: '12px',
                                color: isNight ? '#9ca3af' : '#6b7280',
                                fontWeight: '500'
                            }}>
                                {formatNumber(totalClicks)} tx
                            </span>
                            <span style={{
                                fontSize: '12px',
                                color: isNight ? '#9ca3af' : '#6b7280',
                                fontWeight: '500'
                            }}>
                                Goal: {formatNumber(target)}
                            </span>
                        </div>
                    </div>

                    {/* Motivational Message */}
                    <div style={{
                        background: isNight
                            ? 'rgba(79, 70, 229, 0.1)'
                            : 'rgba(99, 102, 241, 0.05)',
                        color: isNight ? '#a5b4fc' : '#4f46e5',
                        padding: '12px 20px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '500',
                        border: `1px solid ${isNight ? '#4f46e5' : '#a5b4fc'}`,
                        maxWidth: '350px'
                    }}>
                        Every click brings us closer to our goal! 🚀
                    </div>
                </div>
            </div>
        </Wrapper>
    );
}