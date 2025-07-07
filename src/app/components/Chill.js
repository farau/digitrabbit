'use client'

import { useRef, useState, useEffect } from 'react'

const videoSources = [
  '/video/digit_rabbits_showcase.mp4',
  '/video/digit_rabbits_showcase2.mp4',
]

export default function Chill() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const prev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? videoSources.length - 1 : prev - 1
    )
  }

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % videoSources.length)
  }

  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
      <video
        src={videoSources[currentIndex]}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        controls
        autoPlay
        muted
        loop
      />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
        <button onClick={prev}>⬅️ Previous</button>
        <button onClick={next}>Next ➡️</button>
      </div>
    </div>
  )
}
