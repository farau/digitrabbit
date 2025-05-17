'use client'

import { useState, useEffect } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { isConnected } = useAppKitAccount()

  useEffect(() => {
    if (!isConnected) {
      setProfile(null)
      setLoading(false)
      setError("Please connect your wallet to see your profile.")
      return
    }
  
    const timeoutId = setTimeout(() => {
      fetchProfile()
    }, 1000) // délai court pour laisser le temps au cookie d’être écrit
  
    return () => clearTimeout(timeoutId)
  
    async function fetchProfile() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/users/profile', { method: 'POST' })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setProfile(data.profile)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  }, [isConnected])
  
  return { profile, loading, error }
}
