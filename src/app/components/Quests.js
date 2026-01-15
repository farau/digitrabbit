import Wrapper from '@/app/components/Wrapper'
import { useTheme } from '@/context'
import Image from 'next/image';
import { XLogo } from '@/utils/constants'
import WalletButton from './WalletButton'
import { useState, useEffect } from 'react';
import { DIGIT_RABBITS_ADDRESS, DIGIT_RABBITS_ABI } from '@/utils/chainConfig';
import { useQuestsStatus, isQuestClaimed, canClaimQuest, formatRemainingTime } from '../hooks/useQuestsStatus';
import { useWalletClient } from '../hooks/useWalletClient';

function QuestCard({ quest, progress, streak, isNight, claimed, onClaim, isClaimingQuest, cooldowns, formatRemainingTime }) {
    const cardBg = isNight ? '#1a1a1a' : '#f8f8f8';
    const textColor = isNight ? '#eee' : '#333';
    const accentColor = quest.type === 'streak' ? '#f59e0b' : '#10b981';
    const progressPercent = Math.min((progress / quest.targetBase) * 100, 100);

    const getProgressValue = () => {
        if (quest.type === 'messages' || quest.type === 'games' || quest.type === 'NFTs') {
            return progress;
        }
    };

    const getTargetValue = () => {
        return quest.targetBase;
    }

    const getReward = () => {
        return quest.rewardBase;
    };

    const isCompleted = progressPercent >= 100;
    const canClaim = isCompleted && !claimed;
    const isClaiming = isClaimingQuest === quest.id;

    return (
        <div
            style={{
                background: cardBg,
                border: `1px solid ${isNight ? '#444' : '#ddd'}`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                boxShadow: isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Gradient Background */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}05 100%)`,
                    pointerEvents: 'none',
                }}
            />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '24px' }}>{quest.icon}</span>
                        <div>
                            <h4 style={{
                                margin: 0,
                                fontSize: '15px',
                                fontWeight: '600',
                                color: textColor
                            }}>
                                {quest.title}
                            </h4>
                            <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '12px',
                                color: isNight ? '#888' : '#666'
                            }}>
                                {quest.description}
                            </p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: accentColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end'
                        }}>
                            +{getReward()}
                            <Image src="/img/rabbitpoint.png" alt="Coin" width={24} height={24} style={{ display: 'inline-block', marginLeft: '4px' }} />
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: isNight ? '#888' : '#666'
                        }}>
                            Reward
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                {quest.type === 'messages' || quest.type === 'games' ? (
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '6px'
                        }}>
                            <span style={{
                                fontSize: '12px',
                                color: isNight ? '#888' : '#666'
                            }}>
                                Progress
                            </span>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: accentColor
                            }}>
                                {Math.floor(progressPercent)}%
                            </span>
                        </div>
                        <div style={{
                            width: '100%',
                            height: '6px',
                            background: isNight ? '#2a2a2a' : '#e0e0e0',
                            borderRadius: '3px',
                            overflow: 'hidden'
                        }}>
                            <div
                                style={{
                                    height: '100%',
                                    background: accentColor,
                                    width: `${progressPercent}%`,
                                    transition: 'width 0.3s ease'
                                }}
                            />
                        </div>
                    </div>
                ) : null}

                {/* Progress & Status */}
                {quest.type !== 'streak' ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                        color: isNight ? '#888' : '#666'
                    }}>
                        <span>Progress: {getProgressValue()}/{getTargetValue()}</span>

                        {canClaim ? (
                            <button
                                onClick={() => onClaim(quest)}
                                disabled={isClaiming}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    background: isClaiming ? (isNight ? '#555' : '#e0e0e0') : '#3b82f6',
                                    color: isClaiming ? (isNight ? '#888' : '#666') : 'white',
                                    fontWeight: '600',
                                    fontSize: '11px',
                                    border: 'none',
                                    cursor: isClaiming ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: isClaiming ? 0.6 : 1
                                }}
                            >
                                {isClaiming ? '⏳ Claiming...' : '🎁 Claim Reward'}
                            </button>
                        ) : (
                            <span style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                background: claimed
                                    ? (isNight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)')
                                    : (isNight ? '#444' : '#f0f0f0'),
                                color: claimed ? '#10b981' : textColor,
                                fontWeight: '500',
                                fontSize: '11px'
                            }}>
                                {claimed ? `✓ Claimed, remaining time for the next quest: ${quest.type === 'messages' ? formatRemainingTime(cooldowns?.daily_messages) || 0 : quest.type === 'streak' ? formatRemainingTime(cooldowns?.daily_streak) || 0 : formatRemainingTime(cooldowns?.daily_hold) || 0}s` : 'In Progress'}
                            </span>
                        )}
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        fontSize: '12px',
                        color: isNight ? '#888' : '#666'
                    }}>
                        {canClaim ? (
                            <button
                                onClick={() => onClaim(quest)}
                                disabled={isClaiming}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    background: isClaiming ? (isNight ? '#555' : '#e0e0e0') : '#f59e0b',
                                    color: isClaiming ? (isNight ? '#888' : '#666') : 'white',
                                    fontWeight: '600',
                                    fontSize: '11px',
                                    border: 'none',
                                    cursor: isClaiming ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: isClaiming ? 0.6 : 1
                                }}
                            >
                                {isClaiming ? '⏳ Claiming...' : '🎁 Claim Reward'}
                            </button>
                        ) : (
                            <span style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                background: claimed
                                    ? (isNight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)')
                                    : (isNight ? '#444' : '#f0f0f0'),
                                color: claimed ? '#10b981' : textColor,
                                fontWeight: '500',
                                fontSize: '11px'
                            }}>
                                {claimed ? `✓ Claimed, remaining time for the next quest: ${quest.type === 'messages' ? formatRemainingTime(cooldowns?.daily_messages) || 0 : quest.type === 'streak' ? formatRemainingTime(cooldowns?.daily_streak) || 0 : formatRemainingTime(cooldowns?.daily_hold) || 0}s` : 'In Progress'}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Quests({ playerData, embeddedWallet }) {
    const { theme } = useTheme();
    const isNight = theme === 'dark';
    const [claimingQuestId, setClaimingQuestId] = useState(null);
    const { walletClient } = useWalletClient(embeddedWallet)

    const textColor = isNight ? '#eee' : '#333';
    const cardBg = isNight ? '#222' : '#f3f3f3';
    const borderColor = isNight ? '#444' : '#ddd';
    const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';

    const { streak, dailyMessages, weeklyMessages, gamePlayed } = playerData;

    if (streak === 0 || !streak) {
        return (
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
                    <p style={{ color: textColor, margin: 0 }}>You have to play the game to be able to start quests.</p>
                </div>
            </Wrapper>
        );
    }

    // ✅ State pour synchroniser les données
    const [questProgress, setQuestProgress] = useState({
        daily_messages: dailyMessages || 0,
        daily_streak: streak || 0,
        daily_hold: 0,
        weekly_messages: 0,
        weekly_games: gamePlayed || 0,
    });

    // Quest Configuration
    const DAILY_QUESTS = [
        {
            id: 'daily_messages',
            title: 'Message Marathon',
            description: 'Send messages in chat',
            type: 'messages',
            icon: '💬',
            targetBase: 10 + (streak - 1) * 2,
            rewardBase: 10 + (streak - 1) * 2,
            progress: questProgress.daily_messages || 0,
            period: 'daily'
        },
        {
            id: 'daily_streak',
            title: 'Consistency Bonus',
            description: 'Come back daily to claim',
            type: 'streak',
            icon: '🔥',
            targetBase: 1,
            rewardBase: 10 + (streak - 1) * 2,
            progress: streak >= 1 ? 1 : 0,
            period: 'daily'
        },
        {
            id: 'daily_hold',
            title: 'NFT Enthusiast',
            description: `Hold ${streak} Digit Rabbit NFTs to earn extra rewards`,
            type: 'NFTs',
            icon: '🎨',
            targetBase: streak,
            rewardBase: 100 * streak,
            progress: questProgress.daily_hold || 0, // Will be fetched from API
            period: 'daily'
        }
    ];

    const WEEKLY_QUESTS = [
        {
            id: 'weekly_messages',
            title: 'Weekly Chatter',
            description: 'Send messages throughout the week',
            type: 'messages',
            icon: '📝',
            targetBase: 1000,
            rewardBase: 500,
            progress: questProgress.weekly_messages || 0,
            period: 'weekly'
        },
        {
            id: 'weekly_games',
            title: 'Game Master',
            description: 'Play games to earn rewards',
            type: 'games',
            icon: '🎮',
            targetBase: 14,
            rewardBase: 1000,
            progress: questProgress.weekly_games || 0,
            period: 'weekly'
        }
    ];

    // Get all quest IDs for daily quests
    const dailyQuestIds = DAILY_QUESTS.map(q => q.id);
    const weeklyQuestIds = WEEKLY_QUESTS.map(q => q.id);

    // Fetch quest status from smart contract for daily quests
    const {
        claimStatus: dailyClaimStatus,
        cooldowns: dailyCooldowns,
        isLoading: isDailyLoading,
        error: dailyError,
        refetch: refetchDaily,
        formatRemainingTime,
        holdings
    } = useQuestsStatus(embeddedWallet?.address, dailyQuestIds, 'daily');

    // Fetch quest status from smart contract for weekly quests
    const {
        claimStatus: weeklyClaimStatus,
        cooldowns: weeklyCooldowns,
        isLoading: isWeeklyLoading,
        error: weeklyError,
        refetch: refetchWeekly,
    } = useQuestsStatus(embeddedWallet?.address, weeklyQuestIds, 'weekly');

    // Combine claim statuses
    const allClaimStatus = { ...dailyClaimStatus, ...weeklyClaimStatus };

    // Handle quest claim
    const handleClaimQuest = async (quest) => {
        if (!embeddedWallet?.address) {
            alert('Please connect your wallet');
            return;
        }

        setClaimingQuestId(quest.id);

        try {
            // 1. Call backend API to validate and get signature
            // ⚠️ NE PAS envoyer rewardAmount - l'API le calculera
            const response = await fetch('/api/quests/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questId: quest.id,
                    playerAddress: embeddedWallet.address
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to validate quest');
            }

            const { questId, periodKey, periodType, rewardAmount, nonce, signature } = result.data;

            console.log('✅ Quest validated by backend:', {
                questId,
                periodKey,
                periodType,
                rewardAmount,
                nonce
            });


            // Call smart contract to claim
            const txHash = await walletClient.writeContract({
                address: DIGIT_RABBITS_ADDRESS,
                abi: DIGIT_RABBITS_ABI,
                functionName: 'claimQuest',
                args: [questId, periodKey, periodType, rewardAmount, nonce, signature],
                account: embeddedWallet.address
            });

            if (!txHash) {
                throw new Error('Transaction failed');
            }

            console.log('✅ Quest claimed successfully! TX:', txHash);

            // 4. Refetch quest status
            if (quest.period === 'daily') {
                await refetchDaily();
            } else {
                await refetchWeekly();
            }

        } catch (error) {
            console.error('Error claiming quest:', error);
            alert('Failed to claim quest: ' + error.message);
        } finally {
            setClaimingQuestId(null);
        }
    };

    // ✅ useEffect pour mettre à jour quand les données changent
    useEffect(() => {
        setQuestProgress({
            daily_messages: dailyMessages || 0,
            daily_streak: streak || 0,
            daily_hold: holdings, // ✅ Update quand holdings change
            weekly_messages: weeklyMessages?.reduce((sum, count) => sum + Number(count), 0) || 0,
            weekly_games: gamePlayed || 0,
        });
    }, [holdings]);


    if (!embeddedWallet) {
        return (
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
                    <p style={{ color: textColor, margin: 0, marginBottom: '12px' }}>
                        Please login your <XLogo size={16} className={isNight ? 'text-white' : 'text-black'} /> account to access your profile.
                    </p>
                    <WalletButton />
                </div>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            {/* Daily Quests */}
            <div style={{ marginTop: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '20px' }}>📅</span>
                    <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '600',
                        color: textColor
                    }}>
                        Daily Quests
                    </h3>
                    <span style={{
                        background: isNight ? '#4f46e5' : '#6366f1',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600'
                    }}>
                        Streak x{streak}
                    </span>
                </div>
                <div style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow
                }}>
                    {isDailyLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: textColor }}>
                            Loading daily quests...
                        </div>
                    ) : dailyError ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>
                            Error loading daily quests: {dailyError}
                        </div>
                    ) : (
                        DAILY_QUESTS.map(quest => (
                            <QuestCard
                                key={quest.id}
                                quest={quest}
                                progress={quest.progress}
                                streak={streak}
                                isNight={isNight}
                                claimed={isQuestClaimed(quest.id, dailyClaimStatus)}
                                onClaim={handleClaimQuest}
                                isClaimingQuest={claimingQuestId}
                                cooldowns={dailyCooldowns}
                                formatRemainingTime={formatRemainingTime}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Weekly Quests */}
            <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '20px' }}>🏆</span>
                    <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '600',
                        color: textColor
                    }}>
                        Weekly Quests
                    </h3>
                    <span style={{
                        background: isNight ? '#f59e0b' : '#f97316',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600'
                    }}>
                        Streak x{streak}
                    </span>
                </div>
                <div style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow
                }}>
                    {isWeeklyLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: textColor }}>
                            Loading weekly quests...
                        </div>
                    ) : weeklyError ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>
                            Error loading weekly quests: {weeklyError}
                        </div>
                    ) : (
                        WEEKLY_QUESTS.map(quest => (
                            <QuestCard
                                key={quest.id}
                                quest={quest}
                                progress={quest.progress}
                                streak={streak}
                                isNight={isNight}
                                claimed={isQuestClaimed(quest.id, weeklyClaimStatus)}
                                onClaim={handleClaimQuest}
                                isClaimingQuest={claimingQuestId}
                                cooldowns={weeklyCooldowns}
                                formatRemainingTime={formatRemainingTime}
                            />
                        ))
                    )}
                </div>
            </div>
        </Wrapper>
    );
}