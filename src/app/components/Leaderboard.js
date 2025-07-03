'use client'

import { useState } from 'react'
import Wrapper from '@/app/components/Wrapper';

const mockScores = Array.from({ length: 100 }, (_, i) => ({
  address: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
  score: Math.floor(Math.random() * 500) + 100,
})).sort((a, b) => b.score - a.score)

const mockStreaks = Array.from({ length: 100 }, (_, i) => ({
  address: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
  streak: Math.floor(Math.random() * 30) + 1,
})).sort((a, b) => b.streak - a.streak)


export default function Leaderboard({ userAddress = "0x12...34AB" }) {
  const [tab, setTab] = useState('score')


  const highlightStyle = "bg-blue-300 dark:bg-blue-400 text-blue-900 dark:text-gray-900 font-semibold";

  const tabStyle = (active) =>
    `px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors duration-200 ${active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`

  const renderList = (items, keyName, label) => {
    if (!Array.isArray(items)) {
      console.error('items should be an array but got:', items)
      return <p className="text-red-500 text-sm text-center">Error loading data.</p>
    }

    return (
      <div className="max-h-64 overflow-y-auto">
        <ul className="divide-y divide-gray-200 text-sm">
          {items.map((item, i) => (
            <li
              key={item.address + item[keyName]}
              className={`flex justify-between py-2 px-4 ${item.address === userAddress ? highlightStyle : ""
                }`}
            >
              <span>{i + 1}. {item.address}</span>
              <span>{label(item)}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <Wrapper>
      {/* Onglets */}
      <div className="flex justify-center gap-4 mb-6">
        <button onClick={() => setTab('score')} className={tabStyle(tab === 'score')}>
          Top RabbitPointss
        </button>
        <button onClick={() => setTab('streak')} className={tabStyle(tab === 'streak')}>
          Top Streaks
        </button>
      </div>

      {/* Contenu selon l'onglet */}
      {tab === 'score'
        ? renderList(mockScores, 'score', (item) => `${item.score} pts`)
        : renderList(mockStreaks, 'streak', (item) => `${item.streak} days`)
      }
    </Wrapper>
  )
}
