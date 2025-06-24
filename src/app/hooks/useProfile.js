'use client'

import { useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const { ready, authenticated, user } = usePrivy()
  const { wallets } = useWallets()

  useEffect(() => {
    if (!ready) return

    if (!authenticated || !user) {
      setProfile(null)
      setError('Please login to see your profile.')
      setLoading(false)
      return
    }

    const timeoutId = setTimeout(() => {
      fetchProfile()
    }, 1000)

    return () => clearTimeout(timeoutId)

    async function fetchProfile() {
      setLoading(true)
      setError(null)
      try {
        // Optionnel : appel à ton backend pour le profil utilisateur
        // const res = await fetch('/api/users/profile', { method: 'POST' })
        // if (!res.ok) throw new Error(await res.text())
        // const data = await res.json()
        // setProfile(data.profile)

        // Ou juste utiliser les données du user si tu ne fais pas de fetch
        setProfile({
          id: user.id,
          email: user.email?.address,
          walletAddresses: [
            ...(wallets || []).map(w => w.address)
          ]
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  }, [ready, authenticated, user, wallets])

  return {
    profile,
    wallets,
    loading,
    error
  }
}
