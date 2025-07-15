'use client'

import { useTheme } from '@/context'
import Wrapper from "./Wrapper"

export default function FAQ() {
    const { themeMode } = useTheme()

    const isNight = themeMode === 'dark'
    const textColor = isNight ? 'text-white' : 'text-black'
    const subTextColor = isNight ? 'text-zinc-400' : 'text-gray-600'

    return (
        <Wrapper>
            <div className="space-y-3 max-w-2xl mx-auto">
                <div
                    style={{
                        background: isNight ? '#222' : '#f3f3f3',
                        padding: '15px',
                        borderRadius: '10px',
                        boxShadow: isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)',
                        border: `1px solid ${isNight ? '#444' : '#ddd'}`,
                    }}
                >
                    <h5 className={`font-semibold mb-2 text-center ${textColor}`}>
                        What is an embedded wallet and why do I need it to play the game?
                    </h5>
                    <p className={`text-xs leading-relaxed text-center ${subTextColor}`}>
                        An embedded wallet is a secure, self-custodial crypto wallet that is created for you automatically within the game. You don&apos;t need to download a separate browser extension or mobile app. This wallet is essential for the game as it stores your hard-earned RabbitPoints and any in-game items you purchase, which are recorded on the blockchain. This ensures you have true ownership of your assets.
                    </p>
                </div>

                <div
                    style={{
                        background: isNight ? '#222' : '#f3f3f3',
                        padding: '15px',
                        borderRadius: '10px',
                        boxShadow: isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)',
                        border: `1px solid ${isNight ? '#444' : '#ddd'}`,
                    }}
                >
                    <h5 className={`font-semibold mb-2 text-center ${textColor}`}>
                        How is my embedded wallet created?
                    </h5>
                    <p className={`text-xs leading-relaxed text-center ${subTextColor}`}>
                        Your embedded wallet is automatically and securely created for you the first time you log in. This makes it easy to get started right away without any complex setup.
                    </p>
                </div>

                <div
                    style={{
                        background: isNight ? '#222' : '#f3f3f3',
                        padding: '15px',
                        borderRadius: '10px',
                        boxShadow: isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)',
                        border: `1px solid ${isNight ? '#444' : '#ddd'}`,
                    }}
                >
                    <h5 className={`font-semibold mb-2 text-center ${textColor}`}>
                        Is my embedded wallet secure?
                    </h5>
                    <p className={`text-xs leading-relaxed text-center ${subTextColor}`}>
                        Yes. Your wallet is protected using advanced security measures. It is self-custodial, meaning you have full control over it. Neither the game developers nor Privy can access your private keys. For your peace of mind, you always have the option to export your private key.
                    </p>
                </div>

                <div
                    style={{
                        background: isNight ? '#222' : '#f3f3f3',
                        padding: '15px',
                        borderRadius: '10px',
                        boxShadow: isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)',
                        border: `1px solid ${isNight ? '#444' : '#ddd'}`,
                    }}
                >
                    <h5 className={`font-semibold mb-2 text-center ${textColor}`}>
                        How to play the game?
                    </h5>
                    <div className={`text-xs leading-relaxed text-center ${subTextColor} space-y-2`}>
                        <p>Connect each 5 hours and make the most clicks you can to get the better score. With your RabbitPoints you can buy items on the shop which will give you a boost to achieve even a better score.</p>
                        <p>Your items bring your Digital Rabbit to life! Every item you purchase is automatically equipped on your character in your profile, creating a one-of-a-kind digital identity. Download your creation and share it on socials to showcase your achievements and style!</p>
                        <p>Try to be on the top of the leaderboard to receive perks or WL.</p>
                        <p>Try to be as active as possible to achieve the best streak.</p>
                    </div>
                </div>

                <div
                    style={{
                        background: isNight ? '#222' : '#f3f3f3',
                        padding: '15px',
                        borderRadius: '10px',
                        boxShadow: isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)',
                        border: `1px solid ${isNight ? '#444' : '#ddd'}`,
                    }}
                >
                    <h5 className={`font-semibold mb-2 text-center ${textColor}`}>
                        Can I export my private key from the embedded wallet?
                    </h5>
                    <p className={`text-xs leading-relaxed text-center ${subTextColor}`}>
                        Yes, to do so go to Settings and click on the &quot;Export private key&quot; button.
                    </p>
                </div>

                <div
                    style={{
                        background: isNight ? '#222' : '#f3f3f3',
                        padding: '15px',
                        borderRadius: '10px',
                        boxShadow: isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)',
                        border: `1px solid ${isNight ? '#444' : '#ddd'}`,
                    }}
                >
                    <h5 className={`font-semibold mb-2 text-center ${textColor}`}>
                        Can I link my wallets containing partnerships NFTs?
                    </h5>
                    <p className={`text-xs leading-relaxed text-center ${subTextColor}`}>
                        Yes, head over the Settings section, you will see appear all of the wallets you&apos;ve previously linked. These one will be used to compute your final score once the season is over.
                    </p>
                </div>
            </div>
        </Wrapper>
    )
}