'use client'

import Image from 'next/image'
import Wrapper from './Wrapper'
import { useTheme } from '@/context'

const LINKS = {
    opensea: process.env.NEXT_PUBLIC_OPENSEA_COLLECTION_URL || 'https://opensea.io/collection/digit-rabbits-mega',
    discord: process.env.NEXT_PUBLIC_DIGITRABBITS_DISCORD_URL || 'https://discord.com/invite/QzJvgbr2',
    twitter: 'https://x.com/digitrabbits',
}

export default function Linktree() {
    const { themeMode } = useTheme()
    const isNight = themeMode === 'dark'

    const textColor = isNight ? '#f5f5f5' : '#202020'
    const subTextColor = isNight ? '#a1a1aa' : '#5f6368'
    const cardBg = isNight ? '#1a1a1a' : '#f3f3f3'
    const borderColor = isNight ? '#333' : '#ddd'

    const linkButtonStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        textDecoration: 'none',
        color: textColor,
        background: isNight
            ? 'linear-gradient(135deg, #27272a 0%, #18181b 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '14px 16px',
        fontWeight: 600,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        boxShadow: isNight
            ? '0 3px 12px rgba(0, 0, 0, 0.35)'
            : '0 3px 12px rgba(15, 23, 42, 0.08)',
    }

    const openInNewTabProps = {
        target: '_blank',
        rel: 'noopener noreferrer',
    }

    return (
        <Wrapper>
            <div className="max-w-xl mx-auto p-4">
                <div
                    style={{
                        background: cardBg,
                        border: `1px solid ${borderColor}`,
                        borderRadius: '14px',
                        padding: '18px',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                        <Image
                            src="/img/logo.png"
                            alt="Digit Rabbits"
                            width={74}
                            height={74}
                            style={{ borderRadius: '999px' }}
                        />
                        <h3 style={{ margin: '10px 0 4px', color: textColor, fontSize: '18px', textAlign: 'center' }}>
                            Digit Rabbits
                        </h3>
                        <p style={{ margin: 0, color: subTextColor, fontSize: '12px', textAlign: 'center' }}>
                            All our official links in one place
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: '10px' }}>
                        <a
                            href={LINKS.opensea}
                            {...openInNewTabProps}
                            style={linkButtonStyle}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                            <span>OpenSea Collection</span>
                            <span aria-hidden="true">↗</span>
                        </a>

                        <a
                            href={LINKS.discord}
                            {...openInNewTabProps}
                            style={linkButtonStyle}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                            <span>Discord</span>
                            <span aria-hidden="true">↗</span>
                        </a>

                        <a
                            href={LINKS.twitter}
                            {...openInNewTabProps}
                            style={linkButtonStyle}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                            <span>Twitter / X</span>
                            <span aria-hidden="true">↗</span>
                        </a>
                    </div>
                </div>
            </div>
        </Wrapper>
    )
}
