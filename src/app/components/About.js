'use client'

import Image from "next/image"
import Wrapper from "./Wrapper"
import { useTheme } from '@/context'

export default function About() {
    const { themeMode } = useTheme();
    const isNight = themeMode === 'dark';
    const textColor = isNight ? '#eee' : '#333'
    const cardBg = isNight ? '#222' : '#f3f3f3'
    const labelColor = isNight ? '#ccc' : '#333'
    const tooltipBg = isNight ? '#333' : '#fff'
    const tooltipColor = isNight ? '#eee' : '#333'
    const borderColor = isNight ? '#444' : '#ddd'
    const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'

    return (
        <Wrapper>
            <p style={{ margin: 0, padding: 10, color: textColor }} className="text-center">
                <span style={{ fontWeight: "bold" }}>Digit Rabbits – Where tech meets meme culture</span>
            </p>

            <p style={{ margin: "0 0 20px 0", padding: 10, color: textColor }} className="text-center">
                Digit Rabbits is a generative meme-based PFP collection with retro futuristic and fun vibes. Built on <span style={{ fontWeight: "bold" }}>MegaETH</span>, it was designed to be fun, accessible and welcoming to all, whether you&apos;re a degen, a meme lover, or just here for the tech.
            </p>

            <Image
                src={themeMode === 'light' ? "/img/banner.jpg" : "/img/banner_grey.webp"}
                alt="Logo"
                width={500}
                height={300}
                style={{ margin: "20px auto", display: "block", borderRadius: 12 }}
            />

            <p style={{ margin: "20px 0 0 0", padding: 10, color: textColor }} className="text-center">
                At Digit Rabbits, we believe that you can&apos;t create a culture without a community. That&apos;s why we&apos;ve always put culture before hype and taken our time to develop our project and community.
            </p>

            {/* Mission & Vision Card */}
            <div style={{
                background: cardBg,
                padding: '24px',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                boxShadow,
                margin: '20px auto',
                maxWidth: '500px'
            }}>
                {/* Mission */}
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
                        🎯
                    </div>
                    <div>
                        <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: labelColor,
                            margin: '0 0 4px 0'
                        }}>
                            Our Mission
                        </p>
                        <p style={{
                            fontSize: '14px',
                            color: textColor,
                            lineHeight: '1.5',
                            margin: 0,
                            fontWeight: '400'
                        }}>
                            Create a super cool pfp and onboard more people to MegaETH, through an accessible, community-driven collection.
                        </p>
                    </div>
                </div>

                {/* Vision */}
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
                        ✨
                    </div>
                    <div>
                        <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: labelColor,
                            margin: '0 0 4px 0'
                        }}>
                            Our Vision
                        </p>
                        <p style={{
                            fontSize: '14px',
                            color: textColor,
                            lineHeight: '1.5',
                            margin: 0,
                            fontWeight: '400'
                        }}>
                            Underpromise and just overdeliver.
                        </p>
                    </div>
                </div>
            </div>

            <p style={{ margin: 0, padding: 10, color: textColor }} className="text-center">
                Our clicking game brings the community together in a competition where every click represents a real on-chain transaction on the <span style={{ fontWeight: "bold" }}>MegaETH testnet</span>. It&apos;s our way of showcasing the unmatched speed of MegaETH, while rewarding the most active players along the way.
            </p>

            <p style={{ margin: 0, padding: 10, color: textColor }} className="text-center">
                Now unplug your brain, open the game and click as fast as you can.
            </p>

            <p style={{ margin: 0, padding: 10, color: textColor, textAlign: "center", fontStyle: "italic" }}>
                <span style={{ fontWeight: "bold" }}>Rabbitio.</span>
            </p>
        </Wrapper>
    )
}