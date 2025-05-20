'use client'

import Image from "next/image"

export default function MemeGallery({ memeList, setSelectedMemeIndex }) {
  function testSetSelectedMemeIndex(index) {
    setSelectedMemeIndex(index)
    console.log("selectedMemeIndex", index)
  }

  return (
    <div
      style={{
        maxWidth: 700,
        maxHeight: 300,
        padding: 24,
        fontFamily: 'sans-serif'
      }}
    >
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: 15, padding: 10, justifyContent: "center", maxHeight: 10000, overflowY: "auto" }}>
        {memeList.map((filename, index) => (
          <Image
            key={index}
            src={`/img/memes/${encodeURIComponent(filename)}`}
            alt={`Meme ${index}`}
            width={90}
            height={60}
            style={{
              cursor: "pointer",
              objectFit: "cover",
              border: "2px solid #ccc",
              borderRadius: "8px",
              transition: "transform 0.2s, border-color 0.2s",
            }}
            onClick={() => testSetSelectedMemeIndex(index)}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.05)"
              e.currentTarget.style.borderColor = "#888"
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)"
              e.currentTarget.style.borderColor = "#ccc"
            }}
          />
        ))}
      </div>
    </div>
  )
}
