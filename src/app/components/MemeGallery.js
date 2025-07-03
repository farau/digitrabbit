'use client'

import Image from "next/image"
import Wrapper from '@/app/components/Wrapper';
import { useState, useEffect } from "react";

export default function MemeGallery({ memeList, setMemeList, setSelectedMemeIndex }) {

  function testSetSelectedMemeIndex(index) {
    setSelectedMemeIndex(index)
  }

  // Récupération de la liste des memes
  // (en supposant que l'API renvoie un tableau de noms de fichiers)  
  // (ex: ["meme1.jpg", "meme2.jpg", ...])
  useEffect(() => {
    fetch("/api/memes")
      .then((res) => res.json())
      .then((data) => setMemeList(data))
      .catch((err) => console.error("Erreur de chargement des memes", err));
  }, []);
  
  return (
    <Wrapper>  
      <p style={{ margin: 0, padding: 10, textAlign: "center", fontStyle: "italic" }}>
        &quot;You&apos;re gonna see too much Rabbitio, you may even get tired of seeing them and you will say PLEASE PLEASE it&apos;s too much RABBITIOOOO&quot;
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
    </Wrapper>
  )
}
