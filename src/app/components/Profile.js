'use client'

import { useProfile } from '@/app/hooks/useProfile'

export default function Profile() {
    
    const { profile, loading, error } = useProfile()

    if (loading) return <p style={{ margin: 0, padding: 10, color: "black" }}>Loading...</p>
    if (error) return <p style={{ margin: 0, padding: 10, color: "black" }}>{error}</p>
    if (!profile) return <p style={{ margin: 0, padding: 10, color: "black" }}>Please connect your wallet to see your profile.</p>

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 15, padding: 10 }}>
            <p style={{ margin: 0, padding: 10, color: "black" }}>Wallet address : {profile.userAddress}</p>
            <p style={{ margin: 0, padding: 10, color: "black" }}>Points : {profile.points_socials}</p>
            {/* Tu peux ajouter d'autres champs ici, par exemple : */}
        </div>
    )
}
