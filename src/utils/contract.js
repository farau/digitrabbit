'use client'

import { useEffect, useState, useMemo } from 'react'
import { Contract, BrowserProvider } from 'ethers'
import { useAppKitProvider } from '@reown/appkit/react'
import abi from './abi'

const CONTRACT_ADDRESS = '0xfEfb1c731a5DF380dd95b4FC2A4D29d49E05377d'

export function useContract() {
  const { walletProvider } = useAppKitProvider('eip155')
  const [contract, setContract] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const init = async () => {
      if (!walletProvider) return
      try {
        const provider = new BrowserProvider(walletProvider)
        const signer = await provider.getSigner()
        const instance = new Contract(CONTRACT_ADDRESS, abi, signer)
        setContract(instance)
      } catch (err) {
        console.error('Error initializing contract:', err)
        setError('Erreur lors de l\'initialisation du contrat')
      }
    }
    init()
  }, [walletProvider])

  const clearError = () => setError(null)

  return useMemo(() => {
    if (!contract) return { error, clearError }

    const wrap = async (fn) => {
      try {
        setError(null)
        const tx = await fn()
        return await tx.wait()
      } catch (err) {
        console.error(err)
        setError(err.message || 'Erreur lors de la transaction')
        return null
      }
    }

    return {
      error,
      clearError,

      startSeason: () => wrap(() => contract.startSeason()),
      startGame: () => wrap(() => contract.startGame()),
      play: () => wrap(() => contract.play()),
      buyItem: (slot, level) => wrap(() => contract.buyItem(slot, level)),
      adminGrantPoints: (seasonId, addr, amount) => wrap(() => contract.adminGrantPoints(seasonId, addr, amount)),
      // Fonctions de lecture (pas de transaction => pas besoin wrap)
      getPlayerCurrentSeasonData: async (addr) => {
        try {
          return await contract.getPlayerCurrentSeasonData(addr)
        } catch (err) {
          console.error(err)
          setError(err.message || 'Erreur lors de la récupération des données')
          return null
        }
      },

      getAllPlayersSeasonData: async () => {
        try {
          return await contract.getAllPlayersSeasonData()
        } catch (err) {
          console.error(err)
          setError(err.message || 'Erreur lors de la récupération des données')
          return null
        }
      },

      getPlayerData: async (addr, seasonId) => {
        try {
          return await contract.getPlayerData(addr, seasonId)
        } catch (err) {
          console.error(err)
          setError(err.message || 'Erreur lors de la récupération des données')
          return null
        }
      },

      getBoostPercent: async (items) => {
        try {
          return await contract.getBoostPercent(items)
        } catch (err) {
          console.error(err)
          setError(err.message || 'Erreur lors de la récupération des données')
          return null
        }
      }
    }
  }, [contract, error])
}
