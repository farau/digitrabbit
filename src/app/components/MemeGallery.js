import Image from "next/image";

export default function MemeGallery({ memeList, setSelectedMemeIndex }) {

  function testSetSelectedMemeIndex(index) {
      setSelectedMemeIndex(index);
      console.log("selectedMemeIndex", index);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 15, padding: 10 }}>
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
            border: "1px solid #ccc",
          }}
          onClick={() => testSetSelectedMemeIndex(index)}
        />
      ))}
          
    </div>
  );
}
