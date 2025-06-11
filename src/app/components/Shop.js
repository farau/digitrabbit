'use client'

import { useContract } from '../../utils/contract'
import { useState } from 'react'

export default function Shop() {
  const contract = useContract()
  const [loading, setLoading] = useState(false)

  const handleBuy = async (itemId) => {
    if (!contract) return
    setLoading(true)
    try {
      const tx = await contract.buyItem(itemId)
      await tx.wait()
      console.log(`Item ${itemId} acheté avec succès !`)
    } catch (err) {
      console.error('Erreur achat :', err)
    }
    setLoading(false)
  }

  return (
    <div className="p-6 bg-white/80 rounded-xl shadow-lg max-w-md mx-auto mt-10">
      <h2 className="text-xl font-semibold mb-4">Boutique</h2>
      {[0, 1, 2].map((id) => (
        <button
          key={id}
          onClick={() => handleBuy(id)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg m-2"
          disabled={loading}
        >
          Acheter item {id}
        </button>
      ))}
    </div>
  )
}
