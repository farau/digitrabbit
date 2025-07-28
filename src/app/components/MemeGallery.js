'use client'

import Image from "next/image"
import Wrapper from '@/app/components/Wrapper';

export default function MemeGallery({ memeList, setSelectedMemeIndex }) {

  function testSetSelectedMemeIndex(index) {
    setSelectedMemeIndex(index)
  }


  return (
    <Wrapper>
      <p style={{ margin: 0, padding: 10, textAlign: "center", fontStyle: "italic" }}>
        You&apos;re gonna see so much Digit Rabbits memes, you may even get tired of Digit Rabbits.
      </p>
      <p style={{ marginBottom: 10, textAlign: "center", fontStyle: "italic" }}>
        And you&apos;ll say, &quot;Please, please. It&apos;s too much Digit Rabbits. I can&apos;t take it anymore. Mr. President, it&apos;s too much.&quot;
      </p>
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
    </Wrapper >
  )
}