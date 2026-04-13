'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Loader2, AlertCircle, Shield, UserCheck, UserMinus, Ban, VolumeX, Copy, Check, Reply, X, Gift, Trophy, Bot } from 'lucide-react'
import { useGame, useTheme } from '@/context'
import Wrapper from '@/app/components/Wrapper'
import { useWalletClient } from '../hooks/useWalletClient'
import { useChatMessages } from '../hooks/useChatMessages'
import WalletButton from './WalletButton'
import * as Sentry from '@sentry/nextjs'
import Image from 'next/image'
import { decodeEventLog } from 'viem'
import { customMegaethTestnet } from '@/utils/chainConfig'

import {
    DIGIT_RABBITS_CHAT_ABI,
    DIGIT_RABBITS_CHAT_ADDRESS,
    DIGIT_RABBITS_ADDRESS,
    DIGIT_RABBITS_ABI,
    ROLE_COLORS,
} from '@/utils/chainConfig'

import { XLogo } from '@/utils/constants'

// Composant MessageBubble avec thème amélioré
function MessageBubble({ message, messages, isNight, playerData, onReply }) {
    const [copiedAddress, setCopiedAddress] = useState(false)
    const resolveRoleIndex = (chatMessage) => {
        if (!chatMessage) return 0

        const username = typeof chatMessage?.twitterUsername === 'string'
            ? chatMessage.twitterUsername.trim().toLowerCase()
            : ''
        if (username === 'rabbitbot') return 3

        const numericRole = Number(chatMessage?.senderRole)
        return Number.isInteger(numericRole) && numericRole >= 0 ? numericRole : 0
    }

    const currentMessageRoleIndex = resolveRoleIndex(message)
    const hasOnChainMessageId = (
        (typeof message?.messageId === 'number' && Number.isInteger(message.messageId) && message.messageId > 0)
        || (typeof message?.messageId === 'string' && /^\d+$/.test(message.messageId))
    )
    const isSystemMessage = typeof message?.messageId === 'string' && message.messageId.startsWith('system-')
    const isRabbitBotMessage = currentMessageRoleIndex === 3
    const isBotAwardSystemMessage = isSystemMessage && message?.systemType === 'bot-award'
    const shouldHideAvatar = Boolean(message?.hideAvatar || isBotAwardSystemMessage)

    const cardBg = isNight ? '#1a1a1a' : '#f3f3f3'
    const borderColor = isNight ? '#333' : '#ddd'
    const textColor = isNight ? '#eee' : '#333'
    const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'
    const botAwardBg = isNight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(251, 191, 36, 0.14)'
    const botAwardBorderColor = isNight ? '#d97706' : '#f59e0b'
    const botAwardTextColor = isNight ? '#fcd34d' : '#b45309'

    const txUrl = typeof message?.txUrl === 'string' && message.txUrl
        ? message.txUrl
        : (typeof message?.transactionHash === 'string' && message.transactionHash
            ? `https://megaeth-testnet-v2.blockscout.com/tx/${message.transactionHash}`
            : '')
    const shortTxHash = typeof message?.transactionHash === 'string' && message.transactionHash.length > 12
        ? `${message.transactionHash.slice(0, 6)}...${message.transactionHash.slice(-4)}`
        : ''

    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(message.sender)
            setCopiedAddress(true)
            setTimeout(() => setCopiedAddress(false), 2000)
        } catch (err) {
            console.error('Failed to copy address:', err)
        }
    }

    const repliedMessage = message.replyToMessageId && message.replyToMessageId > 0
        ? messages.find(m => m.messageId === message.replyToMessageId)
        : null
    const repliedMessageRoleIndex = resolveRoleIndex(repliedMessage)

    const getRoleColor = (roleIndex) => {
        if (roleIndex === 3) return isNight ? '#34d399' : '#059669'
        if (roleIndex === 2) return isNight ? '#ef4444' : '#dc2626'
        if (roleIndex === 1) return isNight ? '#3b82f6' : '#2563eb'
        return isNight ? '#6b7280' : '#9ca3af'
    }

    return (
        <div>
            {/* Message répondu */}
            {repliedMessage && (
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginBottom: '1px',
                    paddingLeft: '12px',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        left: '30px',
                        top: '30px',
                        width: '24px',
                        height: '14px',
                        borderLeft: `2px solid ${getRoleColor(repliedMessageRoleIndex)}`,
                        borderTop: `2px solid ${getRoleColor(repliedMessageRoleIndex)}`,
                        borderTopLeftRadius: '12px'
                    }} />

                    <div style={{
                        flexShrink: 0,
                        marginLeft: '40px',
                        marginTop: '21px',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <Image
                            src={repliedMessage?.twitterProfilePictureUrl || '/img/default-avatar.jpg'}
                            alt="Avatar"
                            width={20}
                            height={20}
                            style={{
                                borderRadius: '50%',
                                border: `2px solid ${getRoleColor(repliedMessageRoleIndex)}`,
                                opacity: 0.8
                            }}
                        />
                    </div>
                    <div style={{
                        flex: 1,
                        background: isNight ? 'rgba(79, 70, 229, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        borderLeft: `3px solid ${getRoleColor(repliedMessageRoleIndex)}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: 0
                    }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = isNight ? 'rgba(79, 70, 229, 0.15)' : 'rgba(99, 102, 241, 0.15)'
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = isNight ? 'rgba(79, 70, 229, 0.08)' : 'rgba(99, 102, 241, 0.08)'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '2px'
                        }}>
                            <Reply size={11} style={{
                                color: getRoleColor(repliedMessageRoleIndex),
                                flexShrink: 0
                            }} />
                            <span style={{
                                color: getRoleColor(repliedMessageRoleIndex),
                                fontWeight: '700',
                                fontSize: '11px'
                            }}>
                                {repliedMessage.twitterUsername || 'Anonymous'}
                            </span>
                        </div>
                        <div style={{
                            color: isNight ? '#d1d5db' : '#4b5563',
                            fontSize: '12px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: '1.4',
                            opacity: 0.9
                        }}>
                            {repliedMessage.content}
                        </div>
                    </div>
                </div>
            )}

            {/* Message principal */}
            <div
                style={{
                    background: isBotAwardSystemMessage ? botAwardBg : cardBg,
                    padding: isBotAwardSystemMessage ? '9px 10px' : '12px',
                    borderRadius: '10px',
                    marginBottom: isBotAwardSystemMessage ? '8px' : '12px',
                    border: `1px solid ${isBotAwardSystemMessage ? botAwardBorderColor : borderColor}`,
                    boxShadow: isBotAwardSystemMessage ? 'none' : boxShadow,
                    transition: 'all 0.2s ease',
                    position: 'relative'
                }}
                onMouseOver={(e) => {
                    if (isBotAwardSystemMessage) return
                    e.currentTarget.style.background = isNight ? '#2a2a2a' : '#f8f8f8'
                    e.currentTarget.style.boxShadow = isNight ? '0 0 12px rgba(255,255,255,0.08)' : '0 4px 8px rgba(0,0,0,0.12)'
                }}
                onMouseOut={(e) => {
                    if (isBotAwardSystemMessage) return
                    e.currentTarget.style.background = cardBg
                    e.currentTarget.style.boxShadow = boxShadow
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: shouldHideAvatar ? '0px' : '12px' }}>
                    {!shouldHideAvatar && (
                        <div style={{ flexShrink: 0 }}>
                            <Image
                                src={message?.twitterProfilePictureUrl || '/img/default-avatar.jpg'}
                                alt="Avatar"
                                width={48}
                                height={48}
                                style={{ borderRadius: '50%' }}
                            />
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            {isBotAwardSystemMessage ? (
                                <span style={{ fontWeight: '700', fontSize: '12px', color: botAwardTextColor }}>
                                    RabbitBot Reward
                                </span>
                            ) : (
                                <span className={`font-bold ${ROLE_COLORS[currentMessageRoleIndex] || ROLE_COLORS[0]}`}>
                                    {message?.twitterUsername || 'Anonymous'}
                                </span>
                            )}
                            {!isSystemMessage && !isRabbitBotMessage && (
                                <button
                                    onClick={handleCopyAddress}
                                    style={{
                                        fontSize: '11px',
                                        color: isNight ? '#888' : '#666',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = isNight ? '#333' : '#e5e5e5'
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'transparent'
                                    }}
                                    title="Click to copy address"
                                >
                                    {message.sender.slice(0, 6)}...{message.sender.slice(-4)}
                                    {copiedAddress ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                </button>
                            )}
                            <span style={{ fontSize: '11px', color: isNight ? '#666' : '#999' }}>
                                {new Date(message.timestamp * 1000).toLocaleTimeString()}
                            </span>
                            {!isSystemMessage && !isRabbitBotMessage && Number(message?.score || 0) > 0 && (
                                <>
                                    <Image src="/img/rabbitpoint.png" alt="RB" width={20} height={20} />
                                    <span style={{ fontSize: '11px', color: '#fbbf24', marginLeft: '-4px' }}>
                                        <b>{message.score}</b>
                                    </span>
                                </>
                            )}
                        </div>
                        <div style={{
                            color: isBotAwardSystemMessage ? botAwardTextColor : textColor,
                            wordBreak: 'break-word',
                            fontSize: isBotAwardSystemMessage ? '12px' : '14px',
                            lineHeight: '1.5'
                        }}>
                            {isBotAwardSystemMessage ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span>
                                        +{Number(message?.rewardPoints || 0)} RabbitPoints awarded
                                    </span>
                                    {txUrl && shortTxHash && (
                                        <a
                                            href={txUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: botAwardTextColor,
                                                textDecoration: 'underline',
                                                fontWeight: '700'
                                            }}
                                        >
                                            tx {shortTxHash}
                                        </a>
                                    )}
                                </div>
                            ) : (
                                message.content
                            )}
                        </div>
                    </div>
                    {!isSystemMessage && !isRabbitBotMessage && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                            <button
                                onClick={() => hasOnChainMessageId && onReply(message)}
                                disabled={!hasOnChainMessageId || playerData?.gamePlayed === 0}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: hasOnChainMessageId ? 'pointer' : 'not-allowed',
                                    padding: '3px',
                                    borderRadius: '3px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: isNight ? '#888' : '#666',
                                    opacity: hasOnChainMessageId ? 1 : 0.45
                                }}
                                onMouseOver={(e) => {
                                    if (!hasOnChainMessageId) return
                                    e.currentTarget.style.background = isNight ? '#333' : '#e5e5e5'
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'transparent'
                                }}
                                title={hasOnChainMessageId ? 'Reply to this message' : 'System message cannot be replied to on-chain'}
                            >
                                <Reply size={13} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Modales de confirmation avec thème amélioré
function ModerationModal({ isOpen, onClose, onConfirm, isNight, type, targetAddress }) {
    const [loading, setLoading] = useState(false)
    const [duration, setDuration] = useState('3600')
    const [customDuration, setCustomDuration] = useState('')

    if (!isOpen) return null

    const textColor = isNight ? '#eee' : '#333'
    const cardBg = isNight ? '#222' : '#fff'
    const borderColor = isNight ? '#444' : '#ddd'
    const boxShadow = isNight ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.3)'

    const config = {
        mute: {
            title: 'Mute User',
            icon: <Ban size={24} className="text-red-500" />,
            buttonColor: '#ef4444',
            buttonText: 'Confirm Mute'
        },
        unmute: {
            title: 'Unmute User',
            icon: <VolumeX size={24} className="text-green-500" />,
            buttonColor: '#10b981',
            buttonText: 'Confirm Unmute'
        },
        promote: {
            title: 'Promote to Confirmed Rabbit',
            icon: <UserCheck size={24} className="text-blue-500" />,
            buttonColor: '#3b82f6',
            buttonText: 'Confirm Promotion'
        },
        demote: {
            title: 'Remove Confirmed Role',
            icon: <UserMinus size={24} className="text-orange-500" />,
            buttonColor: '#f97316',
            buttonText: 'Confirm Demotion'
        }
    }

    const modalConfig = config[type]
    const durationOptions = [
        { value: '3600', label: '1 hour' },
        { value: '21600', label: '6 hours' },
        { value: '86400', label: '24 hours' },
        { value: '604800', label: '7 days' },
        { value: '0', label: 'Permanent' },
        { value: 'custom', label: 'Custom duration' },
    ]

    const selectedDurationLabel = durationOptions.find((option) => option.value === duration)?.label || ''

    const handleConfirm = async () => {
        try {
            setLoading(true)
            if (type === 'mute') {
                const finalDuration = duration === 'custom' ? customDuration : duration
                await onConfirm(finalDuration)
            } else {
                await onConfirm()
            }
            onClose()
        } catch (err) {
            console.error('Moderation action failed:', err)
            Sentry.captureException(err, {
                tags: { moderationAction: type },
                extra: { targetAddress }
            })
        } finally {
            setLoading(false)
        }

    }

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                backdropFilter: 'blur(8px)'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: cardBg,
                    padding: '28px',
                    borderRadius: '12px',
                    border: `1px solid ${borderColor}`,
                    maxWidth: '450px',
                    width: '90%',
                    boxShadow
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    {modalConfig.icon}
                    <h3 style={{ color: textColor, fontSize: '20px', fontWeight: '600', margin: 0 }}>
                        {modalConfig.title}
                    </h3>
                </div>

                <p style={{ color: isNight ? '#aaa' : '#666', fontSize: '14px', marginBottom: '20px' }}>
                    Target user: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                        {targetAddress?.slice(0, 10)}...{targetAddress?.slice(-8)}
                    </span>
                </p>

                {type === 'mute' && (
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: textColor, fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                            Mute Duration:
                        </label>
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                border: `1px solid ${borderColor}`,
                                borderRadius: '8px',
                                backgroundColor: isNight ? '#141414' : '#ffffff',
                                minHeight: '40px'
                            }}
                        >
                            <select
                                value={durationOptions.some((option) => option.value === duration) ? duration : '3600'}
                                onChange={(e) => setDuration(e.target.value)}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer'
                                }}
                            >
                                {durationOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <div
                                style={{
                                    pointerEvents: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    color: textColor,
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}
                            >
                                <span>{selectedDurationLabel || '1 hour'}</span>
                                <span style={{ fontSize: '12px', opacity: 0.8 }}>▼</span>
                            </div>
                        </div>

                        <div
                            style={{
                                marginTop: '8px',
                                fontSize: '12px',
                                color: isNight ? '#d1d5db' : '#374151',
                                fontWeight: '600'
                            }}
                        >
                            Selected: {duration === 'custom' ? (customDuration ? `${customDuration}s` : 'Custom duration') : selectedDurationLabel}
                        </div>

                        {duration === 'custom' && (
                            <input
                                type="number"
                                placeholder="Duration in seconds"
                                value={customDuration}
                                onChange={(e) => setCustomDuration(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: isNight ? '#1a1a1a' : '#f5f5f5',
                                    color: textColor,
                                    border: `1px solid ${borderColor}`,
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    marginTop: '10px'
                                }}
                            />
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            background: 'transparent',
                            color: textColor,
                            border: `1px solid ${borderColor}`,
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            opacity: loading ? 0.5 : 1,
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => !loading && (e.currentTarget.style.background = isNight ? '#333' : '#f5f5f5')}
                        onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading || (type === 'mute' && duration === 'custom' && !customDuration)}
                        style={{
                            background: modalConfig.buttonColor,
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: (loading || (type === 'mute' && duration === 'custom' && !customDuration)) ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: (loading || (type === 'mute' && duration === 'custom' && !customDuration)) ? 0.5 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {modalConfig.buttonText}
                    </button>
                </div>
            </div>
        </div>
    )
}

// Notification (succès/erreur)
function SuccessNotification({ message, isVisible, onClose, isNight, type = 'success', durationMs = 4000 }) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose()
            }, durationMs)
            return () => clearTimeout(timer)
        }
    }, [isVisible, onClose, durationMs])

    if (!isVisible) return null

    const isError = type === 'error'

    return (
        <div style={{
            background: isError
                ? (isNight
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(239, 68, 68, 0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.06) 100%)')
                : (isNight
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'),
            color: isError
                ? (isNight ? '#fca5a5' : '#b91c1c')
                : (isNight ? '#6ee7b7' : '#059669'),
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: `1px solid ${isError ? (isNight ? '#ef4444' : '#fca5a5') : (isNight ? '#10b981' : '#6ee7b7')}`,
            fontWeight: '500'
        }}>
            {isError ? <AlertCircle size={18} /> : <Check size={18} />}
            <span>{message}</span>
        </div>
    )
}

// Composant principal
export default function RabbitChat({ playerData, messages, isConnected, resyncMessages }) {
    const { user } = usePrivy()
    const { embeddedWallet, isValidating, validationError } = useGame()
    const { registerCallbacks } = useChatMessages()
    const { themeMode } = useTheme()
    const { walletClient } = useWalletClient(embeddedWallet)

    const [inputMessage, setInputMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [userData, setUserData] = useState(null)
    const [cooldownRemaining, setCooldownRemaining] = useState(0)
    const [replyingTo, setReplyingTo] = useState(null)
    const [moderationModal, setModerationModal] = useState({ isOpen: false, type: null, targetAddress: null })
    const [notification, setNotification] = useState({ isVisible: false, message: '', type: 'success', durationMs: 4000 })
    const [targetAddress, setTargetAddress] = useState('')
    const [muteRemaining, setMuteRemaining] = useState(0)
    const [sendToRabbitBot, setSendToRabbitBot] = useState(false)
    const [isRabbitBotThinking, setIsRabbitBotThinking] = useState(false)
    const [rabbitBotThinkingDotCount, setRabbitBotThinkingDotCount] = useState(1)
    const [isMobileLayout, setIsMobileLayout] = useState(false)

    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)
    const loadUserDataPromiseRef = useRef(null)
    const delayedUserDataRefreshRef = useRef(null)

    const isModerator = userData?.roleIndex === 2
    const normalizedModeratorAddress = embeddedWallet?.address?.toLowerCase?.() || ''
    const trimmedTargetAddress = targetAddress?.trim?.() || ''
    const isValidEvmAddress = /^0x[a-fA-F0-9]{40}$/.test(trimmedTargetAddress)
    const normalizedTargetAddress = trimmedTargetAddress.toLowerCase()
    const isSelfTarget = Boolean(normalizedModeratorAddress && normalizedTargetAddress && normalizedModeratorAddress === normalizedTargetAddress)
    const hasTargetInput = trimmedTargetAddress.length > 0
    const canModerateTarget = Boolean(isValidEvmAddress && !isSelfTarget)

    const isNight = themeMode === 'dark'
    const textColor = isNight ? '#eee' : '#333'
    const cardBg = isNight ? '#1a1a1a' : '#f3f3f3'
    const borderColor = isNight ? '#333' : '#ddd'
    const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (typeof window === 'undefined') return

        const updateViewportState = () => {
            const isMobile = window.innerWidth < 768
            setIsMobileLayout(isMobile)
        }

        updateViewportState()

        window.addEventListener('resize', updateViewportState, { passive: true })
        window.addEventListener('orientationchange', updateViewportState)
        window.visualViewport?.addEventListener('resize', updateViewportState)
        window.visualViewport?.addEventListener('scroll', updateViewportState)

        return () => {
            window.removeEventListener('resize', updateViewportState)
            window.removeEventListener('orientationchange', updateViewportState)
            window.visualViewport?.removeEventListener('resize', updateViewportState)
            window.visualViewport?.removeEventListener('scroll', updateViewportState)
        }
    }, [])


    useEffect(() => {
        if (cooldownRemaining == 0) {
            setCooldownRemaining(0)
            return
        }

        const updateCooldown = () => {
            setCooldownRemaining(prev => {
                if (prev <= 1) {
                    return 0
                }
                return prev - 1
            })
        }

        const interval = setInterval(updateCooldown, 1000)
        return () => clearInterval(interval)
    }, [cooldownRemaining])

    useEffect(() => {
        if (!userData?.isMuted || !userData?.muteExpiresAt) {
            setMuteRemaining(0)
            return
        }

        const updateMuteTimer = () => {
            const now = Math.floor(Date.now() / 1000)
            const remaining = Math.max(Number(userData.muteExpiresAt) - now, 0)
            setMuteRemaining(remaining)
        }

        updateMuteTimer()
        const interval = setInterval(updateMuteTimer, 1000)
        return () => clearInterval(interval)
    }, [userData?.isMuted, userData?.muteExpiresAt])

    useEffect(() => {
        if (!isRabbitBotThinking) {
            setRabbitBotThinkingDotCount(1)
            return
        }

        const interval = setInterval(() => {
            setRabbitBotThinkingDotCount((previous) => (previous % 3) + 1)
        }, 450)

        return () => clearInterval(interval)
    }, [isRabbitBotThinking])

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return [hrs, mins, secs].map((value) => String(value).padStart(2, '0')).join(':')
    }

    const loadUserData = useCallback(async () => {
        if (!embeddedWallet?.address) return
        if (loadUserDataPromiseRef.current) return loadUserDataPromiseRef.current

        const requestPromise = (async () => {
            try {
                const response = await fetch(`/api/chat/stats?address=${embeddedWallet.address}`)
                if (response.ok) {
                    const data = await response.json()
                    setUserData(data)
                    return data
                }
            } catch (error) {
                console.error('Error loading user data:', error)
            }

            return null
        })()

        loadUserDataPromiseRef.current = requestPromise

        try {
            return await requestPromise
        } finally {
            loadUserDataPromiseRef.current = null
        }
    }, [embeddedWallet?.address])

    useEffect(() => {
        if (embeddedWallet?.address) {
            void loadUserData()
        }
    }, [embeddedWallet?.address, loadUserData])

    useEffect(() => {
        if (!embeddedWallet?.address) return

        // Keep footer stats (role, mute state, messages, points) fresh even without sending a message.
        const interval = setInterval(() => {
            void loadUserData()
        }, 120000)

        return () => {
            clearInterval(interval)
        }
    }, [embeddedWallet?.address, loadUserData])

    useEffect(() => {
        if (!embeddedWallet?.address) return

        const isCurrentAddressInLogs = (logs) => {
            const currentAddress = embeddedWallet.address.toLowerCase()
            return logs?.some((log) => {
                const sender = log?.args?.sender?.toLowerCase?.()
                const userAddress = log?.args?.user?.toLowerCase?.()
                const playerAddress = log?.args?.player?.toLowerCase?.()
                return sender === currentAddress || userAddress === currentAddress || playerAddress === currentAddress
            })
        }

        registerCallbacks({
            onChatStatsRefresh: ({ reason, logs } = {}) => {
                if (reason === 'visibility-visible' || reason === 'window-focus') {
                    void loadUserData()
                    return
                }

                if (isCurrentAddressInLogs(logs)) {
                    void loadUserData()
                }
            }
        })

        return () => {
            registerCallbacks({ onChatStatsRefresh: null })
        }
    }, [embeddedWallet?.address, loadUserData, registerCallbacks])

    useEffect(() => {
        return () => {
            if (delayedUserDataRefreshRef.current) {
                clearTimeout(delayedUserDataRefreshRef.current)
                delayedUserDataRefreshRef.current = null
            }
        }
    }, [])

    const refreshUserDataInBackground = (delayMs = 1300) => {
        if (delayedUserDataRefreshRef.current) {
            clearTimeout(delayedUserDataRefreshRef.current)
        }

        delayedUserDataRefreshRef.current = setTimeout(() => {
            delayedUserDataRefreshRef.current = null
            void loadUserData()
        }, delayMs)
    }

    const showNotification = (message, options = {}) => {
        const { type = 'success', durationMs = 4000 } = options
        setNotification({ isVisible: true, message, type, durationMs })
    }

    const showErrorNotification = (message) => {
        showNotification(message, { type: 'error', durationMs: 10000 })
    }

    const extractOwnMessageIdFromReceipt = (receipt) => {
        const logs = Array.isArray(receipt?.logs) ? receipt.logs : []
        const currentUserAddress = embeddedWallet?.address?.toLowerCase()
        const chatAddress = DIGIT_RABBITS_CHAT_ADDRESS?.toLowerCase()
        if (!currentUserAddress) return 0n

        for (const log of logs) {
            if (chatAddress && log?.address?.toLowerCase() !== chatAddress) {
                continue
            }

            try {
                const decoded = decodeEventLog({
                    abi: DIGIT_RABBITS_CHAT_ABI,
                    data: log.data,
                    topics: log.topics,
                })

                if (decoded.eventName !== 'MessageSent') continue

                const sender = typeof decoded.args?.sender === 'string'
                    ? decoded.args.sender.toLowerCase()
                    : ''
                if (sender !== currentUserAddress) continue

                const messageId = decoded.args?.messageId
                if (typeof messageId === 'bigint' && messageId > 0n) {
                    return messageId
                }
            } catch {
                // Ignore unrelated logs
            }
        }

        return 0n
    }

    const requestRabbitBotReply = async (content, replyToMessageId = 0n) => {
        if (!embeddedWallet?.address) return

        let normalizedReplyToMessageId = '0'
        if (typeof replyToMessageId === 'bigint' && replyToMessageId > 0n) {
            normalizedReplyToMessageId = replyToMessageId.toString()
        } else if (typeof replyToMessageId === 'number' && Number.isInteger(replyToMessageId) && replyToMessageId > 0) {
            normalizedReplyToMessageId = String(replyToMessageId)
        } else if (typeof replyToMessageId === 'string' && /^\d+$/.test(replyToMessageId) && replyToMessageId !== '0') {
            normalizedReplyToMessageId = replyToMessageId
        }

        setIsRabbitBotThinking(true)

        try {
            const response = await fetch('/api/chat/bot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    userAddress: embeddedWallet.address,
                    replyToMessageId: normalizedReplyToMessageId,
                })
            })

            const data = await response.json().catch(() => null)
            if (!response.ok) {
                if (response.status === 429) {
                    showErrorNotification(data?.error || 'RabbitBot daily limit reached for your IP')
                    return
                }

                showErrorNotification(data?.error || 'RabbitBot failed to respond')
                return
            }

            const awardedPoints = Number(data?.awardedPoints || 0)
            if (awardedPoints > 0) {
                refreshUserDataInBackground(800)
            }
        } catch (error) {
            console.error('RabbitBot request failed:', error)
            showErrorNotification('RabbitBot is unavailable right now')
        } finally {
            setIsRabbitBotThinking(false)
        }
    }

    const extractReadableError = (err) => {
        const candidates = [
            err?.revertReason,
            err?.shortMessage,
            err?.details,
            err?.message
        ]
        const first = candidates.find((value) => typeof value === 'string' && value.trim().length > 0)
        return first || 'Transaction failed'
    }

    const validateModerationTarget = (actionLabel) => {
        if (!walletClient || !moderationModal.targetAddress) return false
        if (!/^0x[a-fA-F0-9]{40}$/.test(moderationModal.targetAddress)) {
            const msg = 'Please enter a valid EVM address (0x + 40 hex characters).'
            showErrorNotification(msg)
            return false
        }
        if (embeddedWallet?.address?.toLowerCase() === moderationModal.targetAddress?.toLowerCase()) {
            const msg = `You cannot ${actionLabel} yourself.`
            showErrorNotification(msg)
            return false
        }
        return true
    }

    const ensureTransactionSucceeded = async (txHash) => {
        const receipt = await walletClient.waitForTransactionReceipt({ hash: txHash })
        if (receipt.status !== 'reverted') return receipt

        const tx = await walletClient.getTransaction({ hash: txHash })
        try {
            await walletClient.call({
                to: tx.to,
                data: tx.input,
                from: tx.from,
            })
        } catch (callError) {
            const revertReason = extractReadableError(callError)
            throw new Error(revertReason)
        }

        throw new Error('Transaction reverted')
    }

    const handleMuteUser = async (duration) => {
        if (!validateModerationTarget('mute')) return false

        try {
            const txHash = await walletClient.writeContract({
                account: embeddedWallet.address,
                to: DIGIT_RABBITS_CHAT_ADDRESS,
                abi: DIGIT_RABBITS_CHAT_ABI,
                functionName: 'muteUser',
                args: [moderationModal.targetAddress, BigInt(duration)],
                maxFeePerGas: 30000000n,
                maxPriorityFeePerGas: 3000000n,
                type: 'eip1559',
                gas: 300000n,
            })
            await ensureTransactionSucceeded(txHash)
            console.log('✅ User muted:', txHash)
            setTargetAddress('')
            return true
        } catch (err) {
            console.error('Error:', err)
            const errorMessage = extractReadableError(err)
            showErrorNotification(errorMessage)
            return false
        }
    }

    const handleUnmuteUser = async () => {
        if (!validateModerationTarget('unmute')) return false

        try {
            const txHash = await walletClient.writeContract({
                account: embeddedWallet.address,
                to: DIGIT_RABBITS_CHAT_ADDRESS,
                abi: DIGIT_RABBITS_CHAT_ABI,
                functionName: 'unmuteUser',
                args: [moderationModal.targetAddress],
                maxFeePerGas: 30000000n,
                maxPriorityFeePerGas: 3000000n,
                type: 'eip1559',
                gas: 300000n,
            })
            await ensureTransactionSucceeded(txHash)
            console.log('✅ User unmuted:', txHash)
            showNotification(`User ${moderationModal.targetAddress.slice(0, 6)}...${moderationModal.targetAddress.slice(-4)} unmuted`)
            setTargetAddress('')
            return true
        } catch (err) {
            console.error('Error:', err)
            const errorMessage = extractReadableError(err)
            showErrorNotification(errorMessage)
            return false
        }
    }

    const handlePromoteUser = async () => {
        if (!validateModerationTarget('promote')) return false

        try {
            const txHash = await walletClient.writeContract({
                account: embeddedWallet.address,
                to: DIGIT_RABBITS_CHAT_ADDRESS,
                abi: DIGIT_RABBITS_CHAT_ABI,
                functionName: 'promoteToConfirmedRabbit',
                args: [moderationModal.targetAddress],
                maxFeePerGas: 30000000n,
                maxPriorityFeePerGas: 3000000n,
                type: 'eip1559',
                gas: 300000n,
            })
            await ensureTransactionSucceeded(txHash)
            console.log('✅ User promoted:', txHash)
            showNotification(`User ${moderationModal.targetAddress.slice(0, 6)}...${moderationModal.targetAddress.slice(-4)} promoted`)
            setTargetAddress('')
            return true
        } catch (err) {
            console.error('Error:', err)
            const errorMessage = extractReadableError(err)
            showErrorNotification(errorMessage)
            return false
        }
    }

    const handleDemoteUser = async () => {
        if (!validateModerationTarget('demote')) return false

        try {
            const txHash = await walletClient.writeContract({
                account: embeddedWallet.address,
                to: DIGIT_RABBITS_CHAT_ADDRESS,
                abi: DIGIT_RABBITS_CHAT_ABI,
                functionName: 'demoteToRabbitMob',
                args: [moderationModal.targetAddress],
                maxFeePerGas: 30000000n,
                maxPriorityFeePerGas: 3000000n,
                type: 'eip1559',
                gas: 300000n,
            })
            await ensureTransactionSucceeded(txHash)
            console.log('✅ User demoted:', txHash)
            showNotification(`User ${moderationModal.targetAddress.slice(0, 6)}...${moderationModal.targetAddress.slice(-4)} demoted`)
            setTargetAddress('')
            return true
        } catch (err) {
            console.error('Error:', err)
            const errorMessage = extractReadableError(err)
            showErrorNotification(errorMessage)
            return false
        }
    }

    const openModerationModal = (type) => {
        if (!isValidEvmAddress) {
            showErrorNotification('Please enter a valid EVM address (0x + 40 hex characters).')
            return
        }
        if (isSelfTarget) {
            showErrorNotification('You cannot perform moderation actions on your own address.')
            return
        }
        setModerationModal({ isOpen: true, type, targetAddress: trimmedTargetAddress })
    }

    const handleSendMessage = async () => {
        if (!user || !embeddedWallet?.address || !inputMessage.trim() || !walletClient) return

        try {
            setSending(true)
            const contentToSend = inputMessage.trim()
            const shouldTriggerRabbitBot = sendToRabbitBot

            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: contentToSend,
                    userAddress: embeddedWallet.address,
                    sendToRabbitBot: shouldTriggerRabbitBot,
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Failed to send message')

            const { score, nonce, signature, twitterUsername, twitterProfilePictureUrl } = data
            const replyToMessageId = (() => {
                const id = replyingTo?.messageId
                if (typeof id === 'bigint' && id > 0n) return id
                if (typeof id === 'number' && Number.isInteger(id) && id > 0) return BigInt(id)
                if (typeof id === 'string' && /^\d+$/.test(id)) return BigInt(id)
                return 0n
            })()

            const txHash = await walletClient.writeContract({
                account: embeddedWallet.address,
                address: DIGIT_RABBITS_ADDRESS,
                abi: DIGIT_RABBITS_ABI,
                functionName: 'sendChatMessage',
                args: [contentToSend, score, nonce, twitterUsername, twitterProfilePictureUrl, signature, replyToMessageId],
                chain: customMegaethTestnet,
                gas: 30000000n
            })

            // Régler le problème de transaction révertée pour fournir un meilleur feedback à l'utilisateur
            const receipt = await walletClient.waitForTransactionReceipt({ hash: txHash });

            if (receipt.status === 'reverted') {
                const tx = await walletClient.getTransaction({ hash: txHash });
                console.log({ tx });

                try {
                    await walletClient.call({
                        to: tx.to,
                        data: tx.input,
                        from: tx.from,
                    });
                } catch (error) {
                    const revertReason =
                        error?.details || error?.message || 'Transaction reverted';

                    throw new Error(`Transaction reverted: ${revertReason}`);
                }
            }

            console.log('✅ Message sent:', txHash)

            const sentMessageId = extractOwnMessageIdFromReceipt(receipt)

            setInputMessage('')
            setReplyingTo(null)
            setCooldownRemaining(10)
            setUserData((previous) => {
                if (!previous) return previous

                return {
                    ...previous,
                    messageCount: Number(previous.messageCount || 0) + 1,
                    totalScore: Number(previous.totalScore || 0) + Number(score || 0),
                    lastMessageTimestamp: Math.floor(Date.now() / 1000),
                    canSendMessage: false
                }
            })
            refreshUserDataInBackground()

            if (shouldTriggerRabbitBot) {
                if (sentMessageId <= 0n) {
                    Sentry.captureMessage('RabbitBot reply link failed: missing user messageId', {
                        level: 'warning',
                        tags: {
                            feature: 'rabbitbot',
                            action: 'link-reply',
                        },
                        extra: {
                            userAddress: embeddedWallet?.address || null,
                            txHash,
                            logsCount: Array.isArray(receipt?.logs) ? receipt.logs.length : 0,
                            chatAddress: DIGIT_RABBITS_CHAT_ADDRESS || null,
                            contentLength: contentToSend.length,
                        },
                    })
                    showErrorNotification('RabbitBot could not link a reply to your message. Please try again.')
                    return
                }

                void requestRabbitBotReply(contentToSend, sentMessageId)
            }

        } catch (err) {
            console.error('Error sending message:', err)
            showErrorNotification(err.shortMessage || err.message || 'Failed to send message')
        } finally {
            setSending(false)
        }
    }

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
                    <p style={{ color: textColor, margin: 0, marginBottom: '12px' }}>Please login your <XLogo size={16} className={isNight ? 'text-white' : 'text-black'} /> account to access the RabbitChat.</p>
                    <WalletButton />
                </div>
            </Wrapper>
        )
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

    return (
        <Wrapper>
            <ModerationModal
                isOpen={moderationModal.isOpen}
                onClose={() => setModerationModal({ isOpen: false, type: null, targetAddress: null })}
                onConfirm={
                    moderationModal.type === 'mute' ? handleMuteUser :
                        moderationModal.type === 'unmute' ? handleUnmuteUser :
                            moderationModal.type === 'promote' ? handlePromoteUser :
                                handleDemoteUser
                }
                isNight={isNight}
                type={moderationModal.type}
                targetAddress={moderationModal.targetAddress}
            />

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: isMobileLayout ? '100dvh' : '80vh',
                maxHeight: isMobileLayout ? '100dvh' : '800px',
                minHeight: isMobileLayout ? 0 : '420px'
            }}>
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    scrollbarGutter: 'stable',
                    scrollbarWidth: 'thin',
                    scrollbarColor: isNight ? '#555 #1a1a1a' : '#ccc #f5f5f5',
                    background: isNight ? '#1a1a1a' : '#fafafa',
                    padding: '16px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '10px 10px 0 0'
                }}>
                    {messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: isNight ? '#666' : '#999', marginTop: '40px' }}>
                            No messages yet. Be the first to chat! 🐰
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <MessageBubble
                                key={msg.messageId}
                                message={msg}
                                messages={messages}
                                isNight={isNight}
                                playerData={playerData}
                                onReply={(message) => {
                                    setReplyingTo(message)
                                    if (inputRef.current) inputRef.current.focus()
                                }}
                            />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div style={{
                    background: cardBg,
                    padding: '16px',
                    paddingBottom: isMobileLayout ? 'calc(16px + env(safe-area-inset-bottom))' : '16px',
                    borderRadius: '0 0 10px 10px',
                    border: `1px solid ${borderColor}`,
                    borderTop: 'none',
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 10
                }}>
                    <SuccessNotification
                        message={notification.message}
                        isVisible={notification.isVisible}
                        type={notification.type}
                        durationMs={notification.durationMs}
                        onClose={() => setNotification({ isVisible: false, message: '', type: 'success', durationMs: 4000 })}
                        isNight={isNight}
                    />

                    {isRabbitBotThinking && (
                        <div style={{
                            fontSize: '11px',
                            color: isNight ? '#9ca3af' : '#6b7280',
                            marginBottom: '8px'
                        }}>
                            RabbitBot is thinking{'.'.repeat(rabbitBotThinkingDotCount)}
                        </div>
                    )}

                    {cooldownRemaining > 0 && (
                        <div style={{
                            background: isNight ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.05)',
                            color: isNight ? '#fbbf24' : '#d97706',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            marginBottom: '12px',
                            textAlign: 'center'
                        }}>
                            ⏱️ Cooldown: {cooldownRemaining}s remaining
                        </div>
                    )}

                    {replyingTo && (
                        <div style={{
                            background: isNight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(79, 70, 229, 0.05)',
                            border: `1px solid ${isNight ? '#4f46e5' : '#6366f1'}`,
                            borderLeft: `3px solid ${isNight ? '#4f46e5' : '#6366f1'}`,
                            padding: '8px 12px',
                            borderRadius: '6px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px'
                        }}>
                            <Reply size={14} style={{ color: isNight ? '#818cf8' : '#6366f1', marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: '11px',
                                    color: isNight ? '#818cf8' : '#6366f1',
                                    marginBottom: '2px',
                                    fontWeight: '600'
                                }}>
                                    Replying to {replyingTo.twitterUsername || 'Anonymous'}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: isNight ? '#aaa' : '#666',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {replyingTo.content}
                                </div>
                            </div>
                            <button
                                onClick={() => setReplyingTo(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    color: isNight ? '#888' : '#666',
                                    flexShrink: 0
                                }}
                                title="Cancel reply"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {playerData?.gamePlayed > 0 ? (
                        <>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                marginBottom: '10px',
                                flexWrap: 'wrap'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setSendToRabbitBot((previous) => !previous)}
                                    disabled={sending}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: sendToRabbitBot
                                            ? (isNight ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(5, 150, 105, 0.3))' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(5, 150, 105, 0.16))')
                                            : (isNight ? 'linear-gradient(135deg, #3b3b3b, #2b2b2b)' : 'linear-gradient(135deg, #f7f7f7, #ebebeb)'),
                                        color: sendToRabbitBot
                                            ? (isNight ? '#a7f3d0' : '#065f46')
                                            : (isNight ? '#f3f4f6' : '#1f2937'),
                                        border: `2px solid ${sendToRabbitBot
                                            ? (isNight ? '#34d399' : '#10b981')
                                            : borderColor}`,
                                        borderRadius: '999px',
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        letterSpacing: '0.02em',
                                        cursor: sending ? 'not-allowed' : 'pointer',
                                        opacity: sending ? 0.7 : 1,
                                        boxShadow: sendToRabbitBot
                                            ? (isNight ? '0 0 0 2px rgba(16, 185, 129, 0.24), 0 6px 14px rgba(16, 185, 129, 0.2)' : '0 0 0 2px rgba(16, 185, 129, 0.18), 0 6px 14px rgba(16, 185, 129, 0.16)')
                                            : (isNight ? '0 2px 8px rgba(0, 0, 0, 0.35)' : '0 2px 8px rgba(0, 0, 0, 0.12)'),
                                        transition: 'all 0.2s ease'
                                    }}
                                    title="Toggle RabbitBot mode"
                                >
                                    <Bot size={14} />
                                    RabbitBot {sendToRabbitBot ? 'ON' : 'OFF'}
                                </button>

                                {sendToRabbitBot && (
                                    <span style={{ fontSize: '11px', color: isNight ? '#9ca3af' : '#6b7280' }}>
                                        Your next message will trigger an on-chain RabbitBot reply.
                                    </span>
                                )}
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    if (!sending && cooldownRemaining === 0 && inputMessage.trim()) {
                                        handleSendMessage()
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    gap: '12px',
                                    flexDirection: isMobileLayout ? 'column' : 'row'
                                }}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    enterKeyHint="send"
                                    onKeyDown={(e) => {
                                        const isEnter = e.key === 'Enter' || e.keyCode === 13 || e.which === 13
                                        if (isEnter) {
                                            e.preventDefault()
                                            e.currentTarget.form?.requestSubmit()
                                        }
                                    }}
                                    placeholder={replyingTo
                                        ? `Reply to ${replyingTo.twitterUsername || 'Anonymous'}...`
                                        : sendToRabbitBot
                                            ? 'Ask RabbitBot...'
                                            : 'Type your message...'}
                                    maxLength={200}
                                    disabled={sending}
                                    style={{
                                        flex: 1,
                                        background: isNight ? '#2a2a2a' : '#fff',
                                        color: textColor,
                                        border: `1px solid ${borderColor}`,
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        fontSize: isMobileLayout ? '16px' : '14px',
                                        outline: 'none',
                                        opacity: sending ? 0.6 : 1,
                                        width: '100%'
                                    }}
                                />

                                <button
                                    type="submit"
                                    disabled={sending || !inputMessage.trim() || cooldownRemaining > 0}
                                    style={{
                                        background: (sending || !inputMessage.trim() || cooldownRemaining > 0)
                                            ? (isNight ? '#374151' : '#d1d5db')
                                            : (isNight ? '#4f46e5' : '#6366f1'),
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: (sending || !inputMessage.trim() || cooldownRemaining > 0) ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease',
                                        flexShrink: 0,
                                        width: isMobileLayout ? '100%' : 'auto',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="w-2 h-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>Send</>
                                    )}
                                </button>
                            </form>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '8px',
                                fontSize: '11px',
                                color: isNight ? '#666' : '#999'
                            }}>
                                <span>{inputMessage.length}/200 characters</span>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            color: isNight ? '#666' : '#999',
                            marginBottom: '12px'
                        }}>
                            Play at least one game to unlock the chat and start earning RabbitPoints!
                        </div>
                    )}
                </div>

                {/* Section User Stats et Modération */}
                {userData && (
                    <div style={{
                        background: cardBg,
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: `1px solid ${borderColor}`,
                        marginTop: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            fontSize: '13px',
                            color: isNight ? '#9ca3af' : '#6b7280'
                        }}>
                            <span>
                                Role: <span className={`font-semibold ${userData.roleIndex === 3 ? 'text-emerald-500' :
                                    userData.roleIndex === 2 ? 'text-red-500' :
                                        userData.roleIndex === 1 ? 'text-blue-500' :
                                            'text-gray-500'
                                    }`}>
                                    {userData.role}
                                    {userData.roleIndex === 3 && <Bot size={14} className="inline ml-1" />}
                                    {userData.roleIndex === 2 && <Shield size={14} className="inline ml-1" />}
                                </span>
                                {userData.isMuted && muteRemaining > 0 && (
                                    <span className="font-semibold ml-2" style={{ color: isNight ? '#f59e0b' : '#b45309' }}>
                                        🔇 Unmute in {formatDuration(muteRemaining)}
                                    </span>
                                )}
                            </span>
                            <span>Messages: <span className="font-semibold">{userData.messageCount}</span></span>
                            <span>RabbitPoints: <span className="font-semibold">{userData.totalScore}</span></span>
                        </div>

                        {/* Boutons de modération pour les modérateurs */}
                        {isModerator && (
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                justifyContent: 'flex-start',
                                maxWidth: '100%'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <input
                                            type="text"
                                            placeholder="0x..."
                                            value={targetAddress}
                                            onChange={(e) => setTargetAddress(e.target.value)}
                                            style={{
                                                background: isNight ? '#1a1a1a' : '#f5f5f5',
                                                color: textColor,
                                                border: `1px solid ${borderColor}`,
                                                padding: '6px 10px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                width: '140px',
                                                fontFamily: 'monospace'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setTargetAddress('')}
                                            disabled={!hasTargetInput}
                                            title="Clear address"
                                            style={{
                                                background: isNight ? '#2b2b2b' : '#ececec',
                                                color: isNight ? '#bbb' : '#555',
                                                border: `1px solid ${borderColor}`,
                                                width: '14px',
                                                height: '14px',
                                                padding: '0',
                                                borderRadius: '3px',
                                                cursor: hasTargetInput ? 'pointer' : 'not-allowed',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: hasTargetInput ? 1 : 0.5
                                            }}
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                    {isSelfTarget && (
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                color: isNight ? '#fca5a5' : '#dc2626',
                                                fontWeight: 600,
                                                lineHeight: 1.25,
                                                maxWidth: '220px'
                                            }}
                                        >
                                            Self moderation is not allowed.
                                        </span>
                                    )}
                                    {hasTargetInput && !isValidEvmAddress && (
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                color: isNight ? '#fca5a5' : '#dc2626',
                                                fontWeight: 600,
                                                lineHeight: 1.25,
                                                maxWidth: '220px'
                                            }}
                                        >
                                            Invalid address format (0x + 40 hex chars).
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-start', maxWidth: '100%' }}>
                                    <button
                                        onClick={() => openModerationModal('mute')}
                                        disabled={!canModerateTarget}
                                        style={{
                                            background: isNight ? '#7f1d1d' : '#fee2e2',
                                            color: isNight ? '#fca5a5' : '#dc2626',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: canModerateTarget ? 'pointer' : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            opacity: canModerateTarget ? 1 : 0.5,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => canModerateTarget && (e.currentTarget.style.opacity = '0.8')}
                                        onMouseOut={(e) => canModerateTarget && (e.currentTarget.style.opacity = '1')}
                                        title={isSelfTarget ? "You can't moderate yourself" : "Mute user"}
                                    >
                                        <Ban size={14} />
                                        Mute
                                    </button>
                                    <button
                                        onClick={() => openModerationModal('unmute')}
                                        disabled={!canModerateTarget}
                                        style={{
                                            background: isNight ? '#14532d' : '#d1fae5',
                                            color: isNight ? '#6ee7b7' : '#059669',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: canModerateTarget ? 'pointer' : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            opacity: canModerateTarget ? 1 : 0.5,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => canModerateTarget && (e.currentTarget.style.opacity = '0.8')}
                                        onMouseOut={(e) => canModerateTarget && (e.currentTarget.style.opacity = '1')}
                                        title={isSelfTarget ? "You can't moderate yourself" : "Unmute user"}
                                    >
                                        <VolumeX size={14} />
                                        Unmute
                                    </button>
                                    <button
                                        onClick={() => openModerationModal('promote')}
                                        disabled={!canModerateTarget}
                                        style={{
                                            background: isNight ? '#1e3a8a' : '#dbeafe',
                                            color: isNight ? '#93c5fd' : '#2563eb',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: canModerateTarget ? 'pointer' : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            opacity: canModerateTarget ? 1 : 0.5,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => canModerateTarget && (e.currentTarget.style.opacity = '0.8')}
                                        onMouseOut={(e) => canModerateTarget && (e.currentTarget.style.opacity = '1')}
                                        title={isSelfTarget ? "You can't moderate yourself" : "Promote to Confirmed Rabbit"}
                                    >
                                        <UserCheck size={14} />
                                        Promote
                                    </button>
                                    <button
                                        onClick={() => openModerationModal('demote')}
                                        disabled={!canModerateTarget}
                                        style={{
                                            background: isNight ? '#7c2d12' : '#fed7aa',
                                            color: isNight ? '#fdba74' : '#ea580c',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: canModerateTarget ? 'pointer' : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            opacity: canModerateTarget ? 1 : 0.5,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => canModerateTarget && (e.currentTarget.style.opacity = '0.8')}
                                        onMouseOut={(e) => canModerateTarget && (e.currentTarget.style.opacity = '1')}
                                        title={isSelfTarget ? "You can't moderate yourself" : "Remove Confirmed Role"}
                                    >
                                        <UserMinus size={14} />
                                        Demote
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Wrapper>
    )
}
