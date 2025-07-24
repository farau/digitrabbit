import { useEffect, useRef, useState } from 'react';

function AudioPlayer({ src, volumePlayer }) {
  const [isPlaying, setIsPlaying] = useState(false); // Commence en pause pour iOS
  const [userInteracted, setUserInteracted] = useState(false);
  const audioRef = useRef(null);

  // Gestion du volume seulement (sans redémarrer la lecture)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volumePlayer;

    // Ne pas redémarrer automatiquement la lecture quand le volume change
    // La lecture ne reprend que si l'utilisateur clique sur l'icône
  }, [volumePlayer]);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Marquer qu'il y a eu une interaction utilisateur
    if (!userInteracted) {
      setUserInteracted(true);
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // S'assurer que le volume est à jour avant la lecture
      audio.volume = volumePlayer;

      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('Error when trying to play the audio :', err);
          setIsPlaying(false);
        });
    }
  };

  // Écouteurs d'événements pour synchroniser l'état
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata" // Optimisation pour mobile
      />

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