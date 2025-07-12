'use client'

import Image from "next/image"
import Wrapper from "./Wrapper"
import { usePlayerData } from "../hooks/usePlayerData"

export default function DREAM({ embeddedWallet, refreshCounter }) {
    const { playerData } = usePlayerData(embeddedWallet, refreshCounter)

    if (!playerData) {
        return <div className="text-white">Loading...</div>;
    }

    const totalClicks = Number(playerData.totalClicks)
    const target = 1000000;
    const progressPercentage = Math.min((totalClicks / target) * 100, 100);

    const formatNumber = (num) => {
        return num.toLocaleString();
    };

    return (
        <Wrapper>
            <div className="flex flex-col items-center text-center gap-6 p-8 max-w-lg mx-auto">
                <Image
                    src="/img/dream-section.jpeg"
                    alt="Dream"
                    width={150}
                    height={150}
                    className="rounded-full object-cover border-2 border-white/20"
                />

                <h3 className="text-2xl font-semibold text-white">
                    **Everyone has a dream...**
                </h3>

                <p className="text-base text-white/80 leading-relaxed max-w-md">
                    Ours is to reach at least 1 million transactions on MegaETH, and we want you to be part of it!
                </p>

                <div className="w-full bg-white/10 rounded-xl p-6 border border-white/20">
                    <div className="flex justify-between items-center mb-4 text-sm text-white/90">
                        <span>Dream Progress</span>
                        <span className="font-semibold text-yellow-400">
                            {progressPercentage.toFixed(1)}%
                        </span>
                    </div>

                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>

                    <div className="flex justify-between text-xs text-white/70">
                        <span>{formatNumber(totalClicks)} transactions</span>
                        <span>Goal: {formatNumber(target)}</span>
                    </div>
                </div>
            </div>
        </Wrapper>
    );
}