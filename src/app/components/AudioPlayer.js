import { useEffect, useRef, useState } from 'react';

function AudioPlayer({ src, volumePlayer }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef(null);

  // Lecture automatique au chargement du composant
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      // Nécessaire pour certains navigateurs
      audio.volume = volumePlayer; // facultatif : volume réduit
      audio.play().catch((err) => {
        console.warn('Lecture bloquée par le navigateur :', err);
        setIsPlaying(false); // On désactive l’état "playing"
      });
    }
  }, [volumePlayer]);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => { });
    }

    setIsPlaying(!isPlaying);
  };

  return (
    <div>
      <audio ref={audioRef} src={src} />
      <div
        onClick={toggleAudio}
        className="cursor-pointer w-6 h-6 text-white hover:text-gray-400 transition"
      >
        <img
          src={isPlaying ? "img/icons/loudspeaker_on.png" : "img/icons/loudspeaker_off.png"}
          alt="Volume"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}

export default AudioPlayer;
