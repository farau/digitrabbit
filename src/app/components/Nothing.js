'use client'

export default function Nothing() {
  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
      <video
        src="/video/digit_rabbits_showcase.mp4"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        controls
        autoPlay
        muted
        loop
      />
    </div>
  )
}
