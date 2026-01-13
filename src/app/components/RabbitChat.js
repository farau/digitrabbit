'use client'

import { useState, useEffect, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Loader2, AlertCircle, Shield, UserCheck, UserMinus, Ban, VolumeX, Copy, Check, Reply, X } from 'lucide-react'
import { useGame } from '@/context'
import Wrapper from '@/app/components/Wrapper'
import { useWalletClient } from '../hooks/useWalletClient'
import * as Sentry from '@sentry/nextjs'
import Image from 'next/image'
import { customMegaethTestnet } from '@/utils/chainConfig'

import {
    DIGIT_RABBITS_CHAT_ABI,
    DIGIT_RABBITS_CHAT_ADDRESS,
    DIGIT_RABBITS_ADDRESS,
    DIGIT_RABBITS_ABI,
    ROLE_COLORS,
} from '@/utils/chainConfig'
import { color } from 'framer-motion'

// Composant MessageBubble simplifié
function MessageBubble({ message, messages, isNight, user, onReply }) {
    const [copiedAddress, setCopiedAddress] = useState(false)

    const cardBg = isNight ? '#222' : '#f3f3f3'
    const borderColor = isNight ? '#444' : '#ddd'
    const textColor = isNight ? '#eee' : '#333'

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

    const getRoleColor = (roleIndex) => {
        if (roleIndex === 2) return isNight ? '#ef4444' : '#dc2626'
        if (roleIndex === 1) return isNight ? '#3b82f6' : '#2563eb'
        return isNight ? '#6b7280' : '#9ca3af'
    }

    return (
        <div>
            {/* Si c'est une réponse, afficher le message original */}
            {repliedMessage && (
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginBottom: '1px',
                    paddingLeft: '12px',
                    position: 'relative'
                }}>
                    {/* Coin arrondi */}
                    <div style={{
                        position: 'absolute',
                        left: '30px',
                        top: '30px',
                        width: '24px',
                        height: '14px',
                        borderLeft: `2px solid ${getRoleColor(repliedMessage.senderRole)}`,
                        borderTop: `2px solid ${getRoleColor(repliedMessage.senderRole)}`,
                        borderTopLeftRadius: '12px'
                    }} />

                    {/* Avatar miniature du message répondu */}
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
                                border: `2px solid ${getRoleColor(repliedMessage.senderRole)}`,
                                opacity: 0.8
                            }}
                        />
                    </div>
                    <div style={{
                        flex: 1,
                        background: isNight ? 'rgba(79, 70, 229, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        borderLeft: `3px solid ${getRoleColor(repliedMessage.senderRole)}`,
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
                                color: getRoleColor(repliedMessage.senderRole),
                                flexShrink: 0
                            }} />
                            <span style={{
                                color: getRoleColor(repliedMessage.senderRole),
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
            <div
                style={{
                    background: cardBg,
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: `1px solid ${borderColor}`,
                    transition: 'all 0.2s ease',
                    position: 'relative'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = isNight ? '#2a2a2a' : '#f8f8f8'
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = cardBg
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flexShrink: 0 }}>
                        <Image
                            src={message?.twitterProfilePictureUrl || '/img/default-avatar.jpg'}
                            alt="Avatar"
                            width={48}
                            height={48}
                            style={{ borderRadius: '50%' }}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span className={`font-bold ${ROLE_COLORS[message.senderRole]}`}>
                                {message?.twitterUsername || 'Anonymous'}
                            </span>
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
                            <span style={{ fontSize: '11px', color: isNight ? '#666' : '#999' }}>
                                {new Date(message.timestamp * 1000).toLocaleTimeString()}
                            </span>
                            <Image src="/img/rabbitpoint.png" alt="RB" width={20} height={20} />
                            <span style={{ fontSize: '11px', color: '#fbbf24', marginLeft: '-4px' }}>
                                <b>{message.score}</b>
                            </span>
                        </div>
                        <div style={{
                            color: textColor,
                            wordBreak: 'break-word',
                            fontSize: '14px',
                            lineHeight: '1.5'
                        }}>
                            {message.content}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                        <button
                            onClick={() => onReply(message)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '3px',
                                borderRadius: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                color: isNight ? '#888' : '#666'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = isNight ? '#333' : '#e5e5e5'
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'transparent'
                            }}
                            title="Reply to this message"
                        >
                            <Reply size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Modales de confirmation
function ModerationModal({ isOpen, onClose, onConfirm, isNight, type, targetAddress }) {
    const [loading, setLoading] = useState(false)
    const [duration, setDuration] = useState('3600')
    const [customDuration, setCustomDuration] = useState('')

    if (!isOpen) return null

    const textColor = isNight ? '#eee' : '#333'
    const cardBg = isNight ? '#2a2a2a' : '#fff'
    const borderColor = isNight ? '#444' : '#ddd'

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

    const handleConfirm = async () => {
        setLoading(true)
        if (type === 'mute') {
            const finalDuration = duration === 'custom' ? customDuration : duration
            await onConfirm(finalDuration)
        } else {
            await onConfirm()
        }
        setLoading(false)
        onClose()
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: cardBg,
                    padding: '28px',
                    borderRadius: '16px',
                    border: `1px solid ${borderColor}`,
                    maxWidth: '450px',
                    width: '90%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
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
                        <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            style={{
                                width: '100%',
                                backgroundColor: isNight ? '#1a1a1a' : '#f5f5f5',
                                color: isNight ? '#ffffff' : '#000000',
                                border: `1px solid ${borderColor}`,
                                borderRadius: '8px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                appearance: 'auto',
                                WebkitAppearance: 'auto',
                                MozAppearance: 'auto',
                            }}
                        >
                            <option value="3600">1 hour</option>
                            <option value="21600">6 hours</option>
                            <option value="86400">24 hours</option>
                            <option value="604800">7 days</option>
                            <option value="0">Permanent</option>
                            <option value="custom">Custom duration</option>
                        </select>

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
                        onMouseOver={(e) => {
                            if (!loading && !(type === 'mute' && duration === 'custom' && !customDuration)) {
                                e.currentTarget.style.opacity = '0.9'
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!loading) {
                                e.currentTarget.style.opacity = '1'
                            }
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

// Notification de succès
function SuccessNotification({ message, isVisible, onClose, isNight }) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose()
            }, 4000)
            return () => clearTimeout(timer)
        }
    }, [isVisible, onClose])

    if (!isVisible) return null

    return (
        <div style={{
            background: isNight ? '#16a34a' : '#22c55e',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '12px',
            textAlign: 'center'
        }}>
            <Check size={18} />
            <span>{message}</span>
        </div>
    )
}

// Composant principal
export default function RabbitChat({ playerData, messages, isConnected, isSubscribed }) {
    const { user } = usePrivy()
    const { themeMode, embeddedWallet } = useGame()
    const { walletClient } = useWalletClient(embeddedWallet)

    const [inputMessage, setInputMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [error, setError] = useState(null)
    const [userData, setUserData] = useState(null)
    const [cooldownRemaining, setCooldownRemaining] = useState(0)
    const [replyingTo, setReplyingTo] = useState(null)

    // Modération states
    const [moderationModal, setModerationModal] = useState({ isOpen: false, type: null, targetAddress: null })
    const [notification, setNotification] = useState({ isVisible: false, message: '' })
    const [targetAddress, setTargetAddress] = useState('')

    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    const isModerator = userData?.roleIndex === 2

    //Graphic infos
    const isNight = themeMode === 'dark';
    const textColor = isNight ? '#eee' : '#333'
    const cardBg = isNight ? '#222' : '#f3f3f3'
    const labelColor = isNight ? '#ccc' : '#333'
    const tooltipBg = isNight ? '#333' : '#fff'
    const tooltipColor = isNight ? '#eee' : '#333'
    const borderColor = isNight ? '#444' : '#ddd'
    const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (embeddedWallet?.address) {
            loadUserData()
        }
    }, [embeddedWallet?.address])

    const loadUserData = async () => {
        if (!embeddedWallet?.address) return
        try {
            const response = await fetch(`/api/chat/stats?address=${embeddedWallet.address}`)
            if (response.ok) {
                const data = await response.json()
                setUserData(data)
            }
        } catch (error) {
            console.error('Error loading user data:', error)
        }
    }

    const showNotification = (message) => {
        setNotification({ isVisible: true, message })
    }

    const handleMuteUser = async (duration) => {
        if (!walletClient || !moderationModal.targetAddress) return
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
            console.log('✅ User muted:', txHash)
            showNotification(`User ${moderationModal.targetAddress.slice(0, 6)}...${moderationModal.targetAddress.slice(-4)} muted`)
        } catch (err) {
            console.error('Error:', err)
            setError(err.shortMessage || err.message)
        }
    }

    const handleUnmuteUser = async () => {
        if (!walletClient || !moderationModal.targetAddress) return
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
            console.log('✅ User unmuted:', txHash)
            showNotification(`User ${moderationModal.targetAddress.slice(0, 6)}...${moderationModal.targetAddress.slice(-4)} unmuted`)
        } catch (err) {
            console.error('Error:', err)
            setError(err.shortMessage || err.message)
        }
    }

    const handlePromoteUser = async () => {
        if (!walletClient || !moderationModal.targetAddress) return
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
            console.log('✅ User promoted:', txHash)
            showNotification(`User ${moderationModal.targetAddress.slice(0, 6)}...${moderationModal.targetAddress.slice(-4)} promoted`)
        } catch (err) {
            console.error('Error:', err)
            setError(err.shortMessage || err.message)
        }
    }

    const handleDemoteUser = async () => {
        if (!walletClient || !moderationModal.targetAddress) return
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
            console.log('✅ User demoted:', txHash)
            showNotification(`User ${moderationModal.targetAddress.slice(0, 6)}...${moderationModal.targetAddress.slice(-4)} demoted`)
        } catch (err) {
            console.error('Error:', err)
            setError(err.shortMessage || err.message)
        }
    }

    const openModerationModal = (type) => {
        setModerationModal({ isOpen: true, type, targetAddress })
    }

    const handleSendMessage = async () => {
        if (!user || !embeddedWallet?.address || !inputMessage.trim() || !walletClient) return

        try {
            setSending(true)
            setError(null)

            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: inputMessage,
                    userAddress: embeddedWallet.address,
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Failed to send message')

            const { score, nonce, signature, twitterUsername, twitterProfilePictureUrl } = data

            const txHash = await walletClient.writeContract({
                account: embeddedWallet.address,
                address: DIGIT_RABBITS_ADDRESS,
                abi: DIGIT_RABBITS_ABI,
                functionName: 'sendChatMessage',
                args: [inputMessage, score, nonce, twitterUsername, twitterProfilePictureUrl, signature, replyingTo ? BigInt(replyingTo.messageId) : BigInt(0)],
                chain: customMegaethTestnet,
                gas: 30000000n
            })

            console.log('✅ Message sent:', txHash)
            setInputMessage('')
            setReplyingTo(null)
            await loadUserData()

        } catch (err) {
            console.error('Error sending message:', err)
            setError(err.shortMessage || err.message || 'Failed to send message')
        } finally {
            setSending(false)
        }
    }

    if (!embeddedWallet) {
        return (
            <Wrapper>
                <div style={{ background: cardBg, padding: '20px', borderRadius: '10px', border: `1px solid ${borderColor}`, textAlign: 'center' }}>
                    <p style={{ color: textColor }}>Please connect your wallet to access the chat.</p>
                </div>
            </Wrapper>
        )
    }

    return (
        <Wrapper>

            {/* Card */}
            <div style={{
                background: cardBg,
                padding: '24px',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                boxShadow,
                marginLeft: 'auto',
                marginRight: 'auto',
                marginBottom: '15px',
                maxWidth: '500px',
            }}>
                {/* Network */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: '18px',
                    paddingBottom: '18px',
                    borderBottom: `1px solid ${borderColor}`
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
                        <Image src="/img/icons/megaeth.ico" alt="MegaETH Logo" width={14} height={14} />
                    </div>
                    <div>
                        <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: labelColor,
                            margin: '0 0 4px 0'
                        }}>
                            Tied to the MegaETH blockchain
                        </p>
                        <p style={{
                            fontSize: '14px',
                            color: textColor,
                            lineHeight: '1.5',
                            margin: 0,
                            fontWeight: '400',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            Every message is registered into the blockchain. Let's chat here to accumulate RabbitPoints! <Image src="/img/rabbitpoint.png" alt="RB" width={20} height={20} style={{ display: 'inline-block', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }} />
                        </p>
                    </div>
                </div>

                {/* Rules */}
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
                        🛡️
                    </div>
                    <div>
                        <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: labelColor,
                            margin: '0 0 4px 0'
                        }}>
                            Follow the rules
                        </p>
                        <p style={{
                            fontSize: '14px',
                            color: textColor,
                            lineHeight: '1.5',
                            margin: 0,
                            fontWeight: '400',
                        }}>
                            - Moderators are watching and can mute or demote users who violate the chat rules.
                        </p>
                        <p style={{
                            fontSize: '14px',
                            color: textColor,
                            lineHeight: '1.5',
                            margin: 0,
                            fontWeight: '400',
                        }}>
                            - Be consistent and respectful to earn your place as a <b style={{ color: 'green' }}>Confirmed Rabbit</b>! 🐇
                        </p>
                        <p style={{
                            fontSize: '14px',
                            color: textColor,
                            lineHeight: '1.5',
                            margin: 0,
                            fontWeight: '400',
                        }}>
                            - Or buy it directly from the Rabbit Shop to receive a x2 bonus on the RabbitPoints earned in the chat.
                        </p>
                    </div>
                </div>
            </div>

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

            <div style={{ display: 'flex', flexDirection: 'column', height: '80vh', maxHeight: '800px' }}>
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    // afficher slider toujours
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
                                user={user}
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
                    borderRadius: '0 0 10px 10px',
                    border: `1px solid ${borderColor}`,
                    borderTop: 'none'
                }}>
                    {error && (
                        <div style={{
                            background: isNight ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                            color: isNight ? '#fca5a5' : '#dc2626',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <AlertCircle size={16} />
                            {error}
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

                    <SuccessNotification
                        message={notification.message}
                        isVisible={notification.isVisible}
                        onClose={() => setNotification({ isVisible: false, message: '' })}
                        isNight={isNight}
                    />

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

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                            placeholder={replyingTo ? `Reply to ${replyingTo.twitterUsername || 'Anonymous'}...` : "Type your message..."}
                            maxLength={200}
                            disabled={sending}
                            style={{
                                flex: 1,
                                background: isNight ? '#2a2a2a' : '#fff',
                                color: textColor,
                                border: `1px solid ${borderColor}`,
                                padding: '10px 14px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none',
                                opacity: sending ? 0.6 : 1
                            }}
                        />

                        <button
                            onClick={handleSendMessage}
                            disabled={sending || !inputMessage.trim()}
                            style={{
                                background: (sending || !inputMessage.trim())
                                    ? (isNight ? '#374151' : '#d1d5db')
                                    : (isNight ? '#4f46e5' : '#6366f1'),
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: (sending || !inputMessage.trim()) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease'
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
                    </div>

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
                                Role: <span className={`font-semibold ${userData.roleIndex === 2 ? 'text-red-500' :
                                    userData.roleIndex === 1 ? 'text-blue-500' :
                                        'text-gray-500'
                                    }`}>
                                    {userData.role}
                                    {userData.roleIndex === 2 && <Shield size={14} className="inline ml-1" />}
                                </span>
                            </span>
                            <span>Messages: <span className="font-semibold">{userData.messageCount}</span></span>
                            <span>RabbitPoints: <span className="font-semibold">{userData.totalScore}</span></span>
                        </div>

                        {/* Boutons de modération pour les modérateurs */}
                        {isModerator && (
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center'
                            }}>
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
                                    onClick={() => openModerationModal('mute')}
                                    disabled={!targetAddress}
                                    style={{
                                        background: isNight ? '#7f1d1d' : '#fee2e2',
                                        color: isNight ? '#fca5a5' : '#dc2626',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: targetAddress ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        opacity: targetAddress ? 1 : 0.5,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => targetAddress && (e.currentTarget.style.opacity = '0.8')}
                                    onMouseOut={(e) => targetAddress && (e.currentTarget.style.opacity = '1')}
                                    title="Mute user"
                                >
                                    <Ban size={14} />
                                    Mute
                                </button>
                                <button
                                    onClick={() => openModerationModal('unmute')}
                                    disabled={!targetAddress}
                                    style={{
                                        background: isNight ? '#14532d' : '#d1fae5',
                                        color: isNight ? '#6ee7b7' : '#059669',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: targetAddress ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        opacity: targetAddress ? 1 : 0.5,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => targetAddress && (e.currentTarget.style.opacity = '0.8')}
                                    onMouseOut={(e) => targetAddress && (e.currentTarget.style.opacity = '1')}
                                    title="Unmute user"
                                >
                                    <VolumeX size={14} />
                                    Unmute
                                </button>
                                <button
                                    onClick={() => openModerationModal('promote')}
                                    disabled={!targetAddress}
                                    style={{
                                        background: isNight ? '#1e3a8a' : '#dbeafe',
                                        color: isNight ? '#93c5fd' : '#2563eb',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: targetAddress ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        opacity: targetAddress ? 1 : 0.5,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => targetAddress && (e.currentTarget.style.opacity = '0.8')}
                                    onMouseOut={(e) => targetAddress && (e.currentTarget.style.opacity = '1')}
                                    title="Promote to Confirmed Rabbit"
                                >
                                    <UserCheck size={14} />
                                    Promote
                                </button>
                                <button
                                    onClick={() => openModerationModal('demote')}
                                    disabled={!targetAddress}
                                    style={{
                                        background: isNight ? '#7c2d12' : '#fed7aa',
                                        color: isNight ? '#fdba74' : '#ea580c',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: targetAddress ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        opacity: targetAddress ? 1 : 0.5,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => targetAddress && (e.currentTarget.style.opacity = '0.8')}
                                    onMouseOut={(e) => targetAddress && (e.currentTarget.style.opacity = '1')}
                                    title="Remove Confirmed Role"
                                >
                                    <UserMinus size={14} />
                                    Demote
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Wrapper >
    )
}