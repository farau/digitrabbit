'use client'

import Image from "next/image"
import Wrapper from '@/app/components/Wrapper';
import { useState, useEffect } from "react";

export default function Assets({ assetsList, setSelectedAssetsIndex }) {

  function testSetSelectedAssetsIndex(index) {
    setSelectedAssetsIndex(index)
  }


  return (
    <Wrapper>
      <p style={{ margin: 0, padding: 10, textAlign: "center" }}>
        Select an asset, bring it to something amazing and share it on socials!
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 15, padding: 10, justifyContent: "center", maxHeight: 10000, overflowY: "auto" }}>
        {assetsList.map((filename, index) => (
          <Image
            key={index}
            src={`/img/assets/${encodeURIComponent(filename)}`}
            alt={`Asset ${index}`}
            width={90}
            height={60}
            style={{
              cursor: "pointer",
              objectFit: "cover",
              border: "2px solid #ccc",
              borderRadius: "8px",
              transition: "transform 0.2s, border-color 0.2s",
            }}
            onClick={() => testSetSelectedAssetsIndex(index)}
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
    </Wrapper>
  )
}
