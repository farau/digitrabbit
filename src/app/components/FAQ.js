'use client'

import { useTheme } from '@/context'
import Wrapper from './Wrapper'

export default function FAQ() {
    const { themeMode } = useTheme()
    const isNight = themeMode === 'dark'
    const textColor = isNight ? 'text-white' : 'text-black'
    const subTextColor = isNight ? 'text-zinc-400' : 'text-gray-600'
    const borderColor = isNight ? '#333' : '#ddd'
    const cardBg = isNight ? '#1a1a1a' : '#f3f3f3'

    return (
        <Wrapper>
            <div className="space-y-3 max-w-2xl mx-auto">
                {/* ========== NEW FEATURE: RabbitChat Section ========== */}
                <div
                    style={{
                        background: isNight
                            ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                            : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        padding: '24px',
                        borderRadius: '12px',
                        border: `2px solid ${isNight ? '#4f46e5' : '#6366f1'}`,
                        boxShadow: isNight
                            ? '0 4px 16px rgba(79, 70, 229, 0.2)'
                            : '0 4px 16px rgba(99, 102, 241, 0.15)',
                        marginBottom: '24px',
                        position: 'relative',
                    }}
                >
                    {/* Badge "New Feature" */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '-12px',
                            left: '20px',
                            background: isNight ? '#ef4444' : '#dc2626',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                        }}
                    >
                        ✨ NEW FEATURE
                    </div>

                    {/* Title */}
                    <h4
                        style={{
                            fontSize: '18px',
                            fontWeight: 600,
                            color: isNight ? '#fff' : '#1f2937',
                            margin: '0 0 18px 0',
                            marginTop: '8px',
                        }}
                    >
                        🐇 RabbitChat - Earn Points by Chatting
                    </h4>

                    {/* Network Section */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            marginBottom: '18px',
                            paddingBottom: '18px',
                            borderBottom: `1px solid ${isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        }}
                    >
                        <div
                            style={{
                                background: isNight ? '#4f46e5' : '#6366f1',
                                color: 'white',
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                fontWeight: '600',
                                marginRight: '16px',
                                flexShrink: 0,
                            }}
                        >
                            🌐
                        </div>
                        <div>
                            <p
                                style={{
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: isNight ? '#e5e7eb' : '#1f2937',
                                    margin: '0 0 4px 0',
                                }}
                            >
                                Tied to the MegaETH Blockchain
                            </p>
                            <p
                                style={{
                                    fontSize: '13px',
                                    color: isNight ? '#9ca3af' : '#6b7280',
                                    lineHeight: '1.5',
                                    margin: 0,
                                    fontWeight: '400',
                                }}
                            >
                                Every message is registered onchain. Chat with other Rabbits to accumulate RabbitPoints! 🎁
                            </p>
                        </div>
                    </div>

                    {/* Earn Points Section */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            marginBottom: '18px',
                            paddingBottom: '18px',
                            borderBottom: `1px solid ${isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        }}
                    >
                        <div
                            style={{
                                background: isNight ? '#4f46e5' : '#6366f1',
                                color: 'white',
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                fontWeight: '600',
                                marginRight: '16px',
                                flexShrink: 0,
                            }}
                        >
                            💬
                        </div>
                        <div>
                            <p
                                style={{
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: isNight ? '#e5e7eb' : '#1f2937',
                                    margin: '0 0 4px 0',
                                }}
                            >
                                Earn RabbitPoints
                            </p>
                            <p
                                style={{
                                    fontSize: '13px',
                                    color: isNight ? '#9ca3af' : '#6b7280',
                                    lineHeight: '1.5',
                                    margin: 0,
                                    fontWeight: '400',
                                }}
                            >
                                Each message earns you RabbitPoints. Boost your score with a Confirmed Rabbit badge for a x2 multiplier on chat rewards! 📈
                            </p>
                        </div>
                    </div>

                    {/* Rules Section */}
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <div
                            style={{
                                background: isNight ? '#4f46e5' : '#6366f1',
                                color: 'white',
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                fontWeight: '600',
                                marginRight: '16px',
                                flexShrink: 0,
                            }}
                        >
                            ⚡
                        </div>
                        <div>
                            <p
                                style={{
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: isNight ? '#e5e7eb' : '#1f2937',
                                    margin: '0 0 8px 0',
                                }}
                            >
                                Follow the Rules
                            </p>
                            <ul
                                style={{
                                    margin: 0,
                                    paddingLeft: '18px',
                                    fontSize: '13px',
                                    color: isNight ? '#9ca3af' : '#6b7280',
                                    lineHeight: '1.6',
                                }}
                            >
                                <li>Moderators watch for rule violations - stay respectful! 🛡️</li>
                                <li>
                                    Earn your{' '}
                                    <span style={{ color: 'green', fontWeight: 600 }}>Confirmed Rabbit</span> status
                                    {' '}by being consistent and respectful
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ========== NEW FEATURE: Daily & Weekly Quests ========== */}
                <div
                    style={{
                        background: cardBg,
                        padding: '20px',
                        borderRadius: '12px',
                        border: `1px solid ${borderColor}`,
                        boxShadow: isNight
                            ? '0 0 12px rgba(250,250,250,0.06)'
                            : '0 3px 10px rgba(15,23,42,0.08)',
                    }}
                >
                    <h4
                        style={{
                            fontSize: '18px',
                            fontWeight: 600,
                            color: isNight ? '#e5e7eb' : '#111827',
                            margin: '0 0 12px 0',
                            textAlign: 'center',
                        }}
                    >
                        🏆 Daily & Weekly Quests
                    </h4>

                    {/* Intro */}
                    <p
                        style={{
                            fontSize: '13px',
                            color: isNight ? '#9ca3af' : '#4b5563',
                            lineHeight: 1.5,
                            textAlign: 'center',
                            margin: '0 0 14px 0',
                        }}
                    >
                        Complete Daily and Weekly quests to earn extra RabbitPoints on top of the
                        game and RabbitChat. The higher your streak, the better the rewards.
                    </p>

                    {/* Daily quests */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            marginBottom: '12px',
                        }}
                    >
                        <div
                            style={{
                                background: isNight ? '#4f46e5' : '#6366f1',
                                color: 'white',
                                width: '26px',
                                height: '26px',
                                borderRadius: '999px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '15px',
                                fontWeight: 600,
                                marginRight: '12px',
                                flexShrink: 0,
                            }}
                        >
                            📅
                        </div>
                        <div>
                            <p
                                style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: isNight ? '#e5e7eb' : '#111827',
                                    margin: '0 0 4px 0',
                                }}
                            >
                                Daily Quests
                            </p>
                            <p
                                style={{
                                    fontSize: '13px',
                                    color: isNight ? '#9ca3af' : '#4b5563',
                                    lineHeight: 1.5,
                                    margin: 0,
                                }}
                            >
                                Every day, you get objectives like sending a certain number of messages,
                                playing games, or claiming a streak bonus. Complete them before reset to
                                earn RabbitPoints and keep your streak alive.
                            </p>
                        </div>
                    </div>

                    {/* Weekly quests */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            marginBottom: '12px',
                        }}
                    >
                        <div
                            style={{
                                background: isNight ? '#f59e0b' : '#f97316',
                                color: 'white',
                                width: '26px',
                                height: '26px',
                                borderRadius: '999px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '15px',
                                fontWeight: 600,
                                marginRight: '12px',
                                flexShrink: 0,
                            }}
                        >
                            📆
                        </div>
                        <div>
                            <p
                                style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: isNight ? '#e5e7eb' : '#111827',
                                    margin: '0 0 4px 0',
                                }}
                            >
                                Weekly Quests
                            </p>
                            <p
                                style={{
                                    fontSize: '13px',
                                    color: isNight ? '#9ca3af' : '#4b5563',
                                    lineHeight: 1.5,
                                    margin: 0,
                                }}
                            >
                                Over the week, you can complete larger goals like total messages sent or
                                games played. These quests reward more RabbitPoints and are perfect for
                                consistent players.
                            </p>
                        </div>
                    </div>

                    {/* Streak & scaling rewards */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                        }}
                    >
                        <div
                            style={{
                                background: isNight ? '#16a34a' : '#22c55e',
                                color: 'white',
                                width: '26px',
                                height: '26px',
                                borderRadius: '999px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '15px',
                                fontWeight: 600,
                                marginRight: '12px',
                                flexShrink: 0,
                            }}
                        >
                            🔥
                        </div>
                        <div>
                            <p
                                style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: isNight ? '#e5e7eb' : '#111827',
                                    margin: '0 0 4px 0',
                                }}
                            >
                                Streak = Better Rewards
                            </p>
                            <p
                                style={{
                                    fontSize: '13px',
                                    color: isNight ? '#9ca3af' : '#4b5563',
                                    lineHeight: 1.5,
                                    margin: 0,
                                }}
                            >
                                Your streak increases the difficulty and the rewards of your main quests.
                                The more days in a row you are active, the more RabbitPoints you can earn
                                from Daily and Weekly quests.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ========== ORIGINAL FAQ SECTIONS ========== */}

                {/* Question 1: How to play the game? */}
                <div
                    style={{
                        background: cardBg,
                        padding: '15px',
                        borderRadius: '10px',
                        boxShadow: isNight
                            ? '0 0 8px rgba(255,255,255,0.05)'
                            : '0 2px 6px rgba(0,0,0,0.1)',
                        border: `1px solid ${borderColor}`,
                    }}
                >
                    <h5 className={`font-semibold mb-2 text-center ${textColor}`}>
                        How to play the game?
                    </h5>
                    <div className={`text-xs leading-relaxed text-center ${subTextColor} space-y-2`}>
                        <p>
                            Launch the game and click as fast as you can on Digit Rabbit's head to get the
                            highest score. Each click represents an onchain transaction on the MegaETH testnet,
                            and will earn you RabbitPoints.
                        </p>
                    </div>
                </div>

                {/* Question 2: What are RabbitPoints for? */}
                <div
                    style={{
                        background: cardBg,
                        padding: '15px',
                        borderRadius: '10px',
                        boxShadow: isNight
                            ? '0 0 8px rgba(255,255,255,0.05)'
                            : '0 2px 6px rgba(0,0,0,0.1)',
                        border: `1px solid ${borderColor}`,
                    }}
                >
                    <h5 className={`font-semibold mb-2 text-center ${textColor}`}>
                        What are RabbitPoints for?
                    </h5>
                    <p className={`text-xs leading-relaxed text-center ${subTextColor}`}>
                        RabbitsPoints are the in-game currency you earn by playing the game and chatting in RabbitChat. They are used to determine your position on the leaderboard and can be redeemed for rewards at the end of each season.
                    </p>

                    <p className={`text-xs leading-relaxed text-center ${subTextColor} mt-3`}>
                        Try to top the leaderboard to receive benefits.
                    </p>
                    <p className={`text-xs leading-relaxed text-center ${subTextColor} mt-1`}>
                        Be as active as possible to get the best streak.
                    </p>
                </div>

                {/* Question 3: What is an embedded wallet? */}
                <div
                    style={{
                        background: cardBg,
                        padding: '15px',
                        borderRadius: '10px',
                        boxShadow: isNight
                            ? '0 0 8px rgba(255,255,255,0.05)'
                            : '0 2px 6px rgba(0,0,0,0.1)',
                        border: `1px solid ${borderColor}`,
                    }}
                >
                    <h5 className={`font-semibold mb-2 text-center ${textColor}`}>
                        What is an embedded wallet and why do I need it to play the game?
                    </h5>
                    <p className={`text-xs leading-relaxed text-center ${subTextColor}`}>
                        An embedded wallet is a secure, self-custodial crypto wallet that is created for you
                        automatically within the game. You don't need to download a separate browser extension
                        or mobile app. This wallet is essential for the game as it stores your hard-earned
                        RabbitPoints and any in-game items you purchase, which are recorded on the blockchain.
                        This ensures you have true ownership of your assets.
                    </p>
                </div>

                {/* Question 4: How is my embedded wallet created? */}
                <div
                    style={{
                        background: cardBg,
                        padding: '15px',
                        borderRadius: '10px',
                        boxShadow: isNight
                            ? '0 0 8px rgba(255,255,255,0.05)'
                            : '0 2px 6px rgba(0,0,0,0.1)',
                        border: `1px solid ${borderColor}`,
                    }}
                >
                    <h5 className={`font-semibold mb-2 text-center ${textColor}`}>
                        How is my embedded wallet created?
                    </h5>
                    <p className={`text-xs leading-relaxed text-center ${subTextColor}`}>
                        Your embedded wallet is automatically and securely created for you the first time you
                        log in. This makes it easy to get started right away without any complex setup.
                    </p>
                </div>

                {/* Question 5: Is my embedded wallet secure? */}
                <div
                    style={{
                        background: cardBg,
                        padding: '15px',
                        borderRadius: '10px',
                        boxShadow: isNight
                            ? '0 0 8px rgba(255,255,255,0.05)'
                            : '0 2px 6px rgba(0,0,0,0.1)',
                        border: `1px solid ${borderColor}`,
                    }}
                >
                    <h5 className={`font-semibold mb-2 text-center ${textColor}`}>
                        Is my embedded wallet secure?
                    </h5>
                    <p className={`text-xs leading-relaxed text-center ${subTextColor}`}>
                        Yes. Your wallet is protected using advanced security measures. It is self-custodial,
                        meaning you have full control over it. Neither the game developers nor Privy can access
                        your private keys. For your peace of mind, you always have the option to export your
                        private key.
                    </p>
                </div>

                {/* Question 6: Can I export my private key? */}
                <div
                    style={{
                        background: cardBg,
                        padding: '15px',
                        borderRadius: '10px',
                        boxShadow: isNight
                            ? '0 0 8px rgba(255,255,255,0.05)'
                            : '0 2px 6px rgba(0,0,0,0.1)',
                        border: `1px solid ${borderColor}`,
                    }}
                >
                    <h5 className={`font-semibold mb-2 text-center ${textColor}`}>
                        Can I export my private key from the embedded wallet?
                    </h5>
                    <p className={`text-xs leading-relaxed text-center ${subTextColor}`}>
                        Yes, to do so go to Settings and click on the "Export private key" button.
                    </p>
                </div>

                {/* Question 7: Can I link my wallets? */}
                <div
                    style={{
                        background: cardBg,
                        padding: '15px',
                        borderRadius: '10px',
                        boxShadow: isNight
                            ? '0 0 8px rgba(255,255,255,0.05)'
                            : '0 2px 6px rgba(0,0,0,0.1)',
                        border: `1px solid ${borderColor}`,
                    }}
                >
                    <h5 className={`font-semibold mb-2 text-center ${textColor}`}>
                        Can I link my wallets containing partnerships NFTs?
                    </h5>
                    <p className={`text-xs leading-relaxed text-center ${subTextColor}`}>
                        Yes, head over the Settings section, you will see appear all of the wallets you've
                        previously linked. These one will be used to compute your final score once the season
                        is over.
                    </p>
                </div>
            </div>
        </Wrapper>
    )
}